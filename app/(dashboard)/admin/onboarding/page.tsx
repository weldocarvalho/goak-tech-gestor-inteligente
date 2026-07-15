// app/admin/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PassoIdentidade from './components/PassoIdentidade';
import PassoProdutoCampeao from './components/PassoProdutoCampeao';
import PassoFichaTecnica from './components/PassoFichaTecnica';

export default function OnboardingPage() {
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'WCS Gestor Inteligente';

  const [dadosLoja, setDadosLoja] = useState({ tipoCozinha: 'Hamburgueria', slugCardapio: '' });
  const [produtoEstrela, setProdutoEstrela] = useState({ nome: '', precoVenda: '' });
  const [insumoBase, setInsumoBase] = useState({ nome: '', custoUnitario: '', quantidadeNecessaria: '' });

  const handleFinalizar = async () => {
    setCarregando(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push('/admin/metricas');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F9] flex flex-col justify-between p-4 md:p-8 font-sans antialiased text-gray-800">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4 border-b border-gray-200">
        <div className="flex flex-col">
          <span className="text-xs uppercase font-extrabold text-gray-400 tracking-wider">Setup de Ativação</span>
          <h2 className="text-base font-black text-gray-900 tracking-tight">{appName}</h2>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className={`h-2.5 w-8 rounded-full transition-all duration-300 ${passo >= num ? 'bg-[#E16349]' : 'bg-gray-200'}`} />
          ))}
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto my-8 flex-grow flex items-center justify-center">
        <div className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden grid md:grid-cols-12 min-h-[450px]">
          <div className="md:col-span-4 bg-gray-950 p-6 md:p-8 text-white flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-extrabold text-[#E16349] tracking-widest">Etapa {passo} de 3</span>
              <h3 className="text-lg font-black tracking-tight">{passo === 1 ? 'Canais de Venda' : passo === 2 ? 'O Produto Estrela' : 'Engenharia Financeira'}</h3>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">Configurando os parâmetros essenciais para o cruzamento de CMV com tráfego.</p>
            </div>
          </div>

          <div className="md:col-span-8 p-6 md:p-8 flex flex-col justify-between">
            {passo === 1 && <PassoIdentidade tipoCozinha={dadosLoja.tipoCozinha} slugCardapio={dadosLoja.slugCardapio} onChange={setDadosLoja} />}
            {passo === 2 && <PassoProdutoCampeao nome={produtoEstrela.nome} precoVenda={produtoEstrela.precoVenda} onChange={setProdutoEstrela} />}
            {passo === 3 && (
              <PassoFichaTecnica 
                nomeInsumo={insumoBase.nome} 
                custoUnitario={insumoBase.custoUnitario} 
                quantidadeNecessaria={insumoBase.quantidadeNecessaria} 
                precoVendaPai={Number(produtoEstrela.precoVenda)} 
                onChange={setInsumoBase} 
              />
            )}

            <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
              {passo > 1 ? (
                <button type="button" onClick={() => setPasso(passo - 1)} className="bg-gray-100 text-gray-700 font-bold py-2.5 px-5 rounded-xl text-xs transition">Voltar</button>
              ) : <div />}

              {passo < 3 ? (
                <button 
                  type="button" 
                  disabled={passo === 1 && !dadosLoja.slugCardapio || passo === 2 && (!produtoEstrela.nome || !produtoEstrela.precoVenda)}
                  onClick={() => setPasso(passo + 1)} 
                  className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-xl text-xs shadow-sm disabled:bg-gray-200"
                >
                  Avançar Passo →
                </button>
              ) : (
                <button type="button" disabled={carregando || !insumoBase.nome} onClick={handleFinalizar} className="bg-[#E16349] text-white font-black py-3 px-6 rounded-xl text-xs shadow-sm flex items-center gap-2">
                  {carregando ? 'Provisionando...' : 'Concluir e Ligar Comando 🚀'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
