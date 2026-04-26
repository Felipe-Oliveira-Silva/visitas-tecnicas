# Fase 8 — Branding por Plano no PDF

**Data:** 2026-04-11
**Status:** Aprovado

## Objetivo

Controlar a presença da marca Relatec no rodapé do PDF gerado conforme o plano (`plan`) da empresa.

## Comportamento por Plano

| Plano | Rodapé |
|---|---|
| `start` | "Documento gerado em {datetime} · Sistema fornecido por Relatec — relatec.com.br" |
| `pro` | "Documento gerado em {datetime} · Gerado por Relatec" |
| `enterprise` | "Documento gerado em {datetime}" |

Qualquer valor de `plan` não reconhecido cai no comportamento de `start` (mais conservador).

## Arquivos Afetados

### `src/components/relatorio-pdf.tsx`

- Adiciona `plan: string` na interface `RelatorioPDFProps`
- Substitui o `<Text>` fixo do rodapé por lógica condicional baseada em `plan`

### `src/app/api/relatorios/[id]/gerar-pdf/route.ts`

- Passa `plan: report.company.plan` no `React.createElement(RelatorioPDF, ...)`

## O que NÃO muda

- Nenhuma alteração no schema Prisma (`plan` já existe em `Company`)
- Nenhuma query nova — `company` já é incluída via `include: { company: true }`
- Nenhum outro arquivo é tocado

## Abordagem escolhida

Lógica condicional dentro do próprio componente `RelatorioPDF` (prop `plan`).
Alternativas descartadas: texto pré-montado na rota (lógica de negócio misturada com transporte), helper separado (complexidade desnecessária para uso único).
