// app/(landing-page)/funcionalidades/page.tsx
import Link from 'next/link';

export default function FuncionalidadesPage() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Gestor';

  return (
    <div className="min-h-screen bg-[#F4F4F9] text-gray-800 font-sans antialiased p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* NAVEGAÇÃO DE VOLTA */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm">
            ← Voltar para Home
          </Link>
          <span className="text-xs font-black tracking-tight text-gray-400 uppercase">{appName} System</span>
        </div>

        {/* INTRODUÇÃO DA ARQUITETURA */}
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Infraestrutura Operacional</h1>
          <p className="text-xs md:text-sm text-gray-600 font-medium">
            Entenda como nossa inteligência de dados orquestra sua cozinha, seu estoque e suas margens digitais em tempo real de forma unificada.
          </p>
        </div>

        {/* DETALHAMENTO EM CARDS COM SOMBRAS DISCRETAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#F4F4F9] shadow-[6px_6px_12px_rgba(163,177,198,0.5),_-6px_-6px_12px_rgba(255,255,255,0.8)] space-y-3">
            <span className="text-xl">🍳</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900">Ficha Técnica e Receitas</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Vincule insumos específicos (peso, unidade, custo) diretamente aos itens do cardápio. O sistema abate o estoque automaticamente a cada pedido concluído no banco.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#F4F4F9] shadow-[6px_6px_12px_rgba(163,177,198,0.5),_-6px_-6px_12px_rgba(255,255,255,0.8)] space-y-3">
            <span className="text-xl">🛡️</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900">Trava Preventiva de Margem</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Sua equipe mudou o preço do insumo? Se o custo de mercadoria vendida (CMV) cruzar a barreira crítica de 40%, o painel administrativo acende alertas visuais imediatamente.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#F4F4F9] shadow-[6px_6px_12px_rgba(163,177,198,0.5),_-6px_-6px_12px_rgba(255,255,255,0.8)] space-y-3">
            <span className="text-xl">📈</span>
            <h3 className="text-sm md:text-base font-bold text-gray-900">Cruzamento de CPA Real</h3>
            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              Puxamos via Graph API do Meta os gastos exatos de tráfego. Cruzamos custo por clique e impressões com o funil do Supabase para apontar seu ROI financeiro sem achismos.
            </p>
          </div>

        </div>

        {/* CTA DE FECHAMENTO */}
        <div className="text-center pt-4">
          <Link 
            href="/checkout-plano"
            className="inline-block bg-[#E16349] text-white font-bold px-8 py-3.5 rounded-xl shadow-md hover:bg-[#c9523a] transition-all text-sm"
          >
            Garantir Meu Acesso ao Ecossistema
          </Link>
        </div>

      </div>
    </div>
  );
}
