# Subsistema 2 — Cadastro de Empresa — Design Spec

**Data:** 2026-04-12
**Status:** Aprovado

## Objetivo

Substituir o placeholder `/cadastro` por um formulário real de auto-registro. Após o cadastro, o usuário é auto-logado, retorna à landing page e escolhe o plano via WhatsApp com mensagem pré-preenchida.

## Fluxo Completo

```
LP (não logado) → /cadastro → preenche form → POST /api/cadastro
→ company criada (active: false, plan: 'start') + user ADMIN
→ auto-login via signIn() → redirect para /
→ LP detecta usuário logado + empresa inativa
→ exibe banner "conta pendente" + cards com botão WhatsApp
→ usuário clica no plano → abre WhatsApp com mensagem pré-preenchida
→ admin ativa empresa no superadmin
→ próximo login → redirect para /dashboard
```

## Formulário de Cadastro (`/cadastro`)

### Campos

| Campo | Obrigatório | Validação |
|---|---|---|
| Nome da empresa | Sim | mínimo 2 caracteres |
| Seu nome (admin) | Sim | mínimo 2 caracteres |
| E-mail | Sim | formato válido, único no banco |
| Telefone | Não | livre |
| CNPJ | Não | livre |
| Senha | Sim | mínimo 6 caracteres |
| Confirmar senha | Sim | igual à senha |

### Comportamento

- Client Component (usa useState para campos e erros)
- Validação no cliente antes de enviar (senhas iguais)
- Chama `POST /api/cadastro`
- Após sucesso: `signIn('credentials', { email, password, redirect: false })` → `router.push('/')`
- Erros exibidos abaixo do formulário (padrão do projeto: `.issues[0].message`)
- Estilo: dark navy, igual ao login (`#080d14` fundo, `#0d1b2a` card)
- Link "Já tem conta? Entrar" → `/login`

## API (`POST /api/cadastro`)

- Rota pública (sem `auth()`)
- Body: `{ nomeEmpresa, nomeAdmin, email, password, phone?, cnpj? }`
- Validação com Zod
- Verifica e-mail único: se já existe, retorna 400 com mensagem clara
- Cria `Company` + `User` em transação Prisma:
  - `company.active = false`
  - `company.plan = 'start'`
  - `user.role = 'ADMIN'`
  - `user.password = bcrypt.hash(password, 10)`
- Retorna `{ ok: true }` com status 201

## Landing Page — Atualizações

### 1. Lógica de redirect

**Antes:** `if (session) redirect('/dashboard')`

**Depois:**
```ts
const session = await auth()
if (session) {
  const company = await prisma.company.findUnique({
    where: { id: session.user.companyId },
    select: { active: true }
  })
  if (company?.active) redirect('/dashboard')
}
```

### 2. Banner de conta pendente

Se `session` existe e empresa inativa, exibir banner no topo da LP:
> "👤 Olá, [nome] — sua conta está pendente de ativação. Escolha um plano abaixo para começar."

### 3. Cards de plano dinâmicos

Extrair cards de plano para `src/components/plan-cards.tsx` (Client Component).

Recebe props:
- `userName: string | null` — nome do usuário logado (ou null se não logado)

Comportamento dos botões:
- `userName` existe → botão WhatsApp com mensagem pré-preenchida
- `userName` é null → link para `/cadastro`

### 4. Atualização de conteúdo dos planos

Renomear e atualizar na landing page (valores no banco permanecem `start`/`pro`/`enterprise`):

| Banco | UI | Preço | Features |
|---|---|---|---|
| `start` | Básico | R$50/mês | Até 2 usuários, até 50 visitas/mês, relatórios simples, assinatura básica |
| `pro` | Profissional | R$110/mês | Até 10 usuários, dashboard completo, anexos e relatórios avançados, filtros |
| `enterprise` | Premium | R$250/mês | Usuários ilimitados, white-label completo, PDF profissional, armazenamento nuvem |

### 5. Mensagens WhatsApp por plano

```
Básico:       "Olá! Me chamo [nome] e gostaria de assinar o plano Básico do Relatec (R$50/mês)."
Profissional: "Olá! Me chamo [nome] e gostaria de assinar o plano Profissional do Relatec (R$110/mês)."
Premium:      "Olá! Me chamo [nome] e gostaria de assinar o plano Premium do Relatec (R$250/mês)."
```

URL: `https://wa.me/5511916821634?text=<mensagem codificada>`

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/app/cadastro/page.tsx` | Reescrever — formulário real |
| `src/app/api/cadastro/route.ts` | Criar — POST público |
| `src/app/page.tsx` | Atualizar — redirect logic, banner, conteúdo dos planos |
| `src/components/plan-cards.tsx` | Criar — Client Component com botões dinâmicos |

## O que NÃO está no escopo

- Verificação de e-mail (email verification)
- Rate limiting na API de cadastro
- Tela de upgrade para usuários já ativos (Subsistema 3)
- Integração de pagamento automático
