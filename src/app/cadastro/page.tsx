import Link from 'next/link'

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-[#080d14] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="text-cyan-500 font-extrabold tracking-widest text-sm uppercase mb-6">
          RELATEC
        </p>
        <h1 className="text-2xl font-bold text-slate-100 mb-3">
          Cadastro em breve
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          Estamos preparando o cadastro online. Por enquanto, entre em contato
          via WhatsApp para criar sua conta.
        </p>
        <a
          href="https://wa.me/5511916821634"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-cyan-500 hover:bg-cyan-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors mb-4"
        >
          Falar no WhatsApp
        </a>
        <div>
          <Link
            href="/login"
            className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            Já tem conta? Entrar →
          </Link>
        </div>
      </div>
    </div>
  )
}
