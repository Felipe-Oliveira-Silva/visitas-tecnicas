#!/usr/bin/env python3
"""
R2 Flow Validation — teste automatizado end-to-end
Valida: assinatura → R2, PDF gerado → R2, download via presigned URL
"""
import sys, json, struct, zlib, base64, time, os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL   = "http://localhost:3000"
EMAIL      = "admin@relatec.com.br"
PASSWORD   = "admin123"
LOCAL_UPL  = Path("C:/Users/Usuario/Desktop/visitas-tecnicas/public/uploads")
ENV_FILE   = Path("C:/Users/Usuario/Desktop/visitas-tecnicas/.env")

ok_list, fail_list, skip_list = [], [], []

def check(label, ok, detail=""):
    mark = "✅" if ok else "❌"
    print(f"  {mark} {label}" + (f"  [{detail}]" if detail else ""))
    (ok_list if ok else fail_list).append(label)
    return ok

def skip(label, reason=""):
    print(f"  ⚠️  {label}  [SKIP: {reason}]")
    skip_list.append(label)

def create_png_b64():
    w, h = 100, 50
    def chunk(t, d):
        c = t + d
        return struct.pack(">I", len(d)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
    raw  = b"".join(b"\x00" + b"\xff\xff\xff" * w for _ in range(h))
    idat = chunk(b"IDAT", zlib.compress(raw))
    iend = chunk(b"IEND", b"")
    return "data:image/png;base64," + base64.b64encode(b"\x89PNG\r\n\x1a\n" + ihdr + idat + iend).decode()

def req(page, method, path, body=None):
    url = f"{BASE_URL}{path}"
    if method == "GET":
        return page.request.get(url)
    if method == "PUT":
        return page.request.fetch(url, method="PUT",
            data=json.dumps(body or {}),
            headers={"Content-Type": "application/json"})
    return page.request.post(url,
        data=json.dumps(body or {}),
        headers={"Content-Type": "application/json"})

def check_r2_credentials():
    """Verifica se as credenciais R2 são reais ou placeholder."""
    if not ENV_FILE.exists():
        return False, "sem .env"
    env = ENV_FILE.read_text()
    if "placeholder" in env.lower():
        return False, "credenciais placeholder no .env"
    required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]
    missing = [k for k in required if k not in env]
    if missing:
        return False, f"variáveis ausentes: {missing}"
    return True, "ok"

def new_files_since(directory: Path, since_ts: float):
    if not directory.exists():
        return []
    return [f for f in directory.iterdir() if f.stat().st_mtime > since_ts]

def main():
    print("=" * 55)
    print("  R2 Flow Validation")
    print("=" * 55)

    r2_ok, r2_reason = check_r2_credentials()
    if not r2_ok:
        print(f"\n  ⚠️  R2 NAO CONFIGURADO: {r2_reason}")
        print("  Testes de R2 serão executados mas devem falhar com 500.")
        print("  Configure .env.local com credenciais reais para validar.")
    else:
        print("  ✅ Credenciais R2 detectadas.")
    print()

    test_start = time.time()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx  = browser.new_context()
        page = ctx.new_page()

        # ── Login ─────────────────────────────────────────────────────────────
        print("▸ Login")
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill('input[type="email"]',    EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        try:
            page.wait_for_url("**/dashboard**", timeout=15000)
            check("Login como admin", True)
        except Exception as e:
            check("Login como admin", False, str(e))
            browser.close(); return False

        sess       = req(page, "GET", "/api/auth/session").json()
        user_id    = sess.get("user", {}).get("id",        "?")
        company_id = sess.get("user", {}).get("companyId", "?")
        print(f"     user={user_id}  company={company_id}")

        # ── Cliente ───────────────────────────────────────────────────────────
        print("\n▸ Cliente")
        cl_res  = req(page, "GET", "/api/clientes")
        cl_list = cl_res.json() if cl_res.ok and isinstance(cl_res.json(), list) else []
        if cl_list:
            client_id = cl_list[0]["id"]
            check("Usar cliente existente", True, cl_list[0]["name"])
        else:
            r = req(page, "POST", "/api/clientes", {
                "name": "Cliente Teste R2", "city": "Sao Paulo", "state": "SP"
            })
            if not check("Criar cliente", r.ok, r.text() if not r.ok else ""):
                browser.close(); return False
            client_id = r.json()["id"]

        # ── Visita ────────────────────────────────────────────────────────────
        print("\n▸ Visita")
        r = req(page, "POST", "/api/visitas", {
            "clientId": client_id, "technicianId": user_id,
            "scheduledAt": "2026-04-25T10:00:00.000Z"
        })
        if not check("Criar visita", r.ok, r.text() if not r.ok else ""):
            browser.close(); return False
        visit_id = r.json()["id"]
        r2u = req(page, "PUT", f"/api/visitas/{visit_id}", {"status": "REALIZED"})
        check("Marcar visita como REALIZED", r2u.ok, r2u.text() if not r2u.ok else "")
        print(f"     visit_id={visit_id}")

        # ── Relatório ─────────────────────────────────────────────────────────
        print("\n▸ Relatório")
        r = req(page, "POST", "/api/relatorios", {"visitId": visit_id})
        if not check("Criar relatório", r.ok, r.text() if not r.ok else ""):
            browser.close(); return False
        report_id = r.json()["id"]
        print(f"     report_id={report_id}")

        # ── Finalizar ─────────────────────────────────────────────────────────
        print("\n▸ Finalizar (DRAFT → FINALIZED)")
        r = req(page, "POST", f"/api/relatorios/{report_id}/finalizar", {})
        check("Finalizar relatório", r.ok, f"status={r.status}")

        # ── Assinatura ────────────────────────────────────────────────────────
        print("\n▸ Assinatura → R2")
        r = req(page, "POST", f"/api/relatorios/{report_id}/assinar", {
            "signerName":  "Teste R2 Automatico",
            "signerDoc":   "000.000.000-00",
            "imageBase64": create_png_b64()
        })
        sign_ok = r.ok
        if sign_ok:
            sig      = r.json()
            img_path = sig.get("imagePath", "")
            expected = f"{company_id}/signatures/{report_id}.png"
            check("Upload assinatura para R2", True)
            check("R2 key com formato correto", img_path == expected,
                  f"got='{img_path}'  want='{expected}'")
        else:
            if not r2_ok:
                skip("Upload assinatura para R2", f"R2 nao configurado — status={r.status}")
                skip("R2 key com formato correto", "depende do upload")
            else:
                check("Upload assinatura para R2", False,
                      f"status={r.status}  body={r.text()[:200]}")

        # ── Filesystem local (assinatura) ─────────────────────────────────────
        print("\n▸ Filesystem local — signatures")
        new_sigs = new_files_since(LOCAL_UPL / "signatures", test_start)
        check("Nenhum arquivo novo em public/uploads/signatures/",
              len(new_sigs) == 0,
              f"novos={new_sigs}" if new_sigs else "ok (arquivos legados ignorados)")

        # ── Endpoint signature-image ──────────────────────────────────────────
        print("\n▸ Endpoint signature-image")
        r = req(page, "GET", f"/api/relatorios/{report_id}/signature-image")
        if sign_ok:
            body_len = len(r.body())
            check("signature-image retorna imagem via R2",
                  r.status not in (404, 500, 503) and body_len > 100,
                  f"status={r.status}  bytes={body_len}")
        else:
            check("signature-image → 404 (sem assinatura salva)", r.status == 404,
                  f"status={r.status}")

        # ── Gerar PDF ─────────────────────────────────────────────────────────
        print("\n▸ Gerar PDF → R2")
        r = req(page, "POST", f"/api/relatorios/{report_id}/gerar-pdf", {})
        pdf_gen_ok = r.ok
        if r.ok:
            check("PDF gerado com sucesso", True)
        else:
            body_txt = r.text()
            if not r2_ok or not sign_ok:
                skip("PDF gerado com sucesso", f"R2 nao configurado — status={r.status}")
            else:
                check("PDF gerado com sucesso", False,
                      f"status={r.status}  body={body_txt[:200]}")

        # ── Filesystem local (PDF) ────────────────────────────────────────────
        print("\n▸ Filesystem local — PDFs")
        new_pdfs = new_files_since(LOCAL_UPL / "pdfs", test_start)
        check("Nenhum arquivo novo em public/uploads/pdfs/",
              len(new_pdfs) == 0,
              f"novos={new_pdfs}" if new_pdfs else "ok")

        # ── R2 key do PDF no DB ───────────────────────────────────────────────
        if pdf_gen_ok:
            r_rep = req(page, "GET", f"/api/relatorios/{report_id}")
            if r_rep.ok:
                pdf_obj  = r_rep.json().get("pdf") or {}
                pdf_path = pdf_obj.get("pdfPath", "")
                expected_pdf = f"{company_id}/reports/{report_id}/report.pdf"
                check("R2 key do PDF com formato correto",
                      pdf_path == expected_pdf,
                      f"got='{pdf_path}'")

        # ── Download PDF ──────────────────────────────────────────────────────
        print("\n▸ Download PDF (/api/relatorios/{id}/pdf)")
        r = req(page, "GET", f"/api/relatorios/{report_id}/pdf")
        body = r.body()
        if pdf_gen_ok:
            check("Download retorna conteudo (nao 404/500)",
                  r.status not in (404, 500), f"status={r.status}")
            check("Conteudo comeca com %PDF",
                  body[:4] == b"%PDF", f"primeiros bytes={body[:4]}")
            check("PDF tem tamanho razoavel (>2 KB)",
                  len(body) > 2000, f"{len(body):,} bytes")
        else:
            check("Download sem PDF gerado → 404", r.status == 404, f"status={r.status}")

        # ── Validações negativas ──────────────────────────────────────────────
        print("\n▸ Validacoes negativas")

        # Visita + relatório DRAFT para testes negativos
        r_v2 = req(page, "POST", "/api/visitas", {
            "clientId": client_id, "technicianId": user_id,
            "scheduledAt": "2026-04-26T10:00:00.000Z"
        })
        if r_v2.ok:
            v2_id = r_v2.json()["id"]
            req(page, "PUT", f"/api/visitas/{v2_id}", {"status": "REALIZED"})
            r_r2 = req(page, "POST", "/api/relatorios", {"visitId": v2_id})
            if r_r2.ok:
                draft_id = r_r2.json()["id"]

                r = req(page, "GET", f"/api/relatorios/{draft_id}/pdf")
                check("PDF de relatorio sem PDF gerado → 404",
                      r.status == 404, f"status={r.status}")

                r = req(page, "POST", f"/api/relatorios/{draft_id}/gerar-pdf", {})
                check("Gerar PDF de DRAFT → 400",
                      r.status == 400, f"status={r.status}")

                r = req(page, "GET", f"/api/relatorios/{draft_id}/signature-image")
                check("signature-image sem assinatura → 404",
                      r.status == 404, f"status={r.status}")
            else:
                print("  ⚠️  Nao foi possivel criar relatorio draft para testes negativos")
        else:
            print("  ⚠️  Nao foi possivel criar visita extra para testes negativos")

        browser.close()

    # ── Resumo ────────────────────────────────────────────────────────────────
    total = len(ok_list) + len(fail_list)
    print(f"\n{'=' * 55}")
    print(f"  Resultado: {len(ok_list)}/{total} ✅" +
          (f"   {len(skip_list)} pulados (R2 nao configurado)" if skip_list else "") +
          (f"   {len(fail_list)} ❌" if fail_list else ""))
    if fail_list:
        print("  Falhas:")
        for f in fail_list:
            print(f"    ✗ {f}")
    if not r2_ok:
        print(f"\n  PROXIMOS PASSOS:")
        print(f"  Configure .env.local com as credenciais R2 reais e rode novamente.")
    print("=" * 55)
    return len(fail_list) == 0

if __name__ == "__main__":
    sys.exit(0 if main() else 1)
