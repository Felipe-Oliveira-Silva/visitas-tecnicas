'use client'

import { WHATSAPP_URL } from '@/lib/constants'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  resource: 'visits' | 'users'
  limit: number
  current: number
}

const WA_MSG = encodeURIComponent('Olá! Atingi o limite do meu plano e gostaria de fazer upgrade.')

export function UpgradeModal({ open, onClose, resource, limit, current }: UpgradeModalProps) {
  if (!open) return null

  const resourceLabel = resource === 'visits' ? 'visitas' : 'usuários'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <h2 className="text-white font-bold text-lg mb-2">Limite atingido 🚫</h2>
        <p className="text-slate-400 text-sm mb-6">
          Você usou {current}/{limit} {resourceLabel} este mês. Faça upgrade para continuar.
        </p>
        <div className="flex flex-col gap-3">
          <a
            href={`${WHATSAPP_URL}?text=${WA_MSG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20bc5a] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            💬 Fazer upgrade via WhatsApp
          </a>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
