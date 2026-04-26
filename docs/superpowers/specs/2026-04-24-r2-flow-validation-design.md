# Spec: Validação e Hardening do Fluxo R2

**Data:** 2026-04-24
**Status:** Aprovado

## Objetivo

Revisar, corrigir e validar o fluxo completo de armazenamento no Cloudflare R2 — assinatura, geração de PDF e download — garantindo que o sistema não depende mais de `public/uploads/` e que cada etapa tem tratamento de erro adequado.

## Escopo da Revisão

### Arquivos a revisar

| Arquivo | O que verificar |
|---|---|
| `src/lib/r2.ts` | Validação de env vars, tratamento de erro em upload/download, validação de `res.Body`, `Content-Disposition` no download |
| `src/app/api/relatorios/[id]/assinar/route.ts` | Key do R2 com namespace por tenant, upload com content-type correto, erro tratado |
| `src/app/api/relatorios/[id]/gerar-pdf/route.ts` | Leitura da assinatura via download backend + base64, geração em memória, upload do PDF para R2 |
| `src/app/api/relatorios/[id]/pdf/route.ts` | Geração de presigned URL com expiração adequada, redirect direto, tratamento se PDF não existir |
| `src/components/relatorio-pdf.tsx` | Assinatura recebida como base64 (não URL, não path local) |
| `src/app/dashboard/relatorios/[id]/gerar-pdf-button.tsx` | Link direto para `/api/relatorios/[id]/pdf`, sem obter signed URL manualmente |

### Busca global de referências antigas

Buscar em todo o projeto por:
- `public/uploads`
- `/uploads/signatures`
- `/uploads/pdfs`

Qualquer referência encontrada fora do contexto de migração/histórico deve ser removida ou corrigida.

## Critérios de correção

### `src/lib/r2.ts`
- Validar que todas as env vars (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) existem na inicialização — erro descritivo se faltar alguma
- `uploadToR2`: tratar erro do SDK e relançar com mensagem clara
- `downloadFromR2`: validar que `res.Body` não é undefined antes de usar; tratar stream vazio
- `getPresignedDownloadUrl`: incluir `ResponseContentDisposition: 'attachment; filename="relatorio.pdf"'` para forçar download no browser

### Convenção de keys no R2

Todas as keys agrupam pelo tenant primeiro:

| Tipo | Formato |
|---|---|
| Assinatura | `{companyId}/signatures/{reportId}.png` |
| PDF | `{companyId}/reports/{reportId}/report.pdf` |

Isso facilita isolamento por tenant, auditoria e futuras operações de limpeza por empresa.

### Assinatura (`assinar/route.ts`)
- Key no formato `{companyId}/signatures/{reportId}.png`
- `ContentType: 'image/png'` no upload
- Erro 500 com mensagem clara se upload falhar

### Geração de PDF (`gerar-pdf/route.ts`)
- Baixar a assinatura do R2 via `downloadFromR2()` no backend
- Converter o buffer para base64 e passar como prop `signatureBase64` para o componente PDF
- Gerar PDF inteiramente em memória (`renderToBuffer`)
- Key no formato `{companyId}/reports/{reportId}/report.pdf`
- Retornar 400 claro se relatório não possuir assinatura
- Tratar erro de upload do PDF com 500 descritivo

### Download (`pdf/route.ts`)
- Verificar se `ReportPdf` existe no banco antes de tentar presigned URL
- Retornar 404 claro se PDF ainda não foi gerado
- Gerar presigned URL com expiração de 15 minutos
- Fazer `redirect()` para a presigned URL — o frontend não precisa tratar a URL manualmente

### Componente PDF (`relatorio-pdf.tsx`)
- Receber assinatura como prop `signatureBase64: string | null` (data URL base64)
- Renderizar `<Image src={signatureBase64} />` quando presente
- Tratar prop ausente com fallback visual (ex.: campo em branco ou texto "Sem assinatura")

### Botão de download (`gerar-pdf-button.tsx`)
- Apontar diretamente para `/api/relatorios/[id]/pdf` (link `<a>` ou `window.location`)
- A rota cuida de autenticação, geração da presigned URL e redirect
- Não obter nem manipular a signed URL no frontend

## Checklist de teste manual

Após as correções, validar no ambiente real (com R2 configurado):

### Pré-condição
- [ ] Variáveis de ambiente R2 configuradas (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`)
- [ ] Bucket R2 acessível

### Fluxo completo
1. [ ] Criar uma visita com cliente e técnico
2. [ ] Criar um relatório para a visita
3. [ ] Preencher o relatório e finalizar (`DRAFT` → `FINALIZED`)
4. [ ] Acessar a tela de assinatura e assinar o relatório
5. [ ] Confirmar que nenhum arquivo foi criado em `public/uploads/signatures/`
6. [ ] Confirmar que o arquivo `.png` aparece no bucket R2 com key `{companyId}/signatures/{reportId}.png`
7. [ ] Clicar em "Gerar PDF" no relatório assinado
8. [ ] Confirmar que nenhum arquivo foi criado em `public/uploads/pdfs/`
9. [ ] Confirmar que o arquivo `.pdf` aparece no bucket R2 com key `{companyId}/reports/{reportId}/report.pdf`
10. [ ] Clicar em "Download PDF"
11. [ ] Confirmar que o browser faz redirect para uma URL assinada do R2 (não URL local)
12. [ ] Abrir o PDF e confirmar que a assinatura aparece corretamente
13. [ ] Confirmar que os dados do relatório estão corretos no PDF

### Validação negativa
- [ ] Tentar baixar PDF de relatório que ainda não foi gerado → deve retornar 404 claro (não 500)
- [ ] Tentar gerar PDF de relatório não assinado → deve retornar 400 com mensagem clara

## O que está fora do escopo

- Testes automatizados (podem vir em fase posterior)
- Migração de dados antigos em `public/uploads/`
- Expiração/limpeza automática de arquivos no R2
