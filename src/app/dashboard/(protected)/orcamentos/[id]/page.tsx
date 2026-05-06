import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Building2, Calendar, User, FileText, Pencil } from 'lucide-react'
import { QuotationStatus } from '@prisma/client'
import { ChangeStatusButton } from './change-status-button'
import { GerarPdfButton } from './gerar-pdf-button'

const statusConfig: Record<QuotationStatus, { label: string; color: string }> = {
  DRAFT:    { label: 'Rascunho', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
  SENT:     { label: 'Enviado',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  APPROVED: { label: 'Aprovado', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  REJECTED: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-400 border-red-500/30' },
}

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default async function OrcamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  const quotation = await prisma.quotation.findFirst({
    where: { id, companyId: session.user.companyId },
    include: {
      items:     { orderBy: { order: 'asc' } },
      client:    { select: { id: true, name: true, city: true, state: true } },
      visit:     { select: { id: true, scheduledAt: true } },
      createdBy: { select: { id: true, name: true } },
      pdf:       true,
    },
  })

  if (!quotation) notFound()

  const cfg      = statusConfig[quotation.status]
  const canEdit  = session.user.role !== 'READER'
  const orcCode  = `ORC-${quotation.id.slice(-6).toUpperCase()}`
  const subtotal = quotation.subtotal.toNumber()
  const discount = quotation.discount.toNumber()
  const total    = quotation.total.toNumber()

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/orcamentos" className="text-sm text-slate-400 hover:text-slate-100 transition-colors mb-1 inline-block py-2">
            ← Voltar para orçamentos
          </Link>
          <h1 className="text-2xl font-bold text-slate-100">{quotation.title}</h1>
          <p className="text-sm text-slate-500 font-mono mt-1">{orcCode}</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full border self-start ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Informações */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Cliente</p>
              <Link href={`/dashboard/clientes/${quotation.client.id}`} className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors">
                {quotation.client.name}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User size={18} className="text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Criado por</p>
              <p className="text-sm font-medium text-slate-100">{quotation.createdBy.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Criado em</p>
              <p className="text-sm font-medium text-slate-100">
                {new Date(quotation.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          {quotation.validUntil && (
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-amber-500" />
              <div>
                <p className="text-xs text-slate-500">Válido até</p>
                <p className="text-sm font-medium text-slate-100">
                  {new Date(quotation.validUntil).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}
          {quotation.visit && (
            <div className="flex items-center gap-3 sm:col-span-2">
              <FileText size={18} className="text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Visita vinculada</p>
                <Link href={`/dashboard/visitas/${quotation.visit.id}`} className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                  {new Date(quotation.visit.scheduledAt).toLocaleDateString('pt-BR')} — ver visita
                </Link>
              </div>
            </div>
          )}
        </div>

        {quotation.description && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Descrição</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{quotation.description}</p>
          </div>
        )}

        {quotation.notes && (
          <div className="pt-4 border-t border-slate-700">
            <p className="text-xs text-slate-500 mb-1">Observações</p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{quotation.notes}</p>
          </div>
        )}
      </div>

      {/* Itens */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-100">Itens do Orçamento</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Descrição</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Qtd</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Unit.</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/40">
              {quotation.items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-3 text-slate-200">{item.description}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{item.quantity.toNumber()}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{fmt.format(item.unitPrice.toNumber())}</td>
                  <td className="px-6 py-3 text-right font-medium text-slate-200">{fmt.format(item.total.toNumber())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="px-6 py-4 border-t border-slate-700 space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span>{fmt.format(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-400">
              <span>Desconto</span>
              <span>− {fmt.format(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-amber-400 pt-2 border-t border-slate-700">
            <span>Total</span>
            <span>{fmt.format(total)}</span>
          </div>
        </div>
      </div>

      {/* Ações — status + edição */}
      {canEdit && (
        <div className="flex flex-wrap gap-3">
          <ChangeStatusButton
            quotationId={quotation.id}
            currentStatus={quotation.status}
            userRole={session.user.role}
          />
          {quotation.status === 'DRAFT' && (
            <Link
              href={`/dashboard/orcamentos/${quotation.id}/editar`}
              className="flex items-center gap-2 border border-slate-700 text-slate-100 px-4 py-3 min-h-[44px] rounded-lg text-sm hover:border-slate-500 transition-colors"
            >
              <Pencil size={14} /> Editar
            </Link>
          )}
        </div>
      )}

      {/* PDF */}
      <GerarPdfButton
        quotationId={quotation.id}
        hasPdf={!!quotation.pdf}
      />
    </div>
  )
}
