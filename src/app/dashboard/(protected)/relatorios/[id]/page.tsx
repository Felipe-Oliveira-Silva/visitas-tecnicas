'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, FileText, User, Calendar, ClipboardList,
  Ruler, Eye, CheckCircle, PenLine, Loader2, AlertCircle
} from 'lucide-react'
import { GerarPdfButton } from './gerar-pdf-button'

type ReportStatus = 'DRAFT' | 'FINALIZED' | 'SIGNED'

interface Report {
  id: string
  status: ReportStatus
  observations: string | null
  checklistData: Record<string, boolean> | null
  measurementData: Record<string, string> | null
  createdAt: string
  updatedAt: string
  visit: {
    id: string
    scheduledAt: string
    realizedAt: string | null
    observations: string | null
    client: { id: string; name: string; email: string | null; phone: string | null }
    technician: { id: string; name: string; email: string }
  }
  filledBy: { id: string; name: string; email: string }
  signature: {
    id: string
    signerName: string
    signerDoc: string | null
    imagePath: string
    signedAt: string
  } | null
  pdf: {        
    pdfPath: string
  } | null
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: 'Rascunho',
  FINALIZED: 'Finalizado',
  SIGNED: 'Assinado',
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  DRAFT: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
  FINALIZED: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
  SIGNED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-slate-200 text-sm">{value || '—'}</span>
    </div>
  )
}

export default function ReportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [finalizing, setFinalizing] = useState(false)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string>('')

  async function fetchReport() {
    const res = await fetch(`/api/relatorios/${params.id}`)
    if (res.ok) setReport(await res.json())
    setLoading(false)
  }

  // Pegar role da sessão via endpoint simples
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(s => {
      if (s?.user?.role) setUserRole(s.user.role)
    })
    fetchReport()
  }, [])

  async function handleFinalizar() {
    if (!confirm('Finalizar o relatório? Ele não poderá mais ser editado.')) return
    setFinalizing(true)
    setError('')
    const res = await fetch(`/api/relatorios/${params.id}/finalizar`, { method: 'POST' })
    if (res.ok) {
      await fetchReport()
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao finalizar')
    }
    setFinalizing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-300">Relatório não encontrado</p>
        <Link href="/dashboard/relatorios" className="text-cyan-500 text-sm mt-2 inline-block">
          Voltar para relatórios
        </Link>
      </div>
    )
  }

  const canWrite = ['ADMIN', 'TECHNICIAN', 'SUPERADMIN'].includes(userRole)
  const canEdit = report.status === 'DRAFT' && canWrite
  const canFinalize = report.status === 'DRAFT' && canWrite
  const canSign = report.status === 'FINALIZED' && canWrite

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/relatorios"
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">Relatório</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status]}`}>
                {STATUS_LABELS[report.status]}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{report.visit.client.name}</p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {canEdit && (
            <Link
              href={`/dashboard/relatorios/${report.id}/editar`}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-slate-800 text-slate-100 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors text-sm font-medium"
            >
              <PenLine className="w-4 h-4" />
              Editar
            </Link>
          )}
          {canFinalize && (
            <button
              onClick={handleFinalizar}
              disabled={finalizing}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Finalizar
            </button>
          )}
          {canSign && (
            <Link
              href={`/dashboard/relatorios/${report.id}/assinar`}
              className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm font-medium"
            >
              <PenLine className="w-4 h-4" />
              Assinar
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Dados da Visita */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <Calendar className="w-4 h-4 text-cyan-500" />
          Dados da Visita
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <InfoRow label="Cliente" value={report.visit.client.name} />
          <InfoRow label="Telefone" value={report.visit.client.phone} />
          <InfoRow label="E-mail do cliente" value={report.visit.client.email} />
          <InfoRow label="Técnico" value={report.visit.technician.name} />
          <InfoRow
            label="Data agendada"
            value={new Date(report.visit.scheduledAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          />
          <InfoRow
            label="Data realizada"
            value={report.visit.realizedAt
              ? new Date(report.visit.realizedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })
              : null}
          />
        </div>
        {report.visit.observations && (
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Observações da visita</span>
            <p className="text-slate-300 text-sm mt-1">{report.visit.observations}</p>
          </div>
        )}
      </div>

      {/* Dados do Relatório */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-500" />
          Dados do Relatório
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Preenchido por" value={report.filledBy.name} />
          <InfoRow
            label="Criado em"
            value={new Date(report.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          />
        </div>

        {report.observations && (
          <div>
            <span className="text-xs text-slate-500 uppercase tracking-wide">Observações</span>
            <p className="text-slate-300 text-sm mt-1 whitespace-pre-wrap">{report.observations}</p>
          </div>
        )}
      </div>

      {/* Checklist */}
      {report.checklistData && Object.keys(report.checklistData).length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
          <h2 className="text-slate-100 font-semibold flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-cyan-500" />
            Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(report.checklistData).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                  value ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                }`}>
                  {value && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-slate-300 text-sm">{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medições */}
      {report.measurementData && Object.keys(report.measurementData).length > 0 && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
          <h2 className="text-slate-100 font-semibold flex items-center gap-2">
            <Ruler className="w-4 h-4 text-cyan-500" />
            Medições
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(report.measurementData).map(([key, value]) => (
              <div key={key} className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                <span className="text-xs text-slate-500 block">{key}</span>
                <span className="text-slate-100 font-medium text-sm">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assinatura */}
      {report.signature && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-5 space-y-3">
          <h2 className="text-slate-100 font-semibold flex items-center gap-2">
            <PenLine className="w-4 h-4 text-emerald-500" />
            Assinatura
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Signatário" value={report.signature.signerName} />
            <InfoRow label="Documento" value={report.signature.signerDoc} />
            <InfoRow
              label="Data da assinatura"
              value={new Date(report.signature.signedAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            />
          </div>
          <div className="mt-3">
            <span className="text-xs text-slate-500 uppercase tracking-wide block mb-2">Imagem da assinatura</span>
            <div className="bg-white rounded-lg p-2 inline-block max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/relatorios/${report.id}/signature-image`}
                alt="Assinatura"
                className="max-h-24 max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* PDF */}
      {report.status !== 'DRAFT' && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
          <h2 className="text-slate-100 font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-500" />
            PDF do Relatório
          </h2>
          <GerarPdfButton
            reportId={report.id}
            hasPdf={report.pdf !== null}
            status={report.status}
          />
        </div>
      )}

      {/* Status SIGNED - somente leitura */}
      {report.status === 'SIGNED' && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-emerald-400 text-sm">
            Este relatório está assinado e não pode ser alterado.
          </span>
        </div>
      )}
    </div>
  )
}
