// app/(landing-page)/checkout-plano/components/ModalPagamento.tsx
'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import FormularioPagamentoStripe from './FormularioPagamentoStripe';

// Inicializa a instância pública do Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface ModalPagamentoProps {
  estaAberto: boolean;
  onFechar: () => void;
  onPagamentoConcluido: () => void;
  clientSecret: string; // Chave gerada pela nossa futura API
}

export default function ModalPagamento({ estaAberto, onFechar, onPagamentoConcluido, clientSecret }: ModalPagamentoProps) {
  if (!estaAberto) return null;

  // Customização visual dos elementos do Stripe para combinar com a identidade visual limpa do SaaS
  const aparenciaStripe = {
    theme: 'flat' as const,
    variables: {
      colorPrimary: '#E16349',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      borderRadius: '12px',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 animate-scale-up">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Gateway Seguro Stripe</span>
            <h3 className="text-lg font-black text-gray-900 tracking-tight mt-0.5">Finalizar Faturamento</h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
            Ambiente Seguro
          </span>
        </div>

        {/* CONTAINER DO STRIPE ELEMENTS */}
        {clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: aparenciaStripe }}>
            <FormularioPagamentoStripe onSucesso={onPagamentoConcluido} onFechar={onFechar} />
          </Elements>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <span className="h-6 w-6 border-2 border-[#E16349] border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs font-semibold text-gray-500">Iniciando conexão segura com o Stripe...</p>
          </div>
        )}
      </div>
    </div>
  );
}
