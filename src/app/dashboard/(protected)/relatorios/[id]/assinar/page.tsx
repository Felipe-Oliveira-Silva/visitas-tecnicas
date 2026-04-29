'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PenLine, Trash2, CheckCircle, Loader2, AlertCircle } from 'lucide-react'

// Fixed CSS height for the signature area — tall enough for comfortable finger signing
const CANVAS_CSS_HEIGHT = 200

export default function AssinarRelatorioPage() {
  const params = useParams()
  const router = useRouter()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isDrawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)

  const [signerName, setSignerName] = useState('')
  const [signerDoc, setSignerDoc] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/relatorios/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.status !== 'FINALIZED') {
          router.replace(`/dashboard/relatorios/${params.id}`)
          return
        }
        setLoading(false)
      })
  }, [])

  // Initialise (or re-initialise) canvas dimensions and context.
  // Setting canvas.width/height resets the context transform, so we must
  // re-apply ctx.scale(dpr, dpr) every call.  After this, all drawing
  // commands work in CSS-pixel coordinates — no manual scale needed in getPos.
  function setupCanvas() {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const cssWidth = wrapper.clientWidth
    if (cssWidth === 0) return

    const dpr = window.devicePixelRatio || 1

    canvas.width  = Math.round(cssWidth * dpr)
    canvas.height = Math.round(CANVAS_CSS_HEIGHT * dpr)
    canvas.style.width  = cssWidth + 'px'
    canvas.style.height = CANVAS_CSS_HEIGHT + 'px'

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth   = 2.5
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'

    setIsEmpty(true)
  }

  useEffect(() => {
    if (loading) return

    setupCanvas()

    function handleResize() { setupCanvas() }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [loading])

  // Returns coordinates in CSS pixels.  Works correctly because ctx is
  // already scaled by DPR via setupCanvas, so no manual multiplication needed.
  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as MouseEvent).clientX - rect.left,
      y: (e as MouseEvent).clientY - rect.top,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    isDrawing.current = true
    lastPoint.current = getPos(e.nativeEvent, canvas)
    setIsEmpty(false)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas || !isDrawing.current) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')
    if (!ctx || !lastPoint.current) return
    const point = getPos(e.nativeEvent, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPoint.current = point
  }

  function stopDraw() {
    isDrawing.current = false
    lastPoint.current = null
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // getBoundingClientRect gives CSS dimensions; with ctx.scale(dpr,dpr)
    // clearRect in CSS coords clears the full physical canvas correctly.
    const { width, height } = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, width, height)
    setIsEmpty(true)
  }

  async function handleSign() {
    if (!signerName.trim()) {
      setError('Nome do signatário é obrigatório')
      return
    }
    if (isEmpty) {
      setError('Por favor, desenhe a assinatura no campo acima')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    setSaving(true)
    setError('')

    const imageBase64 = canvas.toDataURL('image/png')

    const res = await fetch(`/api/relatorios/${params.id}/assinar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerName: signerName.trim(),
        signerDoc: signerDoc.trim() || undefined,
        imageBase64,
      }),
    })

    if (res.ok) {
      router.push(`/dashboard/relatorios/${params.id}`)
    } else {
      const data = await res.json()
      setError(data.error || 'Erro ao assinar relatório')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/relatorios/${params.id}`}
          className="text-slate-400 hover:text-slate-100 transition-colors p-2 min-h-[44px] flex items-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <PenLine className="w-6 h-6 text-emerald-500" />
            Assinar Relatório
          </h1>
          <p className="text-slate-400 text-sm">Após a assinatura, o relatório não poderá mais ser alterado</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Dados do signatário */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-4">
        <h2 className="text-slate-100 font-semibold">Dados do Signatário</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nome completo <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Nome de quem está assinando"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 min-h-[44px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Documento (opcional)
            </label>
            <input
              type="text"
              value={signerDoc}
              onChange={e => setSignerDoc(e.target.value)}
              placeholder="CPF, RG ou outro documento"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-3 min-h-[44px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Área de assinatura */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-slate-100 font-semibold">Assinatura</h2>
          <button
            onClick={clearCanvas}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-400 transition-colors px-2 py-2 min-h-[44px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>

        <div
          ref={wrapperRef}
          className="relative border-2 border-dashed border-slate-600 rounded-lg overflow-hidden bg-slate-950"
        >
          <canvas
            ref={canvasRef}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
            className="block cursor-crosshair touch-none"
          />
          {isEmpty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-slate-600 text-sm select-none">Desenhe sua assinatura aqui</span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500">Use o mouse ou toque para desenhar a assinatura</p>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href={`/dashboard/relatorios/${params.id}`}
          className="px-4 py-3 min-h-[44px] bg-slate-800 text-slate-100 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors text-sm font-medium flex items-center"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSign}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm font-semibold disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar Assinatura
        </button>
      </div>
    </div>
  )
}
