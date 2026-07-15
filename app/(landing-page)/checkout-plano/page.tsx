// app/(landing-page)/checkout-plano/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ModalPagamento from './components/ModalPagamento';
import { autenticarSessaoSilenciosa } from '@/actions/authB2B';

export default function CheckoutPage() {
  const router = useRouter();
  const [modalAberto, setModalAberto] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [carregandoIntencao, setCarregandoIntencao] = useState(false);

  const [formData, setFormData] = useState({
    nomeEmpresa: '',
    emailCorporativo: '',
    nomeDono: '',
  });

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'SaaS Gestor';

  // PASSO 1: Disparado ao enviar o formulário corporativo
  const handleAbrirPagamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregandoIntencao(true);

    console.log('PASSOU NO CHECKOUT PLANO DA LANDING PAGE. Dados do formulário enviados:', formData);

    try {
      // Aponta para a nova API especializada em assinaturas corporativas
      const res = await fetch('/api/checkout-plano/criar-intencao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeEmpresa: formData.nomeEmpresa,
          emailCorporativo: formData.emailCorporativo,
          nomeDono: formData.nomeDono
        })
      });

      if (!res.ok) throw new Error('Falha ao registrar intenção no gateway.');

      const dados = await res.json();
      setClientSecret(dados.clientSecret);
      setModalAberto(true);
    } catch (error) {
      console.error('Erro na conexão:', error);
      alert('Erro ao conectar com o servidor da Stripe. Verifique as credenciais.');
    } finally {
      setCarregandoIntencao(false);
    }
  };


  // PASSO 2: Executado imediatamente quando o dinheiro cai na conta do Stripe
  const handleFluxoSucessoPagamento = async () => {
    setModalAberto(false);

    // Ativa um estado de loading visual na tela para o usuário saber que a conta está sendo provisionada
    setCarregandoIntencao(true);

    try {
      // Dispara a autenticação silenciosa usando o e-mail corporativo preenchido pelo gestor
      const resultado = await autenticarSessaoSilenciosa(formData.emailCorporativo);

      if (resultado.sucesso) {
        // Cookies injetados com sucesso! Redireciona o usuário logado para o Onboarding
        router.push('/admin/onboarding');
      } else {
        // Caso a automação instantânea falhe, avisa o cliente e oferece o login padrão
        alert(resultado.erro || 'Sua conta foi criada, mas tivemos um problema no login automático. Por favor, acesse a tela de login.');
        router.push('/login');
      }
    } catch (error) {
      console.error('Erro no redirecionamento pós-venda:', error);
      router.push('/login');
    } finally {
      setCarregandoIntencao(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F4F4F9] flex flex-col justify-center items-center p-4 md:p-8 font-sans antialiased text-gray-800">

      <div className="max-w-4xl w-full mb-4 flex justify-start">
        <Link
          href="/"
          className="text-xs font-bold text-gray-500 hover:text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
        >
          ← Voltar para a página principal
        </Link>
      </div>

      <div className="max-w-4xl w-full bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden grid md:grid-cols-12">

        {/* COMPONENTE LATERAL DE ASSINATURA */}
        <div className="md:col-span-5 p-6 md:p-8 bg-gray-950 text-white flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold">Assinatura Anual B2B</span>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">{appName}</h2>
            </div>

            <div className="space-y-3 border-t border-gray-800 pt-4 text-xs font-semibold text-gray-300">
              <div className="flex justify-between py-1">
                <span>Plano Premium Master</span>
                <span className="text-[#E16349]">Ativo</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Cálculo de CMV/CPA</span>
                <span className="text-emerald-400">Incluso</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4 mt-6">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total Mensal</span>
            <p className="text-2xl md:text-3xl font-black text-[#E16349] tracking-tight">R$ 197<span className="text-xs text-gray-400 font-normal">/mês</span></p>
          </div>
        </div>

        {/* FORMULÁRIO DE IDENTIFICAÇÃO */}
        <form onSubmit={handleAbrirPagamento} className="md:col-span-7 p-6 md:p-8 space-y-6">
          <div>
            <h3 className="text-base md:text-lg font-black text-gray-900 tracking-tight">Identificação Corporativa</h3>
            <p className="text-xs text-gray-500 font-medium">As informações abaixo criam seu Tenant e sua conta Master automaticamente após o pagamento.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1 tracking-wider">Nome do Restaurante</label>
              <input
                type="text"
                required
                placeholder="Ex: Burger King Franchise"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
                value={formData.nomeEmpresa}
                onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1 tracking-wider">Nome do Gestor / Diretor</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Augusto"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
                value={formData.nomeDono}
                onChange={(e) => setFormData({ ...formData, nomeDono: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1 tracking-wider">E-mail Corporativo de Login</label>
              <input
                type="email"
                required
                placeholder="diretoria@restaurante.com"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
                value={formData.emailCorporativo}
                onChange={(e) => setFormData({ ...formData, emailCorporativo: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={carregandoIntencao}
              className="w-full bg-[#E16349] hover:bg-[#c9523a] text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-300"
            >
              {carregandoIntencao ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Conectando ao Stripe...
                </>
              ) : (
                'Prosseguir para o Pagamento Seguro 💳'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL DO MODAL SEGURO */}
      <ModalPagamento
        estaAberto={modalAberto}
        clientSecret={clientSecret}
        onFechar={() => setModalAberto(false)}
        onPagamentoConcluido={handleFluxoSucessoPagamento}
      />
    </div>
  );
}
