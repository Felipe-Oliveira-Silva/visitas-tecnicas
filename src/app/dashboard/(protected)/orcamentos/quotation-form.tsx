'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, Save } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

type ClientOption = { id: string; name: string }
type VisitOption  = { id: string; scheduledAt: string; status: string }

type ItemData = {
  description: string
  quantity:    string
  unitPrice:   string
}

type FormState = {
  clientId:    string
  visitId:     string
  title:       string
  description: string
  notes:       string
  validUntil:  string
  discount:    string
}

export type QuotationInitialData = {
  id?:          string
  clientId?:    string
  visitId?:     string
  title?:       string
  description?: string | null
  notes?:       string | null
  validUntil?:  string | null
  discount?:    number
  items?:       Array<{ description: string; quantity: number; unitPrice: number }>
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const inputClass = `
  w-full bg-slate-800 border border-slate-700 text-slate-100
  rounded-lg px-3 py-2.5 text-sm
  placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500
  transition-colors
`

const labelClass = "block text-sm font-medium text-slate-300 mb-1.5"

const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

// ── Helpers ────────────────────────────────────────────────────────────────────

function visitStatusLabel(status: string): string {
  if (status === 'SCHEDULED')    return 'Agendada'
  if (status === 'REALIZED')     return 'Realizada'
  if (status === 'NOT_REALIZED') return 'Não realizada'
  return status
}

function parseNum(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0
}

// ── ItemEditor sub-component ───────────────────────────────────────────────────

type ItemEditorProps = {
  item:     ItemData
  total:    number
  onlyOne:  boolean
  onChange: (field: keyof ItemData, value: string) => void
  onRemove: () => void
}

function ItemEditor({ item, total, onlyOne, onChange, onRemove }: ItemEditorProps) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
      {/* Description row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <label className="block text-xs text-slate-500 mb-1">Descrição *</label>
          <input
            type="text"
            value={item.description}
            onChange={e => onChange('description', e.target.value)}
            required
            placeholder="Ex: Troca de filtro de ar"
            className={inputClass}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={onlyOne}
          title="Remover item"
          className="mt-6 flex-shrink-0 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-red-400/10"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Qty / Unit price / Total */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Qtd *</label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={item.quantity}
            onChange={e => onChange('quantity', e.target.value)}
            required
            placeholder="1"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Valor unit. *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={e => onChange('unitPrice', e.target.value)}
            required
            placeholder="0,00"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Total</label>
          <div className="w-full bg-slate-700/40 border border-slate-700/60 text-amber-400 rounded-lg px-3 py-2.5 text-sm font-medium">
            {fmt.format(total)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── QuotationForm ──────────────────────────────────────────────────────────────

type Props = {
  mode:         'create' | 'edit'
  initialData?: QuotationInitialData
}

export function QuotationForm({ mode, initialData }: Props) {
  const router = useRouter()

  const [clients, setClients] = useState<ClientOption[]>([])
  const [visits, setVisits]   = useState<VisitOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState<FormState>({
    clientId:    initialData?.clientId    ?? '',
    visitId:     initialData?.visitId     ?? '',
    title:       initialData?.title       ?? '',
    description: initialData?.description ?? '',
    notes:       initialData?.notes       ?? '',
    validUntil:  initialData?.validUntil  ?? '',
    discount:    initialData?.discount != null ? String(initialData.discount) : '',
  })

  const [items, setItems] = useState<ItemData[]>(() =>
    initialData?.items?.length
      ? initialData.items.map(i => ({
          description: i.description,
          quantity:    String(i.quantity),
          unitPrice:   String(i.unitPrice),
        }))
      : [{ description: '', quantity: '', unitPrice: '' }]
  )

  // Load client list on mount
  useEffect(() => {
    fetch('/api/clientes')
      .then(r => r.json())
      .then(setClients)
      .catch(() => {/* ignore — user sees empty list */})
  }, [])

  // Load visits for selected client
  useEffect(() => {
    if (!form.clientId) {
      setVisits([])
      return
    }
    fetch(`/api/visitas?clientId=${form.clientId}`)
      .then(r => r.json())
      .then(setVisits)
      .catch(() => setVisits([]))
  }, [form.clientId])

  // ── Computed totals (display only) ─────────────────────────────────────────

  const itemTotals = items.map(item => parseNum(item.quantity) * parseNum(item.unitPrice))
  const subtotal    = itemTotals.reduce((a, b) => a + b, 0)
  const discountNum = parseNum(form.discount)
  const total       = Math.max(0, subtotal - discountNum)

  // ── Item helpers ────────────────────────────────────────────────────────────

  function setItem(idx: number, field: keyof ItemData, value: string) {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', quantity: '', unitPrice: '' }])
  }

  function removeItem(idx: number) {
    if (items.length === 1) return
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (items.some(i => !i.description.trim() || !i.quantity || !i.unitPrice)) {
      setError('Preencha todos os campos dos itens antes de salvar.')
      return
    }

    setLoading(true)

    const payload = {
      title:       form.title.trim(),
      description: form.description.trim() || null,
      notes:       form.notes.trim()       || null,
      validUntil:  form.validUntil ? `${form.validUntil}T12:00:00.000Z` : null,
      discount:    parseNum(form.discount),
      clientId:    form.clientId,
      visitId:     form.visitId || null,
      items:       items.map((item, idx) => ({
        description: item.description.trim(),
        quantity:    parseNum(item.quantity),
        unitPrice:   parseNum(item.unitPrice),
        order:       idx,
      })),
    }

    try {
      const url    = mode === 'create' ? '/api/quotations' : `/api/quotations/${initialData?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar orçamento')
        return
      }

      const saved = await res.json()
      router.push(`/dashboard/orcamentos/${saved.id}`)
      router.refresh()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* ── Dados gerais ─────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-200">Dados Gerais</h2>

        {/* Título */}
        <div>
          <label className={labelClass}>Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Ex: Manutenção preventiva — Julho 2025"
            className={inputClass}
          />
        </div>

        {/* Cliente + Visita */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Cliente *</label>
            <select
              value={form.clientId}
              onChange={e => setForm(f => ({ ...f, clientId: e.target.value, visitId: '' }))}
              required
              className={inputClass + ' [color-scheme:dark]'}
            >
              <option value="" className="bg-slate-800">Selecione...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-800">{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Visita vinculada{' '}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <select
              value={form.visitId}
              onChange={e => setForm(f => ({ ...f, visitId: e.target.value }))}
              disabled={!form.clientId}
              className={inputClass + ' [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed'}
            >
              <option value="" className="bg-slate-800">
                {form.clientId ? 'Nenhuma' : 'Selecione um cliente primeiro'}
              </option>
              {visits.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-800">
                  {new Date(v.scheduledAt).toLocaleDateString('pt-BR')} —{' '}
                  {visitStatusLabel(v.status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Validade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Válido até{' '}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={form.validUntil}
              onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))}
              className={inputClass + ' [color-scheme:dark]'}
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className={labelClass}>
            Descrição{' '}
            <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            placeholder="Escopo do orçamento, condições gerais..."
            className={inputClass + ' resize-none'}
          />
        </div>

        {/* Observações */}
        <div>
          <label className={labelClass}>
            Observações{' '}
            <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={2}
            placeholder="Condições de pagamento, prazo de entrega, garantias..."
            className={inputClass + ' resize-none'}
          />
        </div>
      </div>

      {/* ── Itens ────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Itens do Orçamento</h2>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:border-amber-500/60 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> Adicionar item
          </button>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <ItemEditor
              key={idx}
              item={item}
              total={itemTotals[idx]}
              onlyOne={items.length === 1}
              onChange={(field, value) => setItem(idx, field, value)}
              onRemove={() => removeItem(idx)}
            />
          ))}
        </div>

        {/* Totais */}
        <div className="pt-4 border-t border-slate-700 space-y-3">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span className="font-medium text-slate-200">{fmt.format(subtotal)}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label htmlFor="discount" className="text-sm text-slate-400 whitespace-nowrap">
              Desconto (R$)
            </label>
            <input
              id="discount"
              type="number"
              min="0"
              step="0.01"
              value={form.discount}
              onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
              placeholder="0,00"
              className="w-36 bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            />
          </div>

          {discountNum > 0 && discountNum > subtotal && (
            <p className="text-xs text-red-400">
              O desconto não pode ser maior que o subtotal.
            </p>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <span className="text-base font-bold text-slate-100">Total</span>
            <span className="text-lg font-bold text-amber-400">{fmt.format(total)}</span>
          </div>
        </div>
      </div>

      {/* ── Botões ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pb-6">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold px-5 py-3 min-h-[44px] rounded-lg text-sm transition-colors"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {loading ? 'Salvando...' : mode === 'create' ? 'Criar Orçamento' : 'Salvar Alterações'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="border border-slate-600 text-slate-300 hover:bg-slate-800 px-5 py-3 min-h-[44px] rounded-lg text-sm transition-colors"
        >
          Cancelar
        </button>
      </div>

    </form>
  )
}
