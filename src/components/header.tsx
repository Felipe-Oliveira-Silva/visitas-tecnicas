'use client'

import { useSession, signOut } from 'next-auth/react'
import { Bell, LogOut, ChevronDown, Shield } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export function Header({ title }: { title?: string }) {
  const { data: session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)

  const roleLabel: Record<string, string> = {
    ADMIN: 'Administrador',
    TECHNICIAN: 'Técnico',
    READER: 'Leitor',
    SUPERADMIN: 'Super Admin',
  }

  const initials = session?.user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  const isSuperAdmin = session?.user?.role === 'SUPERADMIN'

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur border-b border-slate-700/50 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        {title && (
          <h1 className="text-white font-semibold text-lg leading-none">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button className="relative w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
          <Bell size={16} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-slate-100 text-sm font-medium leading-none">{session?.user?.name ?? 'Usuário'}</p>
              <p className="text-slate-500 text-xs leading-none mt-0.5">
                {roleLabel[session?.user?.role ?? ''] ?? session?.user?.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-white text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-slate-400 text-xs truncate">{session?.user?.email}</p>
              </div>

              {isSuperAdmin && (
                <Link
                  href="/superadmin"
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                >
                  <Shield size={14} />
                  Painel Super Admin
                </Link>
              )}

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
              >
                <LogOut size={14} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}