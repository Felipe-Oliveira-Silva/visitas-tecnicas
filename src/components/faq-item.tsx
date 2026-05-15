'use client'

import { useState } from 'react'

interface FaqItemProps {
  question: string
  answer: string
}

export function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left bg-transparent hover:bg-white/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
      >
        <span className="text-slate-100 font-medium text-sm sm:text-base">{question}</span>
        <span className="text-cyan-300 flex-shrink-0 text-2xl leading-none font-light">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 sm:px-6 sm:pb-6 bg-transparent">
          <p className="text-slate-300 text-sm leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}
