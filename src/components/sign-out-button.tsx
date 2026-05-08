'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-1.5 border border-slate-600 text-slate-300 px-4 py-1.5 rounded-lg text-sm hover:bg-slate-700 hover:text-white transition-colors"
    >
      <LogOut size={14} />
      Sair
    </button>
  )
}
