# Landing Page Redesign — Design Spec

**Data:** 2026-05-14
**Status:** Em aprovação
**Escopo:** Refazer a landing page pública (`/`) com foco em conversão e visual SaaS premium. Sem alterar autenticação, billing, Prisma, APIs, rotas protegidas, dashboard, login ou cadastro.

---

## Contexto

A landing atual (`src/app/page.tsx`) cumpre o básico mas tem visual de template padrão: cards uniformes, sem hierarquia visual forte, sem mockups do produto, copy genérica focada em "sistema". O objetivo do redesign é:

1. **Mudar o discurso** — vender a solução para a bagunça operacional (fotos no WhatsApp, relatórios manuais, orçamentos avulsos), não "um sistema".
2. **Elevar o nível visual** — SaaS premium com glassmorphism leve, gradientes sutis, tipografia hierarquizada, microinterações.
3. **Aumentar a densidade de conversão** — 11 seções estruturadas que conduzem o visitante do problema à demonstração.

A landing serve **donos e gestores** de empresas técnicas (construção, manutenção, elétrica, climatização, solar, segurança eletrônica, assistência). Copy comercial, não-técnica. Evitar jargão (multi-tenant, Prisma, R2, NextAuth).

### Princípio editorial: persuasiva e escaneável

Mesmo com 11 seções, a página **não pode cansar**. Diretrizes obrigatórias para cada seção:

- Cada seção entrega uma ideia única. Sem repetir argumentos entre seções.
- Cards/itens: **título curto (≤ 4 palavras)** + **uma frase de descrição (≤ 14 palavras)**. Nada de parágrafos.
- Headings de seção em **uma linha**. Subtítulos opcionais em uma linha curta.
- Listas em vez de blocos de texto sempre que possível.
- Espaço respirável (`py-20 md:py-28`) — não confundir "denso de conteúdo" com "longo".
- O visitante deve conseguir entender o produto **rolando rápido**, sem ler tudo.
- Se uma seção precisar de mais de 6 cards, repensar antes de aumentar.

---

## Decisões já alinhadas com o usuário

| Decisão | Escolha |
|---|---|
| Nomes dos planos exibidos | **Básico / Profissional / Premium** (espelha `BILLING_PLANS`) |
| CTA primário "Testar gratuitamente" | → `/cadastro` |
| CTA secundário "Solicitar demonstração" | → `WHATSAPP_URL` (`https://wa.me/5511916821634`) |
| Lógica de auth da landing | **Preservada 1:1** (sessão ativa redireciona, banner de pendência, SignOutButton) |
| Animações | CSS + Tailwind + `IntersectionObserver` (sem framer-motion, sem novas deps) |
| Ícones | `lucide-react` (já instalado) — substitui emojis |
| Imagens | Mockups em HTML/Tailwind por enquanto. `/public/landing/` reservado para futuro |
| `plan-cards.tsx` e `faq-item.tsx` | Restilizar classes Tailwind (sem mexer em estado, fetch, dados, billing) |

---

## Direção visual

**Paleta**
- Fundo base: `#070a12` (mais escuro que hoje) com **gradientes radiais** sutis cyan/blue em pontos-chave (atrás do hero, atrás do CTA final).
- Acento principal: `cyan-400` → `blue-500` (gradiente). Mantém o brand cyan atual.
- Superfícies (cards/glass): `bg-white/[0.03]` + `backdrop-blur-xl` + `border border-white/10`.
- Texto: `text-slate-100` (forte), `text-slate-300` (secundário), `text-slate-500` (terciário).

**Tipografia (Geist, já configurada)**
- H1 hero: 5xl→7xl, font-bold, `text-balance`. Palavras-chave em gradient text (`bg-clip-text text-transparent bg-gradient-to-r`).
- H2 seções: 3xl→5xl, font-bold.
- Eyebrow labels: xs uppercase tracking-widest text-cyan-400.
- Body: base→lg leading-relaxed text-slate-300.

**Componentes visuais**
- Bordas arredondadas: `rounded-2xl` (cards), `rounded-3xl` (containers grandes), `rounded-full` (chips/badges).
- Sombras: `shadow-[0_0_40px_-15px_rgba(34,211,238,0.3)]` em cards de destaque (glow cyan).
- Espaçamento: `py-24 md:py-32` entre seções; `gap-6 md:gap-8` em grids.

**Microinterações**
- `<Reveal/>`: wrapper client com IntersectionObserver que aplica `opacity-0 translate-y-4` → `opacity-100 translate-y-0` ao entrar na viewport. Suporta `delay` para efeito stagger.
- Cards: `transition hover:-translate-y-1 hover:border-cyan-400/30` no hover.
- CTA primário: gradient + shine sutil no hover (`bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-cyan-500/40`).
- Navbar: `backdrop-blur` aumenta quando `scrollY > 8px` (estado client simples).

**Acessibilidade básica**
- `prefers-reduced-motion`: animações desligadas via media query no `globals.css`.
- Foco visível em todos os botões/links (`focus-visible:ring-2 ring-cyan-400`).
- Hierarquia semântica correta (h1 único no hero, h2 por seção).
- Alt text em mockups SVG/ícones decorativos com `aria-hidden`.

---

## Estrutura final da landing (11 seções)

### 1. Navbar (`<LandingNav/>`)
- Logo **RELATEC** em gradient cyan→blue.
- Links: Recursos · Como funciona · Planos · FAQ.
- CTA: "Testar gratuitamente" (primário) + Entrar (ghost).
- Fixa no topo, blur dinâmico ao rolar.
- **Mobile:** menu hambúrguer (lucide `Menu`/`X`) overlay full-screen.
- Se logado + empresa ativa: ver redirect (lógica preservada).
- Se logado + empresa inativa: substitui CTAs por `<SignOutButton/>`.

### 2. Hero (`<Hero/>`)
- Gradiente radial cyan no fundo.
- Eyebrow: "Gestão de visitas técnicas".
- H1: **"Do atendimento ao PDF final, organize suas visitas técnicas em minutos."** ("PDF final" em gradient).
- Subheadline: "Agende visitas, registre fotos, gere relatórios, crie orçamentos e colete assinatura do cliente em uma única plataforma."
- CTA primário: "Testar gratuitamente" → `/cadastro`.
- CTA secundário: "Solicitar demonstração" → `WHATSAPP_URL` (target _blank).
- Trust line: "Sem compromisso. Ideal para equipes técnicas em campo."
- **Mockup composto:** stack de 4-5 mini-cards em HTML/Tailwind (Visita agendada → Relatório com fotos → Orçamento → Assinatura → PDF pronto), com offsets, glow e um pseudo cursor/cliente animado.

### 3. Dor (`<PainSection/>`)
- H2: "Seus registros técnicos ainda ficam espalhados?"
- 6 cards (grid 3×2 desktop, 1 col mobile) com ícone lucide vermelho/laranja suave:
  - 📱 Fotos perdidas no WhatsApp
  - 📝 Relatórios feitos manualmente
  - 💸 Orçamentos fora do histórico
  - ✍️ Assinatura sem padronização
  - 🔍 Dificuldade para achar o que foi feito em cada cliente
  - 📅 Falta de visão mensal das visitas

### 4. Solução / Fluxo (`<SolutionFlow/>`) — `id="como-funciona"`
- H2: "O Relatec centraliza o fluxo da visita técnica"
- 6 passos numerados em linha (horizontal scroll suave em mobile, grid 6 col em desktop xl, 3×2 md):
  1. Cadastre o cliente
  2. Agende a visita
  3. Registre fotos e observações
  4. Gere relatório ou orçamento
  5. Colete assinatura
  6. Baixe o PDF final
- Linha conectora sutil entre os passos (border-dashed cyan).

### 5. Recursos (`<FeaturesSection/>`) — `id="recursos"`
- H2: "Tudo o que você precisa em um só lugar"
- 8 cards (grid 4×2 desktop, 2×4 md, 1 col mobile):
  - Clientes e histórico
  - Visitas técnicas
  - Relatórios com fotos
  - Orçamentos
  - Assinatura digital desenhada
  - PDF automático
  - Dashboard mensal
  - Dados da empresa separados com segurança
- Cada card: ícone lucide + título + descrição curta (1 linha).

### 6. Público-alvo (`<AudienceSection/>`)
- H2: "Feito para empresas que atendem clientes em campo"
- 7 cards/chips com ícone:
  - Construção e reformas
  - Manutenção predial
  - Elétrica e hidráulica
  - Ar-condicionado e climatização
  - Energia solar
  - Segurança eletrônica
  - Assistência técnica

### 7. Preview (`<PreviewSection/>`)
- H2: "Veja o Relatec em ação"
- 2-3 mockups maiores em HTML/Tailwind (não placeholder textual):
  - **Mockup A:** Dashboard mensal (cards de KPI, lista de visitas recentes).
  - **Mockup B:** Relatório com fotos (header cliente + grid de fotos + observações).
  - **Mockup C:** Orçamento + assinatura (preview de itens, valor total, área de assinatura).
- Cada mockup com chrome de janela (3 bolinhas + barra) para parecer interface real.
- Preparado para trocar por imagens em `/public/landing/` no futuro.

### 8. Benefícios (`<BenefitsSection/>`)
- H2: "Menos retrabalho. Mais profissionalismo."
- 6 itens com ícone lucide check:
  - Reduza tempo criando relatórios
  - Padronize entregas para clientes
  - Tenha histórico organizado
  - Facilite a rotina dos técnicos
  - Envie PDFs profissionais
  - Acompanhe visitas realizadas e pendentes
- Layout: lista 2 colunas, sem cards (texto direto + ícone), espaço respirável.

### 9. Planos (`<PlansSection/>`) — `id="planos"`
- H2: "Planos que crescem com sua empresa"
- Subtítulo curto sobre flexibilidade.
- Reutiliza `<PlanCards/>` (componente existente intacto — só restilo de classes Tailwind: glass surfaces, gradient border no popular, sombras suaves).
- Se logado + pendente: mantém mensagem "Após o contato, sua conta será ativada em até 24h."

### 10. FAQ (`<FaqSection/>`) — `id="faq"`
- H2: "Perguntas frequentes"
- 6 perguntas (substitui as 3 atuais), usando `<FaqItem/>` existente (só restilo das classes):
  - Preciso instalar aplicativo?
  - Funciona no celular?
  - Posso testar sem compromisso?
  - Consigo gerar PDF?
  - O sistema serve para construção/reforma?
  - Os dados de uma empresa ficam separados das outras?

### 11. CTA final (`<FinalCta/>`)
- Gradiente radial cyan grande no fundo, container glass.
- H2: "Pronto para organizar suas visitas técnicas?"
- Texto: "Teste o Relatec e veja como fica mais simples registrar atendimentos, gerar documentos e manter histórico dos clientes."
- Botão: "Testar gratuitamente" → `/cadastro`.

### Rodapé (`<LandingFooter/>`)
- Logo + tagline curta.
- Links: Entrar · Cadastrar · WhatsApp.
- Copyright "© 2026 Relatec".

---

## Lógica de auth preservada (não muda)

Comportamento atual de `src/app/page.tsx` que **deve continuar exatamente igual**:

1. `auth()` carrega a sessão.
2. Se houver sessão → busca `company.active`.
3. Se `companyActive === true` → `redirect('/dashboard')`.
4. Se sessão + empresa inativa → renderiza landing **com banner** "conta pendente" (acima do hero) + `<SignOutButton/>` na navbar (no lugar dos botões Entrar/Cadastrar) + texto extra na seção de planos.
5. Se sem sessão → landing normal com Entrar/Cadastrar.

A nova `page.tsx` mantém essa árvore de decisão; muda apenas os componentes renderizados.

---

## Arquivos a criar / alterar

### Alterar (4)

| Arquivo | Mudança |
|---|---|
| `src/app/page.tsx` | Composição enxuta: preserva auth/session/redirect/banner; renderiza os novos componentes. |
| `src/app/globals.css` | Adicionar keyframes (`fade-in-up`), media query `prefers-reduced-motion`, util de gradient se necessário. |
| `src/components/plan-cards.tsx` | **Apenas classes Tailwind** — glass, gradient border no popular, sombra. Zero mudança em estado, fetch, dados, billing. |
| `src/components/faq-item.tsx` | **Apenas classes Tailwind** — glass surface, hover state, transição suave. |

`plan-cards` e `faq-item` viram modificações puramente cosméticas conforme aprovado.

### Criar (14) — em `src/components/landing/`

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `reveal.tsx` | client | Wrapper com IntersectionObserver para fade-in/slide-up no scroll, com prop `delay` |
| `landing-nav.tsx` | client | Header sticky com blur dinâmico + menu mobile |
| `hero.tsx` | server | Hero com CTAs, gradient bg e mockup |
| `hero-mockup.tsx` | server | Composição visual dos cards "produto" do hero |
| `pain-section.tsx` | server | 6 cards de dor |
| `solution-flow.tsx` | server | 6 passos numerados |
| `features-section.tsx` | server | 8 cards de recurso |
| `audience-section.tsx` | server | 7 chips/cards de nicho |
| `preview-section.tsx` | server | 2-3 mockups grandes do produto (HTML/Tailwind) |
| `benefits-section.tsx` | server | 6 itens de benefício |
| `plans-section.tsx` | server | Wrapper de título/contexto em volta de `<PlanCards/>` |
| `faq-section.tsx` | server | Wrapper de título + lista de `<FaqItem/>` (6 perguntas) |
| `final-cta.tsx` | server | Bloco grande de fechamento |
| `landing-footer.tsx` | server | Rodapé |

(Total 14 itens criados. Componentes server por padrão; `client` apenas onde precisa de estado/observers.)

### Não tocar

- `src/lib/billing.ts`, `src/lib/auth.ts`, `src/lib/prisma.ts`, `src/lib/constants.ts`
- `src/app/api/**`
- `src/app/dashboard/**`, `src/app/login/**`, `src/app/cadastro/**`, `src/app/superadmin/**`
- `src/components/sign-out-button.tsx` (reutilizado como está)
- `prisma/**`
- Qualquer fluxo de Mercado Pago / checkout

---

## Riscos e mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Quebrar lógica de auth/redirect ao reescrever `page.tsx` | Média | Manter o bloco `auth()` + `prisma.company.findUnique` + `redirect` byte a byte; só trocar o JSX abaixo |
| Restilo de `<PlanCards/>` afetar comportamento de checkout | Baixa-Média | Modificar **apenas atributos `className`**. Nenhuma mudança em handlers, state, fetch, condicionais, ordem de elementos |
| Restilo de `<FaqItem/>` quebrar acessibilidade do `aria-expanded` | Baixa | Manter `aria-expanded`, `button`, `onClick`; só trocar classes |
| Animações JS travarem mobile fraco | Baixa | `<Reveal/>` usa `IntersectionObserver` (nativo); fallback `prefers-reduced-motion: reduce` desliga transição |
| Overflow horizontal em mobile (grid/mockup) | Média | Cada seção testada com `overflow-x-hidden` no body já existe; mockups com `min-w-0` e `max-w-full` |
| Bundle JS aumentar muito | Baixa | Apenas `<LandingNav/>` e `<Reveal/>` são client. Resto é server-render |
| Hidratação inconsistente do `<LandingNav/>` (scroll state) | Baixa | Inicializar com `scrolled=false`, só ligar listener no `useEffect` |
| Lucide imports inflarem bundle | Baixa | Importar ícone por ícone (`import { Calendar } from 'lucide-react'`) — tree-shake natural |
| Mockups parecerem "placeholder" e não produto | Média | Mockups com dados realistas (nomes, datas, valores brasileiros), chrome de janela, sombras profundas |
| Spec não captar feedback futuro do usuário sobre copy específica | Baixa | Copy implementada exatamente como no briefing; ajustes finos depois da preview |

---

## Plano de implementação em etapas pequenas

Cada etapa é independentemente testável (visitar `/` no dev server) e commitável. Sequência otimizada para ver progresso visual rápido.

### Etapa 1 — Fundação visual
- Adicionar keyframes e media query em `globals.css`.
- Criar `src/components/landing/reveal.tsx` (client, IntersectionObserver).
- **Critério:** `<Reveal>` aplicado em um elemento de teste anima ao entrar na viewport, respeita `prefers-reduced-motion`.

### Etapa 2 — Esqueleto da nova página
- Refatorar `src/app/page.tsx`: preservar bloco de auth/session/redirect/banner, substituir todo o JSX por imports dos novos componentes (ainda stubs vazios).
- Criar stubs server-render de todos os componentes em `src/components/landing/` (cada um devolve `<section>` mínimo com `id` e título).
- **Critério:** página carrega sem erro, redirect de sessão ativa continua funcionando, banner de pendência aparece quando logado/inativo.

### Etapa 3 — Navbar
- Implementar `<LandingNav/>` (sticky, blur dinâmico, links, CTAs, menu mobile).
- Preservar fluxo: logado+inativo → `<SignOutButton/>`; deslogado → Entrar + "Testar gratuitamente".
- **Critério:** scroll aumenta blur; clique no hambúrguer abre overlay; CTAs vão para `/cadastro` e `WHATSAPP_URL`.

### Etapa 4 — Hero
- Implementar `<Hero/>` com headline, subhead, CTAs, trust line.
- Implementar `<HeroMockup/>` (stack de cards visuais do produto).
- Aplicar `<Reveal/>` no headline e mockup.
- **Critério:** hero ocupa tela inicial com impacto visual; CTAs funcionam; mockup parece produto real (não placeholder).

### Etapa 5 — Dor + Solução
- Implementar `<PainSection/>` (6 cards com ícones lucide).
- Implementar `<SolutionFlow/>` (6 passos numerados com linha conectora).
- **Critério:** seções aparecem com fade-in stagger; responsivas (grid 3×2 → 1 col em mobile); sem overflow horizontal.

### Etapa 6 — Recursos + Público-alvo
- Implementar `<FeaturesSection/>` (8 cards).
- Implementar `<AudienceSection/>` (7 nichos).
- **Critério:** grids consistentes; hover lift nos cards; mobile sem horizontal scroll.

### Etapa 7 — Preview
- Implementar `<PreviewSection/>` com 2-3 mockups HTML/Tailwind (dashboard, relatório, orçamento+assinatura).
- Cada mockup com chrome de janela e dados realistas em PT-BR.
- **Critério:** mockups parecem screenshots reais do produto; nada de texto "placeholder".

### Etapa 8 — Benefícios + CTA final
- Implementar `<BenefitsSection/>` (lista 2 col).
- Implementar `<FinalCta/>` (bloco glass com gradiente).
- **Critério:** ambos animam ao entrar; CTA final reaproveita estilo do CTA do hero.

### Etapa 9 — Planos + FAQ (restilo)
- Restilizar `src/components/plan-cards.tsx` (apenas classes — glass, gradient border no popular, sombras).
- Restilizar `src/components/faq-item.tsx` (apenas classes — glass surface, transição).
- Implementar `<PlansSection/>` e `<FaqSection/>` (wrappers de título + 6 perguntas no FAQ).
- **Critério:** checkout funciona idêntico ao antes (testar fluxo de subscribe). FAQ abre/fecha. Visual coerente com o resto da landing.

### Etapa 10 — Rodapé + polimento
- Implementar `<LandingFooter/>`.
- Passada final: verificar responsividade em 320px / 768px / 1280px / 1920px; foco visível; `prefers-reduced-motion`; semântica de heading.
- **Critério:** zero overflow horizontal em qualquer breakpoint; navegação por teclado funcional.

### Etapa 11 — Validação final
- Build de produção (`npm run build`) sem erros nem warnings novos.
- Lint sem novos issues.
- Smoke test manual: deslogado / logado-pendente / logado-ativo (deve redirecionar) / clique em todos os CTAs.
- **Critério:** tudo verde; pronto para commit final.

---

## Fora de escopo (explícito)

- Imagens reais em `/public/landing/` (deixa preparado mas usa mockups HTML).
- Nova página de planos / pricing dedicada.
- Tracking de conversão (GA, Pixel, etc.).
- Internacionalização (PT-BR only).
- A/B testing.
- Blog / changelog / docs públicos.
- Alteração de nomes ou preços de planos.
- Qualquer mudança em billing / Mercado Pago / checkout / Prisma / APIs / dashboard / auth / login / cadastro.
