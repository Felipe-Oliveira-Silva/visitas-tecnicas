'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  FileText,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Zap,
  CreditCard,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    label: 'Usuários',
    href: '/dashboard/usuarios',
    icon: Users,
    adminOnly: false,
  },
  {
    label: 'Clientes',
    href: '/dashboard/clientes',
    icon: Building2,
    adminOnly: false,
  },
  {
    label: 'Visitas',
    href: '/dashboard/visitas',
    icon: ClipboardList,
    adminOnly: false,
  },
  {
    label: 'Relatórios',
    href: '/dashboard/relatorios',
    icon: FileText,
    adminOnly: false,
  },
  {
    label: 'Orçamentos',
    href: '/dashboard/orcamentos',
    icon: Receipt,
    adminOnly: false,
  },
  {
    label: 'Plano',
    href: '/dashboard/plano',
    icon: CreditCard,
    adminOnly: true,
  },
]

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role
  const isAdminOrSuper = role === 'ADMIN' || role === 'SUPERADMIN'

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdminOrSuper)

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:inset-auto md:z-auto
          flex flex-col h-full
          bg-slate-900 border-r border-slate-700/50
          transition-all duration-300 ease-in-out
          w-64
          ${collapsed ? 'md:w-16' : 'md:w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700/50 ${collapsed ? 'md:justify-center' : ''}`}>
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap size={16} className="text-white" />
          </div>
          <div className={collapsed ? 'md:hidden' : ''}>
            <span className="text-white font-bold text-lg tracking-tight leading-none">Relatec</span>
            <p className="text-slate-400 text-[10px] leading-none mt-0.5">Suas visitas, documentadas.</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`
                  group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-150
                  ${collapsed ? 'md:justify-center' : ''}
                  ${isActive
                    ? 'bg-cyan-500/15 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }
                `}
              >
                <Icon
                  size={18}
                  className={`flex-shrink-0 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'}`}
                />
                <span className={collapsed ? 'md:hidden' : ''}>{item.label}</span>
                {isActive && (
                  <span className={`ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 ${collapsed ? 'md:hidden' : ''}`} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse button — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`
            hidden md:flex
            absolute -right-3 top-[72px]
            w-6 h-6 rounded-full bg-slate-800 border border-slate-600
            items-center justify-center
            text-slate-400 hover:text-white hover:bg-slate-700
            transition-all duration-150 shadow-md z-10
          `}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Footer */}
        <div className={`px-4 py-3 border-t border-slate-700/50 ${collapsed ? 'md:hidden' : 'block'}`}>
          <p className="text-slate-600 text-[10px] text-center">v2.0.0 · Relatec</p>
        </div>
      </aside>
    </>
  )
}
