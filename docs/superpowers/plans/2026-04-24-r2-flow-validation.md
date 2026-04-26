# R2 Flow Validation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir o bug de exibição da assinatura (R2 key usada como URL de imagem), limpar a prop desnecessária de path no botão de PDF, e confirmar que o restante do fluxo R2 está correto.

**Architecture:** Adicionar rota `GET /api/relatorios/[id]/signature-image` que redireciona para presigned URL do R2 (mesmo padrão da rota `/pdf`). A page usa essa rota como `src` do `<img>`. Adicionar `getPresignedViewUrl` ao `r2.ts` (sem Content-Disposition para exibição inline).

**Tech Stack:** Next.js 16, Cloudflare R2 via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, Prisma 6, NextAuth v5 beta.

---

## Arquivos modificados

| Arquivo | Ação | O que muda |
|---|---|---|
| `src/lib/r2.ts` | Modificar | Adicionar `getPresignedViewUrl` sem Content-Disposition |
| `src/app/api/relatorios/[id]/signature-image/route.ts` | Criar | GET → auth → busca signature → redirect para presigned URL |
| `src/app/dashboard/relatorios/[id]/page.tsx` | Modificar | `<img src>` usa `/api/relatorios/[id]/signature-image` em vez de `imagePath` |
| `src/app/dashboard/relatorios/[id]/gerar-pdf-button.tsx` | Modificar | Prop `existingPdfPath: string \| null` → `hasPdf: boolean` |

---

## Task 1: Adicionar `getPresignedViewUrl` ao r2.ts

**Files:**
- Modify: `src/lib/r2.ts`

Atualmente `getPresignedDownloadUrl` sempre inclui `Content-Disposition: attachment`, que força download. Para exibir a assinatura inline em `<img>`, precisamos de uma URL sem esse header.

- [ ] **Step 1: Adicionar função ao final de `src/lib/r2.ts`**

Adicionar logo após `getPresignedDownloadUrl`:

```typescript
// Use for inline display (e.g. <img src>); no Content-Disposition so the browser renders directly
export async function getPresignedViewUrl(key: string, expiresIn = 900): Promise<string> {
  try {
    return getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      }),
      { expiresIn },
    )
  } catch (err) {
    throw new Error(`R2 presign failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}
```

- [ ] **Step 2: Verificar que o arquivo compila sem erros**

```bash
npx tsc --noEmit
```

Expected: sem erros em `src/lib/r2.ts`.

---

## Task 2: Criar rota `GET /api/relatorios/[id]/signature-image`

**Files:**
- Create: `src/app/api/relatorios/[id]/signature-image/route.ts`

Rota que valida acesso, busca a `imagePath` da assinatura e faz redirect para presigned URL. Mesmo padrão da rota `/pdf`.

- [ ] **Step 1: Criar o arquivo**

Criar `src/app/api/relatorios/[id]/signature-image/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedViewUrl } from '@/lib/r2'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const signature = await prisma.signature.findFirst({
    where: { reportId: id, companyId: session.user.companyId },
  })
  if (!signature) return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })

  try {
    const url = await getPresignedViewUrl(signature.imagePath, 900)
    return NextResponse.redirect(url)
  } catch (err) {
    console.error('[SIGNATURE_IMAGE]', err)
    return NextResponse.json({ error: 'Erro ao gerar link da assinatura' }, { status: 503 })
  }
}
```

- [ ] **Step 2: Verificar que o arquivo compila sem erros**

```bash
npx tsc --noEmit
```

Expected: sem erros no arquivo novo.

---

## Task 3: Corrigir exibição da assinatura em `page.tsx`

**Files:**
- Modify: `src/app/dashboard/relatorios/[id]/page.tsx`

O bug: linha ~308 usa `src={report.signature.imagePath}` — a `imagePath` é uma R2 key (`{companyId}/signatures/{reportId}.png`), não uma URL. O browser tenta carregar isso como path relativo e falha.

A correção: usar a nova rota `/api/relatorios/${report.id}/signature-image` que redireciona para a presigned URL.

- [ ] **Step 1: Corrigir o `<img>` da assinatura**

Localizar o bloco da seção Assinatura (em torno da linha 304-313) e substituir:

```tsx
<div className="bg-white rounded-lg p-2 inline-block">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src={report.signature.imagePath}
    alt="Assinatura"
    className="max-h-24 object-contain"
  />
</div>
```

por:

```tsx
<div className="bg-white rounded-lg p-2 inline-block">
  {/* eslint-disable-next-line @next/next/no-img-element */}
  <img
    src={`/api/relatorios/${report.id}/signature-image`}
    alt="Assinatura"
    className="max-h-24 object-contain"
  />
</div>
```

- [ ] **Step 2: Verificar que o arquivo compila sem erros**

```bash
npx tsc --noEmit
```

Expected: sem erros em `page.tsx`.

---

## Task 4: Limpar prop `existingPdfPath` → `hasPdf`

**Files:**
- Modify: `src/app/dashboard/relatorios/[id]/gerar-pdf-button.tsx`
- Modify: `src/app/dashboard/relatorios/[id]/page.tsx`

A prop `existingPdfPath: string | null` passa a R2 key para o frontend, mas o botão só a usa como booleano (`existingPdfPath !== null`). Renomear para `hasPdf: boolean` deixa a interface mais clara e evita expor detalhes de armazenamento interno.

- [ ] **Step 1: Atualizar `gerar-pdf-button.tsx`**

Substituir a interface e o uso da prop:

```tsx
interface GerarPdfButtonProps {
  reportId: string
  hasPdf: boolean
  status: string
}

export function GerarPdfButton({ reportId, hasPdf, status }: GerarPdfButtonProps) {
  const [loading, setLoading] = useState(false)
  const [pdfReady, setPdfReady] = useState<boolean>(hasPdf)
  const [error, setError] = useState<string | null>(null)
  // ... resto do componente inalterado
```

- [ ] **Step 2: Atualizar `page.tsx` — call site do `GerarPdfButton`**

Localizar (em torno da linha 324-328):

```tsx
<GerarPdfButton
  reportId={report.id}
  existingPdfPath={report.pdf?.pdfPath ?? null}
  status={report.status}
/>
```

Substituir por:

```tsx
<GerarPdfButton
  reportId={report.id}
  hasPdf={report.pdf !== null}
  status={report.status}
/>
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```

Expected: sem erros de tipo.

---

## Task 5: Commit final

- [ ] **Step 1: Verificar build completo**

```bash
npm run build
```

Expected: build sem erros.

- [ ] **Step 2: Commit**

```bash
git add src/lib/r2.ts \
        src/app/api/relatorios/\[id\]/signature-image/route.ts \
        src/app/dashboard/relatorios/\[id\]/page.tsx \
        src/app/dashboard/relatorios/\[id\]/gerar-pdf-button.tsx
git commit -m "fix: serve signature image via presigned R2 URL, clean up hasPdf prop"
```

---

## Checklist de teste manual (pós-implementação)

Após o deploy ou em dev local com R2 configurado:

### Pré-condição
- [ ] Variáveis de ambiente R2 configuradas: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
- [ ] Bucket R2 acessível

### Fluxo completo
1. [ ] Criar uma visita com cliente e técnico
2. [ ] Criar um relatório para a visita
3. [ ] Preencher o relatório e clicar em "Finalizar" (`DRAFT` → `FINALIZED`)
4. [ ] Acessar a tela de assinatura e assinar o relatório
5. [ ] Confirmar que **nenhum arquivo** foi criado em `public/uploads/signatures/`
6. [ ] Confirmar que o arquivo `.png` aparece no bucket R2 com key `{companyId}/signatures/{reportId}.png`
7. [ ] Voltar para a página do relatório — confirmar que **a imagem da assinatura aparece** corretamente (não quebrada)
8. [ ] Clicar em "Gerar PDF" no relatório assinado
9. [ ] Confirmar que **nenhum arquivo** foi criado em `public/uploads/pdfs/`
10. [ ] Confirmar que o arquivo `.pdf` aparece no bucket R2 com key `{companyId}/reports/{reportId}/report.pdf`
11. [ ] Clicar em "Baixar PDF"
12. [ ] Confirmar que o browser faz redirect para uma URL assinada do R2 (inspecionar Network tab — não é URL local)
13. [ ] Abrir o PDF e confirmar que a **assinatura aparece** corretamente no documento
14. [ ] Confirmar que os dados do relatório estão corretos no PDF

### Validação negativa
- [ ] Tentar baixar PDF de relatório que ainda não foi gerado → deve retornar `404` com mensagem "PDF não encontrado"
- [ ] Tentar gerar PDF de relatório `DRAFT` → deve retornar `400` com mensagem "Apenas relatórios finalizados ou assinados podem gerar PDF"
- [ ] Acessar `/api/relatorios/{id}/signature-image` de relatório sem assinatura → deve retornar `404`
