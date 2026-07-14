// components/ecommerce/ProvedorMercadoPago.tsx
'use client';

import { Payment } from '@mercadopago/sdk-react';

interface ProvedorProps {
  valorTotal: number;
  email: string;
  nome: string;
  isPending: boolean;
  onSubmitMercadoPago: (param: any) => Promise<void>;
}

export default function ProvedorMercadoPago({
  valorTotal,
  email,
  nome,
  isPending,
  onSubmitMercadoPago
}: ProvedorProps) {
  const primeiroNome = nome.trim().split(' ')[0] || 'Cliente';
  const sobrenome = nome.trim().split(' ').slice(1).join(' ') || 'Silva';

  return (
    <div className="mercado-pago-container min-h-[280px] relative w-full transition-all">
      {isPending && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex flex-col items-center justify-center mountaineer z-50 text-xs font-extrabold text-zinc-700 animate-pulse">
          <span>Segurando Conexão Transacional...</span>
          <span className="text-[10px] text-zinc-400 font-medium mt-1">Não feche ou saia desta tela.</span>
        </div>
      )}
      <Payment
        initialization={{
          amount: Number(valorTotal),
          payer: {
            email: email.trim(),
            firstName: primeiroNome,
            lastName: sobrenome,
            entityType: 'individual'
          }
        }}
        customization={{
          paymentMethods: {
            ticket: ['pix'],
            creditCard: 'all',
            debitCard: 'all'
          },
          visual: {
            style: {
              theme: 'flat' as const
            }
          }
        }}
        onSubmit={onSubmitMercadoPago}
        onError={(err) => console.error('[SDK Mercado Pago Error]:', err)}
      />
    </div>
  );
}
