'use client'

import { useState } from 'react'

interface FaqItemProps {
  question: string
  answer: string
}

export function FaqItem({ question, answer }: FaqItemProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-slate-900 hover:bg-slate-800 transition-colors"
      >
        <span className="text-slate-100 font-medium text-sm">{question}</span>
        <span className="text-cyan-500 ml-4 flex-shrink-0 text-lg leading-none">
          {open ? '−' : '+'}
        </span>
      </button>
      {open && (
        <div className="px-5 py-4 bg-slate-900 border-t border-slate-800">
          <p className="text-slate-400 text-sm">{answer}</p>
        </div>
      )}
    </div>
  )
}
