# Fase 8 — Branding por Plano no PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Condicionar o rodapé do PDF ao plano (`plan`) da empresa, exibindo ou omitindo a marca Relatec conforme contratado.

**Architecture:** Adicionar prop `plan: string` ao componente `RelatorioPDF` e aplicar lógica condicional no rodapé. A rota de geração de PDF já busca `company` — basta passar `plan` ao `React.createElement`.

**Tech Stack:** @react-pdf/renderer, Next.js Route Handler, TypeScript

---

## Arquivos modificados

| Arquivo | Ação |
|---|---|
| `src/components/relatorio-pdf.tsx` | Adicionar prop `plan`, lógica condicional no rodapé |
| `src/app/api/relatorios/[id]/gerar-pdf/route.ts` | Passar `plan: report.company.plan` ao componente |

---

### Task 1: Adicionar prop `plan` e lógica condicional no rodapé do componente PDF

**Files:**
- Modify: `src/components/relatorio-pdf.tsx`

- [ ] **Step 1: Abrir o arquivo**

  Abrir `src/components/relatorio-pdf.tsx` e localizar a interface `RelatorioPDFProps` (linha ~149).

- [ ] **Step 2: Adicionar `plan` na interface**

  Localizar o bloco:
  ```ts
  export function RelatorioPDF({ report, generatedAt, company }: RelatorioPDFProps) {
  ```
  E a interface acima dele:
  ```ts
  interface RelatorioPDFProps {
    report: { ... }
    generatedAt: Date
    company: {
      name: string
      cnpj: string | null
      phone: string | null
      email: string | null
      address: string | null
    }
  }
  ```

  Adicionar `plan: string` na interface e na desestruturação:
  ```ts
  interface RelatorioPDFProps {
    report: {
      id: string
      observations: string | null
      createdAt: Date
      checklistData: Record<string, boolean> | null
      measurementData: Record<string, string> | null
      visit: {
        scheduledAt: Date
        realizedAt: Date | null
        observations: string | null
        client: {
          name: string
          cnpj: string | null
          address: string | null
          city: string | null
          state: string | null
        }
        technician: {
          name: string
        }
      }
      filledBy: {
        name: string
      }
      signature: {
        signerName: string
        signerDoc: string | null
        signedAt: Date
        imageBase64: string
      } | null
    }
    generatedAt: Date
    plan: string
    company: {
      name: string
      cnpj: string | null
      phone: string | null
      email: string | null
      address: string | null
    }
  }
  ```

  E na função:
  ```ts
  export function RelatorioPDF({ report, generatedAt, plan, company }: RelatorioPDFProps) {
  ```

- [ ] **Step 3: Substituir o rodapé fixo pela lógica condicional**

  Localizar o rodapé atual (linha ~378):
  ```tsx
  {/* 7. Rodapé */}
  <Text style={styles.footer}>
    Documento gerado em {fmtDatetime(generatedAt)} pelo sistema Relatec
  </Text>
  ```

  Substituir por:
  ```tsx
  {/* 7. Rodapé */}
  <Text style={styles.footer}>
    {plan === 'enterprise'
      ? `Documento gerado em ${fmtDatetime(generatedAt)}`
      : plan === 'pro'
        ? `Documento gerado em ${fmtDatetime(generatedAt)} · Gerado por Relatec`
        : `Documento gerado em ${fmtDatetime(generatedAt)} · Sistema fornecido por Relatec — relatec.com.br`
    }
  </Text>
  ```

  > O `else` (qualquer outro valor, incluindo `start`) cai no comportamento mais completo.

- [ ] **Step 4: Verificar que o TypeScript não aponta erros**

  Rodar no terminal:
  ```bash
  npx tsc --noEmit
  ```
  Esperado: nenhum erro relacionado ao componente `relatorio-pdf.tsx`.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/relatorio-pdf.tsx
  git commit -m "feat: condicionar rodapé do PDF ao plano da empresa"
  ```

---

### Task 2: Passar `plan` da rota de geração para o componente

**Files:**
- Modify: `src/app/api/relatorios/[id]/gerar-pdf/route.ts`

- [ ] **Step 1: Localizar o `React.createElement` na rota**

  Abrir `src/app/api/relatorios/[id]/gerar-pdf/route.ts` e localizar (linha ~108):
  ```ts
  const buffer = await renderToBuffer(
    React.createElement(RelatorioPDF, { report: reportData, generatedAt, company: {
      name: report.company.name,
      cnpj: report.company.cnpj,
      phone: report.company.phone,
      email: report.company.email,
      address: report.company.address,
    }}) as any
  )
  ```

- [ ] **Step 2: Adicionar `plan` no createElement**

  Substituir por:
  ```ts
  const buffer = await renderToBuffer(
    React.createElement(RelatorioPDF, {
      report: reportData,
      generatedAt,
      plan: report.company.plan,
      company: {
        name: report.company.name,
        cnpj: report.company.cnpj,
        phone: report.company.phone,
        email: report.company.email,
        address: report.company.address,
      },
    }) as any
  )
  ```

- [ ] **Step 3: Verificar TypeScript**

  ```bash
  npx tsc --noEmit
  ```
  Esperado: nenhum erro.

- [ ] **Step 4: Testar manualmente**

  1. Rodar o servidor: `npm run dev`
  2. Logar com `admin@relatec.com.br` / `admin123`
  3. Abrir um relatório finalizado ou assinado
  4. Clicar em "Gerar PDF" e baixar o arquivo
  5. Verificar no rodapé do PDF: deve aparecer `· Sistema fornecido por Relatec — relatec.com.br` (empresa usa plano `start` por padrão)

  **Para testar os outros planos** (opcional, via Prisma Studio ou SQL):
  ```sql
  UPDATE "Company" SET plan = 'pro' WHERE id = 'relatec-company-id';
  -- Gerar PDF → rodapé: "... · Gerado por Relatec"

  UPDATE "Company" SET plan = 'enterprise' WHERE id = 'relatec-company-id';
  -- Gerar PDF → rodapé: apenas a data, sem Relatec

  UPDATE "Company" SET plan = 'start' WHERE id = 'relatec-company-id';
  -- Restaurar
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/api/relatorios/[id]/gerar-pdf/route.ts
  git commit -m "feat: passar plan da empresa ao componente RelatorioPDF"
  ```
