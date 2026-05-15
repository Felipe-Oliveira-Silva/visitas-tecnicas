import {
  Users,
  MapPin,
  FileImage,
  FileSpreadsheet,
  PenTool,
  FileDown,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from './reveal'

interface Feature {
  title: string
  desc: string
  icon: LucideIcon
}

const FEATURES: Feature[] = [
  {
    title: 'Clientes e histórico',
    desc: 'Todos os dados do cliente e cada atendimento que sua equipe já fez.',
    icon: Users,
  },
  {
    title: 'Visitas técnicas',
    desc: 'Agenda organizada por técnico, cliente e status da visita.',
    icon: MapPin,
  },
  {
    title: 'Relatórios com fotos',
    desc: 'Laudos completos com fotos do antes e do depois do serviço.',
    icon: FileImage,
  },
  {
    title: 'Orçamentos',
    desc: 'Monte propostas com itens, valores e total calculado automaticamente.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Assinatura digital desenhada',
    desc: 'O cliente assina direto na tela, sem precisar imprimir nada.',
    icon: PenTool,
  },
  {
    title: 'PDF automático',
    desc: 'Documento pronto para envio, com a identidade da sua empresa.',
    icon: FileDown,
  },
  {
    title: 'Dashboard mensal',
    desc: 'Acompanhe quantas visitas foram feitas e o que ainda falta.',
    icon: LayoutDashboard,
  },
  {
    title: 'Dados da empresa separados com segurança',
    desc: 'Cada empresa enxerga apenas o que é seu, sem cruzamento.',
    icon: ShieldCheck,
  },
]

export function FeaturesSection() {
  return (
    <section
      id="recursos"
      className="relative scroll-mt-24 py-20 md:py-28 border-b border-slate-800"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-[11px] uppercase tracking-widest text-cyan-300 font-semibold">
              Recursos
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-balance text-slate-100 leading-tight">
              Tudo o que você precisa em{' '}
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                um só lugar
              </span>
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Controle clientes, visitas, relatórios, orçamentos e documentos
              sem depender de planilhas, conversas soltas ou arquivos perdidos.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon
            return (
              <Reveal key={feature.title} delay={i * 50} className="h-full">
                <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-5 sm:p-6">
                  <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/15 to-blue-500/10 ring-1 ring-cyan-400/20">
                    <Icon
                      size={20}
                      className="text-cyan-300"
                      aria-hidden="true"
                    />
                  </span>
                  <p className="mt-4 text-base font-semibold text-slate-100">
                    {feature.title}
                  </p>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
