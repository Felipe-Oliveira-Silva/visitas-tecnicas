"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { WHATSAPP_URL } from "@/lib/constants"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const check = await fetch(`/api/auth-check?email=${encodeURIComponent(email)}`)
    const checkData = await check.json()

    if (!checkData.ok && checkData.reason === "company_inactive") {
      setError("Esta empresa está desativada. Entre em contato com o suporte.")
      setLoading(false)
      return
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("E-mail ou senha incorretos.")
      setLoading(false)
      return
    }

    router.push("/dashboard")
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080d14",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @media (max-width: 639px) {
          .login-card { min-height: unset !important; }
          .login-left { display: none !important; }
          .login-right { padding: 2rem 1.5rem !important; }
        }
      `}</style>
      <div className="login-card" style={{
        display: "flex",
        width: "100%",
        maxWidth: "880px",
        minHeight: "540px",
        borderRadius: "16px",
        overflow: "hidden",
        border: "1px solid #1a2332",
      }}>

        {/* LADO ESQUERDO */}
        <div className="login-left" style={{
          flex: "1.1",
          background: "#0d1b2a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem",
          borderRight: "1px solid #1a2332",
        }}>
          <div>
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "2.5rem" }}>
              <div style={{
                width: "32px", height: "32px", background: "#0ea5e9",
                borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l4 4 8-8" />
                </svg>
              </div>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "#f0f6ff", letterSpacing: "-0.3px" }}>Relatec</span>
            </div>

            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#e2eaf4", lineHeight: 1.35, marginBottom: "1rem", letterSpacing: "-0.5px" }}>
              Gestão de visitas técnicas em campo
            </h2>
            <p style={{ fontSize: "14px", color: "#7a9ab8", lineHeight: 1.7, marginBottom: "2rem" }}>
              Plataforma B2B para equipes de campo. Relatórios, assinaturas e histórico em um único lugar.
            </p>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                {
                  icon: <path d="M2 4h10M2 7h7M2 10h5" />,
                  title: "Relatórios com PDF automático",
                  sub: "Gerado e salvo ao finalizar a visita",
                },
                {
                  icon: <><path d="M2 10 C4 6 8 4 12 6" /><circle cx="12" cy="6" r="1.5" /></>,
                  title: "Assinatura digital no dispositivo",
                  sub: "Canvas touchscreen, salva como PNG",
                },
                {
                  icon: <><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></>,
                  title: "Isolamento multi-tenant",
                  sub: "Dados separados por empresa",
                },
                {
                  icon: <><circle cx="7" cy="4" r="2.5" /><path d="M2 12c0-3 2-5 5-5s5 2 5 5" /></>,
                  title: "Perfis: leitor, técnico e admin",
                  sub: "Controle de acesso por role",
                },
              ].map((feat, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    background: "#122234", border: "1px solid #1e3347",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0ea5e9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      {feat.icon}
                    </svg>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#c8d8e8" }}>{feat.title}</span>
                    <span style={{ fontSize: "12px", color: "#5a7a96" }}>{feat.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid #131f2c" }}>
            <div style={{ display: "flex", gap: "2rem" }}>
              {[
                { num: "PDF", label: "Geração automática" },
                { num: "100%", label: "Multi-tenant" },
                { num: "Sign", label: "Assinatura digital" },
              ].map((stat, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#0ea5e9" }}>{stat.num}</span>
                  <span style={{ fontSize: "11px", color: "#5a7a96", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LADO DIREITO */}
        <div className="login-right" style={{
          flex: 1,
          background: "#080d14",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "2.5rem",
        }}>
          <p style={{ fontSize: "30px", fontWeight: 700, color: "#e2eaf4", marginBottom: "4px", letterSpacing: "-0.3px" }}>
            Bem-vindo 
          </p>
          <p style={{ fontSize: "13px", color: "#5a7a96", marginBottom: "2rem" }}>
            Acesse sua conta para continuar
          </p>

          {error && (
            <div style={{
              background: "#1a0a0a", border: "1px solid #5c1a1a",
              color: "#f87171", fontSize: "12px",
              padding: "10px 14px", borderRadius: "8px", marginBottom: "1.25rem",
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#7a9ab8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                style={{
                  background: "#0d1b2a", border: "1px solid #1e3347",
                  borderRadius: "8px", padding: "11px 14px",
                  fontSize: "14px", color: "#e2eaf4",
                  outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>

            {/* Senha */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "1rem" }}>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#7a9ab8", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  background: "#0d1b2a", border: "1px solid #1e3347",
                  borderRadius: "8px", padding: "11px 14px",
                  fontSize: "14px", color: "#e2eaf4",
                  outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: loading ? "#0369a1" : "#0ea5e9",
                color: "#fff", fontSize: "14px", fontWeight: 700,
                padding: "12px", borderRadius: "8px", border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em", fontFamily: "inherit", marginTop: "0.25rem",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "1.5rem 0" }}>
            <div style={{ flex: 1, height: "1px", background: "#131f2c" }} />
            <span style={{ fontSize: "11px", color: "#3d5a72" }}>acesso restrito</span>
            <div style={{ flex: 1, height: "1px", background: "#131f2c" }} />
          </div>

          <p style={{ fontSize: "11px", color: "#3d5a72", textAlign: "center", lineHeight: 1.8 }}>
            Sem conta? Fale com o administrador da sua empresa para obter acesso ou consulte nosso{" "}

              <a href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#25d366", fontWeight: 700, textDecoration: "none", fontSize: "11px" }}
            >
              SUPORTE
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}