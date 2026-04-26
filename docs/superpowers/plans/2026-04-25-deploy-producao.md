# Deploy em Produção — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o Relatec de localhost para produção pública no Vercel com banco Neon, CI/CD via GitHub, e bootstrap seguro dos usuários iniciais.

**Architecture:** Quatro arquivos são ajustados para compatibilidade serverless; o projeto conecta ao GitHub para CI/CD automático; Neon é provisionado via Vercel Marketplace com dois endpoints (pooler para runtime, direto para migrations); seed de produção exige duas flags explícitas e senhas via env vars.

**Tech Stack:** Next.js 16.2.2, Prisma 6, NextAuth v5 beta, Vercel, Neon PostgreSQL, Cloudflare R2, bcryptjs, dotenv-cli (via npx)

---

## File Map

| Arquivo | Ação | O que muda |
|---|---|---|
| `prisma/schema.prisma` | Modify | Adicionar `directUrl = env("DIRECT_URL")` ao datasource |
| `src/lib/prisma.ts` | Modify | `log` condicional — só em desenvolvimento |
| `package.json` | Modify | `postinstall: "prisma generate"` para Vercel |
| `prisma/seed.ts` | Modify | Remover senhas hardcoded, guard duplo, senhas via env vars |

---

### Task 1: schema.prisma, prisma.ts e package.json

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/prisma.ts`
- Modify: `package.json`

- [ ] **Step 1: Adicionar `directUrl` ao datasource em `prisma/schema.prisma`**

Localizar o bloco `datasource db` (atualmente só tem `url`) e substituir por:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- [ ] **Step 2: Validar o schema**

```bash
npx prisma validate
```

Esperado: saída sem erros (algo como `The schema at prisma/schema.prisma is valid`).

- [ ] **Step 2b: Adicionar `DIRECT_URL` ao `.env` local**

Após adicionar `directUrl = env("DIRECT_URL")` ao schema, todo comando Prisma local passa a exigir essa variável. Para desenvolvimento local, o valor é o mesmo de `DATABASE_URL` (PostgreSQL local não precisa de conexão separada para migrations).

Abrir `.env` e adicionar ao final:

```
DIRECT_URL="postgresql://postgres:Adm%40189771@localhost:5432/visitas_tecnicas"
```

O valor deve ser idêntico ao de `DATABASE_URL` já presente no arquivo. O `.env` está no `.gitignore` — essa mudança não será commitada.

- [ ] **Step 3: Tornar logging do Prisma condicional em `src/lib/prisma.ts`**

Substituir o conteúdo do arquivo inteiro por:

```ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Adicionar `postinstall` em `package.json`**

Inserir `"postinstall": "prisma generate"` como primeiro item do bloco `scripts`:

```json
"scripts": {
  "postinstall": "prisma generate",
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
},
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts package.json
git commit -m "chore: add directUrl, conditional prisma logging, postinstall generate"
```

---

### Task 2: Reescrever `prisma/seed.ts` — guard duplo + senhas via env vars

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Confirmar comportamento atual (baseline)**

```bash
npx prisma db seed
```

Esperado (antes da mudança): seed roda e cria usuários com senhas fracas hardcoded. Confirmar que o seed conclui com `🎉 Seed concluído!`.

- [ ] **Step 2: Substituir conteúdo completo de `prisma/seed.ts`**

```ts
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  if (process.env.ALLOW_PROD_SEED !== 'true' || process.env.SEED_CONFIRM !== 'production') {
    console.error(
      '❌ Seed bloqueado. Para executar, defina:\n' +
      '   ALLOW_PROD_SEED=true\n' +
      '   SEED_CONFIRM=production'
    )
    process.exit(1)
  }

  const adminPassword = process.env.ADMIN_PASSWORD
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD

  if (!adminPassword || !superAdminPassword) {
    console.error('❌ ADMIN_PASSWORD e SUPERADMIN_PASSWORD são obrigatórios para o seed de produção.')
    process.exit(1)
  }

  console.log("🌱 Iniciando seed...")

  const company = await prisma.company.upsert({
    where: { id: "relatec-company-id" },
    update: {},
    create: {
      id: "relatec-company-id",
      name: "Relatec",
      email: "contato@relatec.com.br",
      plan: "enterprise",
      active: true,
    },
  })
  console.log("✅ Empresa:", company.name)

  const admin = await prisma.user.upsert({
    where: { email: "admin@relatec.com.br" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@relatec.com.br",
      password: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      companyId: company.id,
    },
  })
  console.log("✅ Admin:", admin.email)

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@relatec.com.br" },
    update: {},
    create: {
      name: "Super Admin",
      email: "super@relatec.com.br",
      password: await bcrypt.hash(superAdminPassword, 10),
      role: "SUPERADMIN",
      companyId: company.id,
    },
  })
  console.log("✅ Super Admin:", superAdmin.email)
  console.log("🎉 Seed concluído!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 3: Testar guard — sem nenhuma flag (deve bloquear)**

```bash
npx prisma db seed
```

Esperado: exit 1 com mensagem:
```
❌ Seed bloqueado. Para executar, defina:
   ALLOW_PROD_SEED=true
   SEED_CONFIRM=production
```

- [ ] **Step 4: Testar guard — só uma flag (deve bloquear)**

```bash
ALLOW_PROD_SEED=true npx prisma db seed
```

Esperado: exit 1 com a mesma mensagem de bloqueio (`SEED_CONFIRM` ausente).

- [ ] **Step 5: Testar guard — ambas as flags, sem senhas (deve bloquear)**

```bash
ALLOW_PROD_SEED=true SEED_CONFIRM=production npx prisma db seed
```

Esperado: exit 1 com mensagem:
```
❌ ADMIN_PASSWORD e SUPERADMIN_PASSWORD são obrigatórios para o seed de produção.
```

- [ ] **Step 6: Testar seed completo contra banco local**

```bash
ALLOW_PROD_SEED=true SEED_CONFIRM=production ADMIN_PASSWORD=admin_local_123 SUPERADMIN_PASSWORD=super_local_456 npx prisma db seed
```

Esperado:
```
🌱 Iniciando seed...
✅ Empresa: Relatec
✅ Admin: admin@relatec.com.br
✅ Super Admin: super@relatec.com.br
🎉 Seed concluído!
```

- [ ] **Step 7: Commit**

```bash
git add prisma/seed.ts
git commit -m "chore: seed requires explicit flags and env var passwords"
```

---

### Task 3: Verificar build local e push para GitHub

**Files:** nenhum

- [ ] **Step 1: Confirmar que build passa localmente**

```bash
npm run build
```

Esperado: termina com `✓ Generating static pages` e lista de rotas sem erros de compilação.

- [ ] **Step 2: Verificar remote GitHub**

```bash
git remote -v
```

Esperado: linha `origin` apontando para `github.com/Felipe-Oliveira-Silva/...`

Se não tiver remote, criar o repositório em `github.com` (sem README, sem .gitignore) e rodar:

```bash
git remote add origin https://github.com/Felipe-Oliveira-Silva/NOME-DO-REPO.git
```

- [ ] **Step 3: Push para GitHub**

```bash
git push origin master
```

Esperado: commits visíveis no GitHub.

---

### Task 4: Criar projeto no Vercel e configurar build command

**Files:** nenhum (configuração via UI)

- [ ] **Step 1: Importar repositório no Vercel**

- Acessar `vercel.com` → New Project
- "Import Git Repository" → selecionar o repositório
- Framework: **Next.js** (detectado automaticamente)

- [ ] **Step 2: Anotar o URL gerado**

Antes de qualquer outra ação, anotar o URL que o Vercel exibe (ex: `https://visitas-tecnicas.vercel.app`). Esse valor será usado em `NEXTAUTH_URL` e `AUTH_URL`.

- [ ] **Step 3: Não clicar em Deploy ainda**

Fechar o wizard de deploy inicial. Navegar para **Project Settings → Build & Development Settings**.

- [ ] **Step 4: Sobrescrever o build command**

Em "Build Command" habilitar override e inserir:

```
prisma generate && prisma migrate deploy && next build
```

Install Command: `npm install` (padrão — não alterar)
Output Directory: `.next` (padrão — não alterar)

- [ ] **Step 5: Salvar**

Clicar em **Save**.

---

### Task 5: Provisionar Neon e configurar todas as env vars

**Files:** nenhum (configuração via UI)

- [ ] **Step 1: Criar banco Neon via Vercel Storage**

- Vercel project → aba **Storage**
- **Create Database** → **Neon Postgres**
- Escolher a região mais próxima do público-alvo
- Confirmar criação

A integração injeta automaticamente em **Production**:
- `DATABASE_URL` — URL com pooler (para runtime do Prisma)
- `DATABASE_URL_UNPOOLED` — URL direta sem pooler

- [ ] **Step 2: Adicionar `DIRECT_URL` manualmente**

- Vercel → **Settings → Environment Variables**
- Copiar o valor completo de `DATABASE_URL_UNPOOLED`
- Criar nova variável:
  - Nome: `DIRECT_URL`
  - Valor: [valor copiado]
  - Ambientes: marcar apenas **Production**

- [ ] **Step 3: Gerar o segredo para NextAuth**

No terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copiar o valor gerado — será usado nos próximos dois campos.

- [ ] **Step 4: Adicionar as env vars restantes (Production apenas)**

Vercel → Settings → Environment Variables. Para cada linha abaixo, criar uma variável marcando apenas **Production**:

| Variável | Valor |
|---|---|
| `NEXTAUTH_SECRET` | valor gerado no step anterior |
| `AUTH_SECRET` | mesmo valor de `NEXTAUTH_SECRET` |
| `NEXTAUTH_URL` | URL anotado na Task 4, ex: `https://visitas-tecnicas.vercel.app` |
| `AUTH_URL` | mesmo valor de `NEXTAUTH_URL` |
| `R2_ACCOUNT_ID` | valor do `.env` local |
| `R2_ACCESS_KEY_ID` | valor do `.env` local |
| `R2_SECRET_ACCESS_KEY` | valor do `.env` local |
| `R2_BUCKET_NAME` | valor do `.env` local |
| `ADMIN_PASSWORD` | senha forte, mínimo 12 chars — guardar com segurança |
| `SUPERADMIN_PASSWORD` | senha forte diferente — guardar com segurança |

- [ ] **Step 5: Confirmar que todas as variáveis estão em Production**

Vercel → Settings → Environment Variables → filtrar por "Production". Devem aparecer pelo menos 12 variáveis (incluindo `DATABASE_URL` e `DATABASE_URL_UNPOOLED` do Neon).

---

### Task 6: Primeiro deploy

**Files:** nenhum

- [ ] **Step 1: Disparar o deploy**

Qualquer push para `main`/`master` dispara automaticamente. Se preferir disparar manualmente:

- Vercel → Deployments → **Redeploy** (no último deployment) ou **Deploy** se disponível

- [ ] **Step 2: Acompanhar build logs**

Vercel → Deployments → clicar no deploy em andamento → **Build Logs**.

Sequência esperada:
```
Running "npm install"
Running "prisma generate"       ✓
Running "prisma migrate deploy"
  Applying migration `XXXXXX_...` ✓
  [lista de migrations]
Running "next build"
  ✓ Compiled successfully
```

**Se `prisma migrate deploy` falhar com "Environment variable not found: DIRECT_URL":**
Verificar Task 5 Step 2 — `DIRECT_URL` precisa estar em Production.

**Se `next build` falhar com "Cannot find module '.prisma/client'":**
Verificar Task 1 Step 4 — `postinstall` precisa estar no `package.json`.

- [ ] **Step 3: Verificar que o domínio responde**

Após build verde, acessar o URL do Vercel. Esperado: tela de login do Relatec em `/login`.

---

### Task 7: Bootstrap — seed do banco de produção

**Files:** nenhum (operação one-shot)

- [ ] **Step 1: Instalar Vercel CLI se necessário**

```bash
npx vercel --version 2>/dev/null || npm install -g vercel
vercel login
```

- [ ] **Step 2: Puxar env vars de produção**

```bash
npx vercel env pull .env.production.local
```

Esperado: arquivo `.env.production.local` criado com todas as variáveis de Production, incluindo `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD` e `SUPERADMIN_PASSWORD`.

- [ ] **Step 3: Criar arquivo temporário para o seed**

```bash
cp .env.production.local .env.seed
printf '\nALLOW_PROD_SEED=true\nSEED_CONFIRM=production\n' >> .env.seed
```

O `.env.seed` contém todas as vars de produção mais as duas flags de guard. Ambos os arquivos estão cobertos pelo `.gitignore` (`env*`).

- [ ] **Step 4: Executar o seed contra produção**

```bash
npx dotenv-cli -e .env.seed -- npx prisma db seed
```

`npx dotenv-cli` baixa o pacote automaticamente se não estiver instalado.

Esperado:
```
🌱 Iniciando seed...
✅ Empresa: Relatec
✅ Admin: admin@relatec.com.br
✅ Super Admin: super@relatec.com.br
🎉 Seed concluído!
```

- [ ] **Step 5: Deletar arquivo temporário**

```bash
rm .env.seed
```

`.env.production.local` pode permanecer localmente (está no `.gitignore`) mas nunca deve ser commitado.

---

### Task 8: Smoke test

**Files:** nenhum (verificação manual)

- [ ] **Step 1: Login como SUPERADMIN**

Acessar `https://[url].vercel.app/login`
- Email: `super@relatec.com.br`
- Senha: valor de `SUPERADMIN_PASSWORD` configurado no Vercel

Esperado: redirect para `/dashboard` sem erro de autenticação.

- [ ] **Step 2: Criar empresa via superadmin**

Acessar `/superadmin/empresas/nova`:
- Criar empresa com nome "Empresa Teste"
- Criar usuário admin para a empresa

Esperado: empresa e usuário criados com sucesso.

- [ ] **Step 3: Testar fluxo completo como admin da empresa**

Logar como o admin criado no step anterior e executar:

1. `/dashboard/clientes/novo` — criar cliente (nome + cidade)
2. `/dashboard/visitas/novo` — criar visita para o cliente, com data e técnico
3. Marcar visita como **REALIZED**
4. Criar relatório para a visita
5. Finalizar relatório (DRAFT → FINALIZED)
6. Assinar relatório (preencher nome, doc, e desenhar/enviar assinatura)
7. Gerar PDF
8. Fazer download do PDF

Esperado em cada etapa: sem erro 500. No download, o browser deve redirecionar para URL do R2 e baixar o arquivo PDF.

- [ ] **Step 4: Confirmar integração R2 em produção**

A URL de redirect no download do PDF deve conter `r2.cloudflarestorage.com`. O arquivo deve abrir corretamente no visualizador de PDF.
