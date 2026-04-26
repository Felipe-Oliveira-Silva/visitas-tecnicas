#!/usr/bin/env python3
"""
Baixa o PDF mais recente gerado e abre no visualizador padrão do sistema.
"""
import os, subprocess, tempfile
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
EMAIL    = "admin@relatec.com.br"
PASSWORD = "admin123"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx  = browser.new_context()
        page = ctx.new_page()

        # Login
        page.goto(f"{BASE_URL}/login")
        page.wait_for_load_state("networkidle")
        page.fill('input[type="email"]',    EMAIL)
        page.fill('input[type="password"]', PASSWORD)
        page.click('button[type="submit"]')
        page.wait_for_url("**/dashboard**", timeout=15000)
        print("✅ Login OK")

        # Listar relatórios
        r = page.request.get(f"{BASE_URL}/api/relatorios")
        reports = r.json() if r.ok else []
        if not reports:
            print("❌ Nenhum relatório encontrado")
            browser.close()
            return

        # Pegar o mais recente que tenha PDF
        report_with_pdf = None
        for rep in reports:
            if rep.get("pdf") or rep.get("status") in ("FINALIZED", "SIGNED"):
                report_with_pdf = rep
                break

        if not report_with_pdf:
            report_with_pdf = reports[0]

        rid = report_with_pdf["id"]
        print(f"   Relatório: {rid}  status={report_with_pdf.get('status')}")

        # Download PDF
        r = page.request.get(f"{BASE_URL}/api/relatorios/{rid}/pdf")
        body = r.body()
        print(f"   Status HTTP: {r.status}   Tamanho: {len(body):,} bytes")

        if r.status not in (200,) or len(body) < 100:
            print(f"❌ PDF não obtido (status={r.status})")
            browser.close()
            return

        if body[:4] != b"%PDF":
            print(f"⚠️  Conteúdo não parece PDF: {body[:16]}")

        browser.close()

    # Salvar e abrir
    out = Path(tempfile.gettempdir()) / f"relatorio_{rid[:8]}.pdf"
    out.write_bytes(body)
    print(f"✅ PDF salvo em: {out}")
    print("   Abrindo...")
    os.startfile(str(out))

if __name__ == "__main__":
    main()
