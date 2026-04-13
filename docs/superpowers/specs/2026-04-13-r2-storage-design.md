# Subsistema 4 — Cloudflare R2 Storage — Design Spec

**Data:** 2026-04-13  
**Status:** Aprovado

## Objetivo

Migrar o armazenamento de assinaturas e PDFs do filesystem local (`public/uploads/`) para Cloudflare R2, tornando o sistema funcional em ambientes serverless (Vercel) onde o filesystem não persiste entre invocações.

## Contexto

Atualmente:
- `POST /api/relatorios/[id]/assinar` → salva PNG em `public/uploads/signatures/` via `writeFile`
- `POST /api/relatorios/[id]/gerar-pdf` → lê assinatura com `readFileSync`, salva PDF em `public/uploads/pdfs/` via `writeFile`
- PDFs são servidos como arquivos estáticos via Next.js

No Vercel, `public/` é read-only após o deploy e o filesystem não persiste — isso quebra upload, leitura e download de arquivos.

## Decisões de Design

- **Bucket privado** com acesso via presigned URLs (validade 15 min)
- **Download via redirect 302**: browser chama `/api/relatorios/[id]/pdf` → API gera URL assinada → redirect para R2
- **SDK**: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (R2 é S3-compatible)
- **Sem migração** de arquivos existentes em `public/uploads/` (apenas dados de desenvolvimento)
- **Helper centralizado** `src/lib/r2.ts` seguindo o padrão de `src/lib/prisma.ts` e `src/lib/auth.ts`

## Path Structure no R2 (Multi-tenant)

Convenção obrigatória para todas as keys:

```
{companyId}/reports/{reportId}/report.pdf     ← PDFs
{companyId}/signatures/{reportId}.png         ← assinaturas
```

Benefícios:
- Isolamento por empresa no nível do bucket
- Sem risco de colisão de keys entre empresas
- Operações futuras (listar arquivos de uma empresa, deletar dados de um tenant) são triviais

## Nota sobre CORS

CORS não é necessário nesta implementação: o browser nunca acessa o R2 diretamente — sempre vai via rota da API, que faz redirect 302 para a presigned URL. O R2 recebe a requisição do browser já com a URL assinada.

No entanto, **pode ser necessário no futuro** se houver necessidade de o browser acessar a signed URL diretamente (ex: pré-visualização inline de PDFs sem passar pela API). Nesse caso, configurar CORS no bucket R2 para permitir a origem do domínio da aplicação.

---

## 1. Setup no Cloudflare

### Passos manuais

1. **Criar bucket**: Cloudflare Dashboard → R2 → Create bucket
   - Nome: `relatec-uploads`
   - Location: Auto
   - Acesso: privado (padrão)

2. **Criar API Token**: R2 → Manage R2 API Tokens → Create API Token
   - Permissions: Object Read & Write
   - Scope: bucket `relatec-uploads` (específico)
   - Anotar: Access Key ID, Secret Access Key (não recuperável depois)

3. **Anotar Account ID**: visível no canto superior direito da visão geral do R2

### Variáveis de ambiente

Adicionar em `.env.local` e no painel do Vercel (Settings → Environment Variables):

```env
R2_ACCOUNT_ID=seu_account_id
R2_ACCESS_KEY_ID=seu_access_key_id
R2_SECRET_ACCESS_KEY=seu_secret_access_key
R2_BUCKET_NAME=relatec-uploads
```

O endpoint é derivado em código: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

---

## 2. `src/lib/r2.ts`

Novo arquivo. S3Client instanciado uma vez (module-level singleton).

```ts
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Readable } from 'stream'

// Validação das variáveis de ambiente em tempo de inicialização do módulo.
// Falha explícita no boot — nunca em runtime durante uma requisição.
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error(
    'Missing R2 environment variables. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME',
  )
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
})

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string,
  contentDisposition?: string,
): Promise<void> {
  try {
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      ...(contentDisposition ? { ContentDisposition: contentDisposition } : {}),
    }))
  } catch (err) {
    throw new Error(`R2 upload failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}

export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const res = await r2.send(new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    }))
    if (!res.Body) throw new Error(`Empty body returned for key "${key}"`)
    const chunks: Uint8Array[] = []
    for await (const chunk of res.Body as Readable) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch (err) {
    throw new Error(`R2 download failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}

// expiresIn em segundos — padrão 15 minutos
// ResponseContentDisposition garante que o browser trate como download
// independente dos headers do objeto no bucket.
export async function getPresignedDownloadUrl(
  key: string,
  filename: string,
  expiresIn = 900,
): Promise<string> {
  try {
    return getSignedUrl(
      r2,
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${filename}"`,
      }),
      { expiresIn },
    )
  } catch (err) {
    throw new Error(`R2 presign failed for key "${key}": ${err instanceof Error ? err.message : err}`)
  }
}
```

---

## 3. Modificação: `POST /api/relatorios/[id]/assinar`

### Imports

Remover:
```ts
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
```

Adicionar:
```ts
import { uploadToR2 } from '@/lib/r2'
```

### Lógica de armazenamento da assinatura

Substituir (após `Buffer.from(base64Data, 'base64')`):

```ts
// ANTES
const fileName = `sig_${id}_${Date.now()}.png`
const uploadDir = join(process.cwd(), 'public', 'uploads', 'signatures')
await mkdir(uploadDir, { recursive: true })
await writeFile(join(uploadDir, fileName), buffer)
const imagePath = `/uploads/signatures/${fileName}`

// DEPOIS
const key = `${session.user.companyId}/signatures/${id}.png`
await uploadToR2(key, buffer, 'image/png')
const imagePath = key
```

O campo `imagePath` no schema Prisma continua inalterado — apenas o valor armazenado muda de path local para R2 key.

---

## 4. Modificação: `POST /api/relatorios/[id]/gerar-pdf`

### Imports

Remover:
```ts
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { readFileSync } from 'fs'
import path from 'path'
```

Adicionar:
```ts
import { uploadToR2, downloadFromR2 } from '@/lib/r2'
```

### Leitura da assinatura

```ts
// ANTES
let imageBase64: string | null = null
if (report.signature?.imagePath) {
  const absPath = path.join(process.cwd(), 'public', report.signature.imagePath)
  if (existsSync(absPath)) {
    imageBase64 = readFileSync(absPath).toString('base64')
  }
}

// DEPOIS
let imageBase64: string | null = null
if (report.signature?.imagePath) {
  const sigBuffer = await downloadFromR2(report.signature.imagePath)
  imageBase64 = sigBuffer.toString('base64')
}
```

### Salvamento do PDF

```ts
// ANTES
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'pdfs')
if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })
const fileName = `relatorio_${id}.pdf`
await writeFile(path.join(uploadsDir, fileName), buffer)
const pdfPath = `/uploads/pdfs/${fileName}`

// DEPOIS
const pdfKey = `${session.user.companyId}/reports/${id}/report.pdf`
await uploadToR2(pdfKey, buffer, 'application/pdf', `attachment; filename="relatorio_${id}.pdf"`)
const pdfPath = pdfKey
```

### Resposta

```ts
// ANTES
return NextResponse.json({ pdfPath })

// DEPOIS
return NextResponse.json({ ok: true })
```

O `pdfPath` armazenado no `prisma.reportPdf.upsert` é a R2 key — campo mantido no schema.

---

## 5. Nova rota: `GET /api/relatorios/[id]/pdf`

Arquivo: `src/app/api/relatorios/[id]/pdf/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPresignedDownloadUrl } from '@/lib/r2'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const pdf = await prisma.reportPdf.findFirst({
    where: { reportId: id, companyId: session.user.companyId },
  })
  if (!pdf) return NextResponse.json({ error: 'PDF não encontrado' }, { status: 404 })

  const filename = `relatorio_${id}.pdf`
  const url = await getPresignedDownloadUrl(pdf.pdfPath, filename, 900)
  return NextResponse.redirect(url)
}
```

Isolamento multi-tenant garantido pelo `companyId` no `findFirst`.

---

## 6. Modificação: `gerar-pdf-button.tsx`

### Estado interno

```ts
// ANTES
const [pdfPath, setPdfPath] = useState<string | null>(existingPdfPath)

// DEPOIS
const [pdfReady, setPdfReady] = useState<boolean>(existingPdfPath !== null)
```

### Após gerar PDF com sucesso

```ts
// ANTES
setPdfPath(data.pdfPath)

// DEPOIS
setPdfReady(true)
```

### Botão de download

```tsx
// ANTES
{pdfPath && (
  <a href={pdfPath} download className="...">
    Baixar PDF
  </a>
)}

// DEPOIS
{pdfReady && (
  <a
    href={`/api/relatorios/${reportId}/pdf`}
    target="_blank"
    rel="noopener noreferrer"
    className="..."
  >
    Baixar PDF
  </a>
)}
```

A prop `existingPdfPath: string | null` é mantida na interface do componente — o Server Component continua passando-a, apenas o consumo interno muda.

---

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/lib/r2.ts` | Criar |
| `src/app/api/relatorios/[id]/assinar/route.ts` | Modificar |
| `src/app/api/relatorios/[id]/gerar-pdf/route.ts` | Modificar |
| `src/app/api/relatorios/[id]/pdf/route.ts` | Criar |
| `src/app/dashboard/relatorios/[id]/gerar-pdf-button.tsx` | Modificar |

## Pacotes

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## O que NÃO está no escopo

- Migração de arquivos existentes em `public/uploads/`
- Limpeza do diretório `public/uploads/` (pode ser feita manualmente)
- Controle de expiração ou deleção de objetos no R2
- CORS no bucket (ver nota acima — avaliar quando necessário)
- Upload direto do browser para R2 (presigned PUT URLs) — fase futura
