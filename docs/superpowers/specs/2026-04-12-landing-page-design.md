# Landing Page — Design Spec

**Data:** 2026-04-12
**Status:** Aprovado

## Objetivo

Substituir o redirect em `/` por uma landing page pública de marketing do Relatec. Usuários já logados continuam sendo redirecionados para `/dashboard`. Usuários não logados veem a landing page.

## Estrutura de Seções

### 1. Navbar (fixa no topo)
- Logo "RELATEC" em cyan à esquerda
- Links de âncora à direita: Funcionalidades · Planos · FAQ
- Botão outline "Entrar" → `/login`
- Botão preenchido "Cadastrar" → `/cadastro`
- Background: `#0d1b2a` com borda inferior `#1e3a5f`
- Sticky (fixa ao rolar)

### 2. Hero
- Badge superior: "Gestão de Visitas Técnicas" (uppercase, cyan, letra espaçada)
- Título H1 grande em duas linhas, última linha em cyan
- Subtítulo descritivo (sistema completo, multi-empresa, PDF, assinatura digital)
- Dois botões: "Começar grátis →" (preenchido cyan) e "Ver planos" (outline slate)
- Screenshot/mockup do sistema (placeholder — trocar por imagem real depois)

### 3. Público-alvo
- Label: "Para quem é o Relatec"
- Chips horizontais com emojis: Manutenção, Instaladoras elétricas, Refrigeração/HVAC, Inspeções técnicas, TI/Redes

### 4. Funcionalidades (id="funcionalidades")
- 6 cards em grid 3×2
- Cada card: emoji + título + descrição curta
- Conteúdo: Agendamento, Relatórios em PDF, Assinatura digital, Multi-empresa, Painel gerencial, Controle de equipe

### 5. Planos (id="planos")
- Título da seção + subtítulo
- 3 cards lado a lado:
  - **Start** — borda cyan, preço "Grátis", CTA "Cadastrar grátis" → `/cadastro`
  - **Pro** — destaque total (borda 2px cyan, badge "Mais popular"), preço mensal, CTA "Assinar Pro" → `/cadastro`
  - **Enterprise** — borda slate, "Sob consulta", CTA "Falar no WhatsApp" → `https://wa.me/5511916821634`
- Conteúdo real dos planos (preços, limites, features) fornecido pelo usuário depois — usar placeholders no código

### 6. FAQ (id="faq")
- Perguntas em acordeão (expand/collapse com estado React)
- 3 perguntas iniciais (editáveis):
  1. Preciso instalar alguma coisa? → Não, funciona 100% no navegador
  2. Posso testar antes de pagar? → Sim, plano Start é gratuito e sem prazo
  3. Como funciona o pagamento? → Após cadastro, contato via WhatsApp para ativar plano pago

### 7. Rodapé
- Logo + tagline
- Links: Entrar · Cadastrar · WhatsApp
- Copyright "© 2026 Relatec"

## Fluxo de CTAs

| Botão | Destino |
|---|---|
| "Entrar" (navbar) | `/login` |
| "Cadastrar" (navbar) | `/cadastro` |
| "Começar grátis" (hero) | `/cadastro` |
| "Ver planos" (hero) | âncora `#planos` |
| "Cadastrar grátis" (Start) | `/cadastro` |
| "Assinar Pro" (Pro) | `/cadastro` |
| "Falar no WhatsApp" (Enterprise) | `https://wa.me/5511916821634` |

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/app/page.tsx` | Reescrever — de redirect simples para landing page completa |
| `src/app/cadastro/page.tsx` | Criar — placeholder simples ("Em breve") enquanto o Subsistema 2 não existe |

## Arquitetura

- **Server Component** com `auth()` no topo
- Se sessão existe → `redirect('/dashboard')`
- Se não existe → renderiza a landing page inline (sem Client Component necessário, exceto o FAQ)
- O acordeão do FAQ usa estado local → extraído em `src/app/_components/faq-item.tsx` como Client Component
- Zero mudanças de schema, zero queries, zero novas rotas de API

## Estilo

- Tema dark total: fundo `#080d14`, cards `#0d1b2a`, bordas `#1e3a5f` / `#334155`
- Primária: `#0ea5e9` (cyan — igual ao login e ao sistema)
- Tipografia: Helvetica/Inter, títulos brancos `#f1f5f9`, secundário `#94a3b8`, terciário `#475569`
- Coerente com a tela de login existente

## O que NÃO está no escopo desta fase

- Tela de cadastro (`/cadastro`) — Subsistema 2, fase futura
- Tela de upgrade de plano — Subsistema 3, fase futura
- Integração com pagamento — manual via WhatsApp
- Internacionalização
- Analytics / tracking
