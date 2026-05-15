'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { SignOutButton } from '@/components/sign-out-button'

interface LandingNavProps {
  authenticated: boolean
}

const NAV_LINKS = [
  { href: '#recursos', label: 'Recursos' },
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'FAQ' },
]

export function LandingNav({ authenticated }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 8)
    handle()
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  const handleMobileAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const href = event.currentTarget.getAttribute('href')
    if (!href || !href.startsWith('#')) return
    event.preventDefault()
    setMobileOpen(false)
    window.setTimeout(() => {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  const headerClasses = [
    'fixed top-0 inset-x-0 z-50',
    'transition-[background-color,backdrop-filter,border-color] duration-300',
    scrolled
      ? 'bg-[#0d1b2a]/70 backdrop-blur-xl border-b border-white/10'
      : 'bg-transparent border-b border-transparent',
  ].join(' ')

  return (
    <>
      <header className={headerClasses}>
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Relatec — página inicial"
            className="font-extrabold tracking-widest text-lg bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
          >
            RELATEC
          </Link>

          <nav
            aria-label="Navegação principal"
            className="hidden md:flex items-center gap-8"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-300 text-sm hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md px-1 py-1"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {authenticated ? (
              <SignOutButton />
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-slate-300 text-sm hover:text-white transition-colors px-3 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Testar gratuitamente
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setMobileOpen((open) => !open)}
            className="md:hidden p-2 -mr-2 text-slate-200 hover:text-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {mobileOpen ? (
              <X size={24} aria-hidden="true" />
            ) : (
              <Menu size={24} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <div className="h-16" aria-hidden="true" />

      {mobileOpen && (
        <div
          id="landing-mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className="fixed inset-x-0 top-16 bottom-0 z-40 md:hidden bg-[#0a0f1a]/95 backdrop-blur-xl overflow-y-auto"
        >
          <div className="flex flex-col px-6 py-8">
            <nav
              aria-label="Navegação mobile"
              className="flex flex-col"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleMobileAnchorClick}
                  className="text-slate-200 text-lg py-4 border-b border-white/5 hover:text-cyan-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="mt-8 flex flex-col gap-3">
              {authenticated ? (
                <SignOutButton />
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center border border-white/15 text-slate-200 px-4 py-3 rounded-lg text-sm hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/cadastro"
                    onClick={() => setMobileOpen(false)}
                    className="w-full text-center bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold px-4 py-3 rounded-lg text-sm shadow-lg shadow-cyan-500/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    Testar gratuitamente
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
