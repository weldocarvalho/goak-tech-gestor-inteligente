// app/(landing-page)/checkout-plano/components/FormularioPagamentoStripe.tsx
'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

interface FormularioPagamentoProps {
  onSucesso: () => void;
  onFechar: () => void;
}

export default function FormularioPagamentoStripe({ onSucesso, onFechar }: FormularioPagamentoProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const handleExecutarPagamento = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessando(true);
    setMensagemErro(null);

    // Confirma o pagamento diretamente no cliente do Stripe
    const resultado = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Evita redirecionamentos se for aprovado na hora (ex: Cartão ou Pix aprovado via polling)
    });

    if (resultado.error) {
      setMensagemErro(resultado.error.message || 'Ocorreu um erro inesperado no pagamento.');
      setProcessando(false);
    } else if (resultado.paymentIntent && resultado.paymentIntent.status === 'succeeded') {
      // Dinheiro capturado com sucesso! Avança para o registro de conta e login automático
      onSucesso();
    } else {
      setMensagemErro('O pagamento ainda está sendo processado ou aguardando confirmação.');
      setProcessando(false);
    }
  };

  return (
    <form onSubmit={handleExecutarPagamento} className="space-y-6">
      {/* Elemento unificado do Stripe que renderiza Cartão de Crédito ou Pix */}
      <div className="p-1.5 bg-gray-50 border border-gray-100 rounded-xl shadow-inner">
        <PaymentElement 
          options={{
            layout: 'tabs'
            // terms: { cardPayments: 'never', auBecsDebitPayments: 'never' }
          }} 
        />
      </div>

      {mensagemErro && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600">
          ⚠️ {mensagemErro}
        </div>
      )}

      {/* FOOTER DO MODAL DE PAGAMENTO */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
        <button
          type="button"
          disabled={processando}
          onClick={onFechar}
          className="w-full sm:w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={!stripe || processando}
          className="w-full sm:w-2/3 bg-[#E16349] hover:bg-[#c9523a] text-white font-black py-3 px-4 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-300"
        >
          {processando ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Processando Transação...
            </>
          ) : (
            'Confirmar e Pagar Agora 🔒'
          )}
        </button>
      </div>
    </form>
  );
}
