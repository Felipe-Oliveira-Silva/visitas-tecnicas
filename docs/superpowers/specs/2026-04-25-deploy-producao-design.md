# Deploy em Produção — Design Spec
**Data:** 2026-04-25  
**Status:** Aprovado

---

## Objetivo

Levar o Relatec de `localhost:3000` para um ambiente de produção real e acessível publicamente, com banco gerenciado, CI/CD automático via GitHub, e fluxo de autenticação e R2 funcionando end-to-end.

---

## Infraestrutura

```
GitHub (main)
    │
    └─▶ Vercel (auto-deploy a cada push em main)
            ├─ Build: prisma generate && prisma migrate deploy && next build
            ├─ Runtime: Node.js serverless functions
            └─ Env vars (apenas Production):
                  DATABASE_URL        ← Neon pooler   (Marketplace)
                  DATABASE_URL_UNPOOLED ← Neon direct (Marketplace)
                  DIRECT_URL          ← mesmo valor de DATABASE_URL_UNPOOLED (manual)
                  NEXTAUTH_SECRET     ← gerado localmente
                  AUTH_SECRET         ← mesmo valor de NEXTAUTH_SECRET
                  NEXTAUTH_URL        ← https://[projeto].vercel.app
                  AUTH_URL            ← mesmo valor de NEXTAUTH_URL
                  R2_ACCOUNT_ID / R2_ACCESS_KEY_ID /
                  R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME
                  ADMIN_PASSWORD      ← senha forte para admin@relatec.com.br
                  SUPERADMIN_PASSWORD ← senha forte para super@relatec.com.br

Neon (PostgreSQL gerenciado)
    ├─ DATABASE_URL       → pooler PgBouncer (runtime Prisma)
    └─ DIRECT_URL         → conexão direta   (prisma migrate deploy)

Cloudflare R2
    └─ Sem mudanças — já integrado e funcionando
```

**Por que dois URLs do Neon:**  
O pooler (PgBouncer em transaction mode) não suporta sessões PostgreSQL completas. O `prisma migrate deploy` exige sessão direta. O runtime usa o pooler para não esgotar connection limits em serverless.

**Preview/Development:** sem banco configurado por enquanto. Environments separados serão definidos se necessário no futuro.

---

## Mudanças de código

### 1. `prisma/schema.prisma` — adicionar `directUrl`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 2. `src/lib/prisma.ts` — logging condicional

```ts
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })
```

Evita logar todas as queries em produção (performance + dados sensíveis nos logs do Vercel).

### 3. `package.json` — `postinstall` para `prisma generate`

```json
"scripts": {
  "postinstall": "prisma generate",
  "dev": "next dev",
  "build": "next build",
  ...
}
```

O Vercel executa `npm install` (dispara `postinstall`) antes do build command. Sem isso, o build falha com `Cannot find module '.prisma/client'`.

### 4. `prisma/seed.ts` — senhas via env vars + guard de produção

```ts
// Proteção dupla: duas flags independentes devem ser setadas explicitamente.
// Uma flag única pode ser setada por engano; duas flags simultâneas tornam
// a execução acidental praticamente impossível.
if (process.env.ALLOW_PROD_SEED !== 'true' || process.env.SEED_CONFIRM !== 'production') {
  console.error(
    '❌ Seed bloqueado. Para executar, defina:\n' +
    '   ALLOW_PROD_SEED=true\n' +
    '   SEED_CONFIRM=production'
  )
  process.exit(1)
}

// Senhas obrigatórias via env vars — nenhum fallback hardcoded
const adminPassword = process.env.ADMIN_PASSWORD
const superAdminPassword = process.env.SUPERADMIN_PASSWORD

if (!adminPassword || !superAdminPassword) {
  console.error('❌ ADMIN_PASSWORD e SUPERADMIN_PASSWORD são obrigatórios para o seed de produção.')
  process.exit(1)
}
```

Senhas fracas hardcoded (`admin123`, `superadmin123`) são removidas. As senhas vêm exclusivamente de env vars. A proteção dupla (`ALLOW_PROD_SEED` + `SEED_CONFIRM`) evita execução acidental no banco de produção.

---

## Sequência de deploy

### Pré-requisito

Confirmar que o repositório tem remote no GitHub configurado (`git remote -v`). Se não tiver: criar repo em `github.com/Felipe-Oliveira-Silva` e fazer `git remote add origin` + push.

### Passo 1 — Aplicar mudanças e subir para `main`

Aplicar as 4 mudanças de código e commitar:
```
chore: prepare for production deploy
```

### Passo 2 — Criar projeto no Vercel

- `vercel.com` → New Project → Import Git Repository → selecionar o repo
- Framework: Next.js (auto-detectado)
- **Anotar o URL gerado** (`https://[nome].vercel.app`) antes de continuar
- Não fazer deploy ainda

### Passo 3 — Configurar build command

Project Settings → Build & Development Settings:
```
Build Command:   prisma generate && prisma migrate deploy && next build
Install Command: npm install   (default)
Output Dir:      .next          (default)
```

### Passo 4 — Conectar Neon via Vercel Storage

- Vercel project → Storage → Create Database → Neon Postgres
- A integração injeta automaticamente `DATABASE_URL` (pooler) e `DATABASE_URL_UNPOOLED` (direct)
- Em Settings → Environment Variables, adicionar manualmente:
  ```
  DIRECT_URL = [valor de DATABASE_URL_UNPOOLED]
  ```

### Passo 5 — Adicionar env vars restantes (apenas Production)

| Variável | Valor |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_SECRET` | mesmo valor de `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | `https://[nome].vercel.app` |
| `AUTH_URL` | mesmo valor de `NEXTAUTH_URL` |
| `R2_ACCOUNT_ID` | do `.env` local |
| `R2_ACCESS_KEY_ID` | do `.env` local |
| `R2_SECRET_ACCESS_KEY` | do `.env` local |
| `R2_BUCKET_NAME` | do `.env` local |
| `ADMIN_PASSWORD` | senha forte escolhida agora |
| `SUPERADMIN_PASSWORD` | senha forte escolhida agora |

### Passo 6 — Primeiro deploy

Push para `main` dispara o deploy automaticamente. Acompanhar build logs:  
- `prisma migrate deploy` deve listar as migrations aplicadas  
- `next build` deve compilar sem erros

---

## Bootstrap pós-deploy

### Passo 1 — Puxar env vars de produção localmente

```bash
npx vercel env pull .env.production.local
```

### Passo 2 — Rodar seed em produção

```bash
ALLOW_PROD_SEED=true SEED_CONFIRM=production npx dotenv -e .env.production.local -- npx prisma db seed
```

O que cria (via `upsert` — idempotente):

| Registro | Detalhe |
|---|---|
| Company `relatec-company-id` | Relatec, plano enterprise |
| `admin@relatec.com.br` | role ADMIN, senha de `ADMIN_PASSWORD` |
| `super@relatec.com.br` | role SUPERADMIN, senha de `SUPERADMIN_PASSWORD` |

As senhas vêm das env vars de produção — nenhuma senha fraca é gerada em nenhum momento.

### Passo 3 — Smoke test

- Abrir `https://[nome].vercel.app`
- Login com `super@relatec.com.br`
- Criar empresa de teste via `/superadmin`
- Criar visita → relatório → assinar → gerar PDF → verificar download via R2

---

## Segurança de migrations

`prisma migrate deploy` aplica apenas os arquivos de migration já versionados em `prisma/migrations/`. Nunca gera migrations novas nem executa `db push`. Os arquivos de migration são revisados em PRs antes de chegar em `main`, portanto nada destrutivo alcança produção sem revisão prévia.

---

## Workflow após o primeiro deploy

Todo push para `main` dispara deploy automático. O build command executa `prisma migrate deploy` a cada deploy — se não houver migrations pendentes, o comando é no-op e seguro. Se houver, aplica somente o que está nos arquivos versionados.

---

## Troca de domínio no futuro

Ao apontar um domínio próprio (ex: `app.relatec.com.br`), atualizar obrigatoriamente as seguintes env vars no Vercel (Production):

| Variável | Novo valor |
|---|---|
| `NEXTAUTH_URL` | `https://app.relatec.com.br` |
| `AUTH_URL` | `https://app.relatec.com.br` |

Sem essa atualização, os redirects de autenticação e os callbacks do NextAuth continuarão apontando para o domínio antigo, causando falhas de login em produção.
