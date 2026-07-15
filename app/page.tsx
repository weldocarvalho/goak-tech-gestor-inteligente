// app/(landing-page)/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Gestor';

  return (
    <div className="min-h-screen bg-[#F4F4F9] text-gray-800 font-sans antialiased">
      
      {/* HEADER LIMPO E ADAPTÁVEL */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-[#F4F4F9]/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 h-14">
          <div className="flex-shrink-0">
            <span className="text-lg md:text-xl font-black tracking-tight text-gray-900">
              {appName.split(' ')[0]} <span className="text-[#E16349]">{appName.split(' ').slice(1).join(' ')}</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link href="/funcionalidades" className="hover:text-gray-950 transition">
              Funcionalidades
            </Link>
            <a href="#contato" className="hover:text-gray-950 transition">
              Fale Conosco
            </a>
          </nav>
          
          <div className="flex-shrink-0">
            <Link 
              href="/checkout-plano"
              className="inline-block bg-[#E16349] hover:bg-[#c9523a] text-white text-xs md:text-sm font-bold px-3 py-2 md:px-5 md:py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-4 py-12 md:py-24 grid md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 space-y-6 text-center md:text-left">
          <span className="inline-flex items-center py-1 px-3 rounded-full text-xs font-bold bg-[#E16349]/10 text-[#E16349]">
            Inteligência de Margem B2B
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Pare de queimar dinheiro. Controle seu <span className="text-[#E16349]">Lucro Real</span>.
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed max-w-md mx-auto md:mx-0">
            O único ecossistema que cruza campanhas de tráfego com a Ficha Técnica da sua cozinha. Se o CMV subir, o {appName} avisa.
          </p>
          <div className="pt-2">
            <Link
              href="/checkout-plano"
              className="inline-block w-full sm:w-auto bg-[#E16349] hover:bg-[#c9523a] text-white text-center font-bold px-8 py-4 rounded-xl shadow-md transition-all text-sm tracking-wide"
            >
              Quero Lucrar Mais Alto 🚀
            </Link>
          </div>
        </div>
        
        {/* COMPOSIÇÃO BENTO GRID COM RELEVO EXCLUSIVO NOS CARDS */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 p-2">
          
          {/* Card 1: Monitor Principal */}
          <div className="sm:col-span-2 p-6 rounded-2xl bg-[#F4F4F9] shadow-[6px_6px_12px_rgba(163,177,198,0.5),_-6px_-6px_12px_rgba(255,255,255,0.8)] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-3">
              <div>
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Painel de Controle</p>
                <h3 className="font-black text-gray-900 text-sm">{appName} Command Center</h3>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            
            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-inner">
              <p className="text-xs font-bold text-gray-700 leading-relaxed">
                🤖 <strong className="text-[#E16349]">AI Insights:</strong> O custo por aquisição no Meta Ads subiu 14%. Reduza o insumo do item "Smash Bacon" para equilibrar a margem operacional.
              </p>
            </div>
          </div>

          {/* Card 2: Métrica Margem */}
          <div className="p-5 rounded-2xl bg-[#F4F4F9] shadow-[6px_6px_12px_rgba(163,177,198,0.5),_-6px_-6px_12px_rgba(255,255,255,0.8)] flex flex-col justify-between h-28">
            <p className="text-xs font-bold text-gray-400">Margem Operacional Real</p>
            <p className="text-2xl font-black text-emerald-600 tracking-tight">62.4%</p>
          </div>

          {/* Card 3: Métrica CMV */}
          <div className="p-5 rounded-2xl bg-[#F4F4F9] shadow-[6px_6px_12px_rgba(163,177,198,0.5),_-6px_-6px_12px_rgba(255,255,255,0.8)] flex flex-col justify-between h-28">
            <p className="text-xs font-bold text-gray-400">CMV Consolidado</p>
            <p className="text-2xl font-black text-gray-900 tracking-tight">28.1%</p>
          </div>
        </div>
      </section>

      {/* SEÇÃO DE CONTATO */}
      <section id="contato" className="max-w-3xl mx-auto px-4 py-12">
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-gray-200 text-center space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Fale com um Especialista B2B</h2>
          <p className="text-xs md:text-sm text-gray-600 font-medium max-w-md mx-auto">
            Tem uma operação com franquias ou alto volume e precisa de uma arquitetura customizada? Nosso time técnico te ajuda no onboarding.
          </p>
          <div className="pt-2">
            <a 
              href="mailto:suporte@wcsinteligente.com.br"
              className="inline-block text-xs md:text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 px-5 py-3 rounded-xl hover:bg-gray-100 transition-all"
            >
              ✉️ Enviar E-mail para o Time Corporativo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
