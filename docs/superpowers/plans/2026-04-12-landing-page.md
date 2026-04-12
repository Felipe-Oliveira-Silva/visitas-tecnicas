# Landing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o redirect em `/` por uma landing page pública de marketing do Relatec com navbar, hero, funcionalidades, planos, FAQ e rodapé.

**Architecture:** `src/app/page.tsx` vira um Server Component que checa autenticação — usuários logados vão para `/dashboard`, não logados veem a landing page. O único Client Component necessário é o acordeão do FAQ, extraído em `src/components/faq-item.tsx`. A rota `/cadastro` recebe uma página placeholder enquanto o fluxo de cadastro completo não existe.

**Tech Stack:** Next.js 16.2.2, TypeScript, Tailwind CSS, NextAuth v5 (`auth()`), `next/link`, `next/navigation`

---

## Arquivos

| Arquivo | Ação |
|---|---|
| `src/components/faq-item.tsx` | Criar — Client Component do acordeão FAQ |
| `src/app/cadastro/page.tsx` | Criar — placeholder "Em breve" |
| `src/app/page.tsx` | Reescrever — landing page completa (Server Component) |

---

### Task 1: Componente FAQ (acordeão)

**Files:**
- Create: `src/components/faq-item.tsx`

- [ ] **Step 1: Criar o arquivo `src/components/faq-item.tsx`**

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add src/components/faq-item.tsx
git commit -m "feat: componente FaqItem com acordeão para landing page"
```

---

### Task 2: Placeholder `/cadastro`

**Files:**
- Create: `src/app/cadastro/page.tsx`

- [ ] **Step 1: Criar o diretório e o arquivo**

Criar `src/app/cadastro/page.tsx` com o conteúdo abaixo. Este arquivo é um Server Component simples — sem `'use client'`.

```tsx
import Link from 'next/link'

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-cyan-500 font-extrabold tracking-widest text-sm uppercase mb-6">
          RELATEC
        </p>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">
          Cadastro em breve
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Estamos preparando o cadastro online. Por enquanto, entre em contato
          via WhatsApp para criar sua conta.
        </p>
        <a
          href="https://wa.me/5511916821634"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors mb-4"
        >
          Falar no WhatsApp
        </a>
        <div>
          <Link
            href="/login"
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            Já tem conta? Entrar →
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Verificar no browser**

Com `npm run dev` rodando, acessar `http://localhost:3000/cadastro`.

Esperado: página escura com "Cadastro em breve", botão WhatsApp e link "Entrar".

- [ ] **Step 4: Commit**

```bash
git add src/app/cadastro/page.tsx
git commit -m "feat: página placeholder /cadastro"
```

---

### Task 3: Landing page principal

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Reescrever `src/app/page.tsx` com a landing page completa**

Substituir TODO o conteúdo atual do arquivo pelo código abaixo:

```tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FaqItem } from '@/components/faq-item'

const FEATURES = [
  { icon: '📅', title: 'Agendamento', desc: 'Organize visitas por técnico e cliente' },
  { icon: '📋', title: 'Relatórios em PDF', desc: 'Checklist, medições e observações' },
  { icon: '✍️', title: 'Assinatura digital', desc: 'Assinatura em canvas pelo cliente' },
  { icon: '🏢', title: 'Multi-empresa', desc: 'Isolamento total de dados por empresa' },
  { icon: '📊', title: 'Painel gerencial', desc: 'Visitados x não visitados no mês' },
  { icon: '👥', title: 'Controle de equipe', desc: 'Admin e técnicos com permissões distintas' },
]

const SEGMENTS = [
  { icon: '🔧', label: 'Empresas de manutenção' },
  { icon: '⚡', label: 'Instaladoras elétricas' },
  { icon: '❄️', label: 'Refrigeração / HVAC' },
  { icon: '🏗️', label: 'Inspeções técnicas' },
  { icon: '💻', label: 'TI / Redes' },
]

const FAQ_ITEMS = [
  {
    question: 'Preciso instalar alguma coisa?',
    answer: 'Não. O Relatec funciona 100% no navegador, em qualquer dispositivo.',
  },
  {
    question: 'Posso testar antes de pagar?',
    answer: 'Sim. O plano Start é gratuito e sem prazo de expiração.',
  },
  {
    question: 'Como funciona o pagamento?',
    answer:
      'Após o cadastro, entre em contato via WhatsApp para ativar seu plano pago.',
  },
]

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#080d14] text-slate-100">

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0d1b2a] border-b border-[#1e3a5f]">
        <span className="text-cyan-500 font-extrabold tracking-widest text-lg">
          RELATEC
        </span>
        <div className="flex items-center gap-6">
          <a
            href="#funcionalidades"
            className="text-slate-400 text-sm hover:text-slate-200 transition-colors hidden md:block"
          >
            Funcionalidades
          </a>
          <a
            href="#planos"
            className="text-slate-400 text-sm hover:text-slate-200 transition-colors hidden md:block"
          >
            Planos
          </a>
          <a
            href="#faq"
            className="text-slate-400 text-sm hover:text-slate-200 transition-colors hidden md:block"
          >
            FAQ
          </a>
          <Link
            href="/login"
            className="border border-cyan-500 text-cyan-500 px-4 py-1.5 rounded-lg text-sm hover:bg-cyan-500/10 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="bg-cyan-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-cyan-400 transition-colors"
          >
            Cadastrar
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="px-6 py-24 text-center border-b border-slate-800">
        <p className="text-cyan-500 text-xs font-semibold tracking-widest uppercase mb-4">
          Gestão de Visitas Técnicas
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
          Organize suas equipes de campo
          <br />
          <span className="text-cyan-500">
            do agendamento ao relatório assinado
          </span>
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto mb-8">
          Sistema completo para empresas que realizam visitas técnicas em
          clientes. Multi-empresa, relatórios em PDF e assinatura digital.
        </p>
        <div className="flex gap-3 justify-center mb-12">
          <Link
            href="/cadastro"
            className="bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-cyan-400 transition-colors"
          >
            Começar grátis →
          </Link>
          <a
            href="#planos"
            className="border border-slate-700 text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Ver planos
          </a>
        </div>
        {/* Screenshot placeholder — substituir por imagem real */}
        <div className="max-w-2xl mx-auto bg-[#0d1b2a] border border-[#1e3a5f] rounded-xl p-6">
          <div className="flex gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="bg-slate-800 rounded-lg p-12 text-slate-600 text-sm">
            Screenshot do sistema
          </div>
        </div>
      </section>

      {/* PÚBLICO-ALVO */}
      <section className="px-6 py-12 border-b border-slate-800 text-center">
        <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-6">
          Para quem é o Relatec
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {SEGMENTS.map((s) => (
            <span
              key={s.label}
              className="bg-[#0d1b2a] border border-[#1e3a5f] text-slate-400 text-sm px-4 py-2 rounded-lg"
            >
              {s.icon} {s.label}
            </span>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="px-6 py-16 border-b border-slate-800">
        <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-10 text-center">
          Funcionalidades
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[#0d1b2a] border border-slate-800 rounded-xl p-5"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="text-slate-100 font-semibold mb-1">{f.title}</h3>
              <p className="text-slate-500 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="px-6 py-16 border-b border-slate-800 text-center">
        <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-2">
          Planos
        </p>
        <h2 className="text-2xl font-bold text-slate-100 mb-10">
          Escolha o plano ideal para sua empresa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">

          {/* Start */}
          <div className="bg-[#0d1b2a] border border-[#1e3a5f] rounded-xl p-6 text-left flex flex-col">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Start</p>
            <p className="text-3xl font-extrabold text-slate-100 mb-1">Grátis</p>
            <p className="text-slate-500 text-sm mb-6">Para começar</p>
            <ul className="flex-1 space-y-2 mb-6 text-sm text-slate-400">
              <li>✓ Até X usuários</li>
              <li>✓ Até X clientes</li>
              <li>✓ Relatórios em PDF</li>
              <li>✓ Marca Relatec no PDF</li>
            </ul>
            <Link
              href="/cadastro"
              className="block text-center border border-cyan-500 text-cyan-500 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-500/10 transition-colors"
            >
              Cadastrar grátis
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-[#0d1b2a] border-2 border-cyan-500 rounded-xl p-6 text-left flex flex-col relative">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              Mais popular
            </span>
            <p className="text-cyan-500 text-xs uppercase tracking-widest mb-2">Pro</p>
            <p className="text-3xl font-extrabold text-slate-100 mb-1">
              R$ X
              <span className="text-base font-normal text-slate-500">/mês</span>
            </p>
            <p className="text-slate-500 text-sm mb-6">Para equipes em crescimento</p>
            <ul className="flex-1 space-y-2 mb-6 text-sm text-slate-400">
              <li>✓ Até X usuários</li>
              <li>✓ Clientes ilimitados</li>
              <li>✓ Todos os recursos</li>
              <li>✓ Marca discreta no PDF</li>
            </ul>
            <Link
              href="/cadastro"
              className="block text-center bg-cyan-500 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-400 transition-colors"
            >
              Assinar Pro
            </Link>
          </div>

          {/* Enterprise */}
          <div className="bg-[#0d1b2a] border border-slate-700 rounded-xl p-6 text-left flex flex-col">
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Enterprise</p>
            <p className="text-2xl font-extrabold text-slate-100 mb-1">Sob consulta</p>
            <p className="text-slate-500 text-sm mb-6">White-label total</p>
            <ul className="flex-1 space-y-2 mb-6 text-sm text-slate-400">
              <li>✓ Usuários ilimitados</li>
              <li>✓ Clientes ilimitados</li>
              <li>✓ Sem marca Relatec no PDF</li>
              <li>✓ Suporte dedicado</li>
            </ul>
            <a
              href="https://wa.me/5511916821634"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-slate-700 text-slate-400 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Falar no WhatsApp
            </a>
          </div>

        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-16 border-b border-slate-800">
        <p className="text-slate-500 text-xs font-semibold tracking-widest uppercase mb-10 text-center">
          Perguntas frequentes
        </p>
        <div className="max-w-2xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item) => (
            <FaqItem
              key={item.question}
              question={item.question}
              answer={item.answer}
            />
          ))}
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="px-6 py-10 text-center">
        <p className="text-cyan-500 font-extrabold tracking-widest text-base mb-1">
          RELATEC
        </p>
        <p className="text-slate-500 text-sm mb-4">Gestão de Visitas Técnicas</p>
        <div className="flex gap-6 justify-center mb-6">
          <Link
            href="/login"
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            Cadastrar
          </Link>
          <a
            href="https://wa.me/5511916821634"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            WhatsApp
          </a>
        </div>
        <p className="text-slate-700 text-xs">© 2026 Relatec</p>
      </footer>

    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 3: Verificar no browser — usuário não logado**

Com `npm run dev` rodando, abrir uma aba anônima e acessar `http://localhost:3000`.

Esperado:
- Navbar fixa com links e botões Entrar/Cadastrar
- Hero com título grande e botões
- Seção "Para quem é o Relatec" com chips
- Grid de 6 funcionalidades
- 3 cards de planos (Pro em destaque com borda cyan e badge "Mais popular")
- FAQ com acordeão clicável
- Rodapé

- [ ] **Step 4: Verificar no browser — usuário logado**

Na mesma aba normal (sessão logada), acessar `http://localhost:3000`.

Esperado: redirecionado automaticamente para `/dashboard` (comportamento anterior mantido).

- [ ] **Step 5: Verificar links**

Clicar em cada CTA e confirmar destinos:
- "Entrar" → `/login` ✓
- "Cadastrar" (navbar) → `/cadastro` ✓
- "Começar grátis →" → `/cadastro` ✓
- "Ver planos" → rola para seção #planos ✓
- "Cadastrar grátis" (Start) → `/cadastro` ✓
- "Assinar Pro" (Pro) → `/cadastro` ✓
- "Falar no WhatsApp" (Enterprise) → abre WhatsApp em nova aba ✓

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: landing page completa em /"
```
