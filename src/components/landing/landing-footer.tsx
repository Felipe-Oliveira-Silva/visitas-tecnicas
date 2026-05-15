import Link from 'next/link'
import { WHATSAPP_URL } from '@/lib/constants'

interface LandingFooterProps {
  authenticated: boolean
}

export function LandingFooter({ authenticated }: LandingFooterProps) {
  return (
    <footer className="relative">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="text-center">
          <Link
            href="/"
            aria-label="Relatec — página inicial"
            className="inline-block font-extrabold tracking-widest text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
          >
            RELATEC
          </Link>

          <p className="mt-4 text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Visitas técnicas, relatórios, orçamentos e PDFs organizados em um
            só lugar.
          </p>

          <nav
            aria-label="Links do rodapé"
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
          >
            {!authenticated && (
              <>
                <Link
                  href="/login"
                  className="text-slate-400 hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-1 py-1"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-slate-400 hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-1 py-1"
                >
                  Cadastrar
                </Link>
              </>
            )}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-1 py-1"
            >
              WhatsApp
            </a>
          </nav>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500">
            © 2026 Relatec. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
