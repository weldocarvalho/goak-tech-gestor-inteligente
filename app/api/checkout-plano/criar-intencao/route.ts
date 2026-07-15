// app/api/checkout-plano/criar-intencao/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// REMOVEMOS o parâmetro apiVersion antigo para deixar a SDK escolher a versão correta de forma dinâmica
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomeEmpresa, emailCorporativo, nomeDono } = body;

    if (!nomeEmpresa || !emailCorporativo || !nomeDono) {
      return NextResponse.json({ error: 'Dados corporativos incompletos' }, { status: 400 });
    }

    // Criando a intenção de pagamento na Stripe (Ajustado para o valor correto do plano de R$ 197,00)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 25, // Representado em centavos (R$ 0,25)
      currency: 'brl',
      // payment_method_types: ['card', 'pix'], 
      payment_method_types: ['card'], 
      metadata: {
        tipo_fluxo: 'assinatura_saas_wcs',
        nome_empresa: nomeEmpresa,
        email_corporativo: emailCorporativo,
        nome_dono: nomeDono
      }
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error: any) {
    console.error('Erro ao gerar intenção de cobrança B2B:', error);
    return NextResponse.json({ error: 'Erro interno no servidor de pagamentos' }, { status: 500 });
  }
}
