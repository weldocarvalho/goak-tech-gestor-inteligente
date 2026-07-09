// components/ecommerce/ModalCheckout.tsx
'use client';

import React, { useState } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useCarrinho } from './ContextoCarrinho'; // Ajuste o caminho conforme seu projeto
import { criarPagamentoMercadoPago } from '@/actions/checkout';

// Inicializa o SDK do Mercado Pago com a chave pública do ambiente
if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, {
    locale: 'pt-BR',
  });
}

interface ModalCheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DadosPixRetorno {
  pedidoId: string;
  copiaECola: string;
  qrCodeBase64: string;
}

export default function ModalCheckout({ isOpen, onClose }: ModalCheckoutProps) {
  const { totalCarrinho, limparCarrinho, cmvTotal, fbclid } = useCarrinho();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  
  // Estado crucial de UX: Se o Pix for gerado, mudamos a tela do modal para exibir o código
  const [dadosPix, setDadosPix] = useState<DadosPixRetorno | null>(null);

  if (!isOpen) return null;

  const initialization = {
    amount: totalCarrinho,
  };

  const customization = {
    paymentMethods: {
      ticket: ['pix'], // Foco total na conversão rápida do Pix para delivery
      creditCard: 'all',
      debitCard: 'all',
      maxInstallments: 12,
    },
    visual: {
      style: {
        theme: 'flat' as const,
      },
    },
  };

  const onSubmit = async ({ formData }: any) => {
    setCarregando(true);
    setErro(null);

    try {
      const dadosCompletosPagamento = {
        token: formData.token,
        issuer_id: formData.issuer_id,
        payment_method_id: formData.payment_method_id,
        transaction_amount: formData.transaction_amount,
        installments: formData.installments,
        payer: {
          email: formData.payer.email,
          identification: formData.payer.identification,
        },
        metadata: {
          cmv_total: cmvTotal,
          meta_click_id: fbclid,
        }
      };

      const resultado = await criarPagamentoMercadoPago(dadosCompletosPagamento);

      if (resultado.sucesso) {
        // Se for Pix, capturamos o QR Code e não fechamos o modal ainda
        if (formData.payment_method_id === 'pix' && resultado.pixCopiaECola) {
          setDadosPix({
            pedidoId: resultado.pedidoId,
            copiaECola: resultado.pixCopiaECola,
            qrCodeBase64: resultado.pixQrCodeBase64 || '',
          });
          limparCarrinho(); // Limpa o carrinho pois o pedido já foi gerado no sistema
        } else {
          // Se for cartão aprovado direto, segue para a tela de sucesso/rastreamento
          limparCarrinho();
          onClose();
          window.location.href = `/status-pedido?id=${resultado.pedidoId}`;
        }
      } else {
        setErro(resultado.mensagem || 'Falha ao processar o pagamento. Tente novamente.');
      }
    } catch (err) {
      console.error('Erro no checkout:', err);
      setErro('Ocorreu um erro inesperado ao processar sua transação.');
    } finally {
      setCarregando(false);
    }
  };

  // Função auxiliar de UX para facilitar a cópia do código no celular
  const manipularCopiaPix = () => {
    if (!dadosPix) return;
    navigator.clipboard.writeText(dadosPix.copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000); // Reseta o texto do botão após 3 segundos
  };

  const irParaAcompanhamento = () => {
    if (!dadosPix) return;
    onClose();
    window.location.href = `/status-pedido?id=${dadosPix.pedidoId}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
        >
          ✕
        </button>

        {/* CENÁRIO A: TELA DE PIX GERADO (Foco em conversão mobile) */}
        {dadosPix ? (
          <div className="text-center py-4 animate-fadeIn">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800">Pix Gerado com Sucesso!</h2>
            <p className="text-sm text-gray-500 mt-1">Aguardando a confirmação do pagamento para iniciar o preparo.</p>

            {/* Renderização do QR Code Visual se houver */}
            {dadosPix.qrCodeBase64 && (
              <div className="my-6 flex justify-center border border-gray-100 p-4 rounded-xl max-w-[200px] mx-auto bg-white shadow-sm">
                <img 
                  src={`data:image/jpeg;base64,${dadosPix.qrCodeBase64}`} 
                  alt="QR Code Pix" 
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Código Copia e Cola estruturado para um clique */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-left">
                Código Pix Copia e Cola
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={dadosPix.copiaECola}
                  className="w-full rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600 select-all focus:outline-none"
                />
                <button
                  onClick={manipularCopiaPix}
                  className={`px-4 rounded-xl font-medium text-sm transition-all shadow-sm ${
                    copiado 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-800 text-white hover:bg-gray-900'
                  }`}
                >
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Botão de Direcionamento Proativo */}
            <button
              onClick={irParaAcompanhamento}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Ver Status do Pedido em Tempo Real</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        ) : (
          
          /* CENÁRIO B: FORMULÁRIO DE CHECKOUT TRADICIONAL */
          <>
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">Finalizar seu Pedido</h2>
              <p className="text-sm text-gray-500 mt-1">Escolha a melhor forma de pagamento abaixo</p>
            </div>

            <div className="mb-6 rounded-xl bg-gray-50 p-4 border border-gray-100">
              <div className="flex justify-between items-center font-semibold text-gray-700">
                <span>Total a pagar:</span>
                <span className="text-xl text-emerald-600">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCarrinho)}
                </span>
              </div>
            </div>

            {erro && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {erro}
              </div>
            )}

            {carregando && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 rounded-2xl">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                <p className="mt-4 text-sm font-medium text-gray-600">Processando sua transação com segurança...</p>
              </div>
            )}

            <div className="mercado-pago-container min-h-[300px]">
              <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
                onReady={() => console.log('Checkout pronto')}
                onError={(err) => {
                  console.error('Erro no Brick:', err);
                  setErro('Não foi possível inicializar o gateway de pagamento.');
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
