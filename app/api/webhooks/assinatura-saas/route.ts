// app/api/webhooks/assinatura-saas/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Stripe com a chave secreta de produção/desenvolvimento
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-16' as any,
});

// Inicializa o cliente do Supabase utilizando a Service Role Key Bypass
// Esta chave especial é obrigatória para conseguir criar usuários diretamente no Auth sem restrições de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  const body = await request.text();
  const assinaturaCabecalho = request.headers.get('stripe-signature');
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_SAAS;

  let evento: Stripe.Event;

  // 1. Validação de Segurança da Assinatura do Webhook
  try {
    if (!assinaturaCabecalho || !endpointSecret) {
      return NextResponse.json({ error: 'Assinatura ou chave secreta ausente' }, { status: 400 });
    }
    evento = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err: any) {
    console.error(`❌ Erro na validação da assinatura do Webhook Stripe: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 2. Intercepta o Evento de Sucesso de Captura do Dinheiro (Cartão ou Pix compensado)
  if (evento.type === 'payment_intent.succeeded') {
    const paymentIntent = evento.data.object as Stripe.PaymentIntent;
    const metadados = paymentIntent.metadata;

    // Garante que estamos processando apenas transações de assinatura originadas no funil B2B
    if (metadados?.tipo_fluxo === 'assinatura_saas_wcs') {
      const { nome_empresa, email_corporativo, nome_dono } = metadados;

      console.log(`🚀 Iniciando provisionamento B2B automatizado para a empresa: ${nome_empresa}`);

      try {
        // PASSO A: Inserir a nova empresa na tabela 'restaurantes' e coletar o tenant ID gerado
        const { data: novoRestaurante, error: erroRestaurante } = await supabaseAdmin
          .from('restaurantes')
          .insert([
            {
              nome: nome_empresa,
              tipo: 'Geral', // Tipo padrão inicial
              slug: nome_empresa.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
              status_assinatura: 'onboarding',
              email_corporativo: email_corporativo,
              stripe_account_id: paymentIntent.id // Salva a referência da transação inicial
            }
          ])
          .select()
          .single();

        if (erroRestaurante) throw erroRestaurante;

        // PASSO B: Gerar uma senha randômica segura de alta complexidade
        const senhaTemporaria = Math.random().toString(36).slice(-10) + 'Wcs@' + Math.floor(Math.random() * 100);

        // PASSO C: Provisionar o usuário diretamente na engrenagem de autenticação nativa do Supabase
        const { data: novoUsuarioAuth, error: erroAuth } = await supabaseAdmin.auth.admin.createUser({
          email: email_corporativo,
          password: senhaTemporaria,
          email_confirm: true, // Evita fricção forçando a conta nascer validada
          user_metadata: { nome_completo: nome_dono }
        });

        if (erroAuth) throw erroAuth;

        // PASSO D: Associar o ID do usuário criado ao seu respectivo perfil na tabela 'perfis_admin'
        const { error: erroPerfil } = await supabaseAdmin
          .from('perfis_admin')
          .insert([
            {
              id: novoUsuarioAuth.user.id,
              restaurante_id: novoRestaurante.id,
              nome: nome_dono
            }
          ]);

        if (erroPerfil) throw erroPerfil;

        console.log(`✅ Provisionamento concluído com sucesso para o usuário ${email_corporativo}`);
        
        // TODO: Enviar um gatilho de e-mail/WhatsApp neste ponto contendo as credenciais de acesso
        // temporárias geradas para que o cliente tenha cópia eterna de segurança.

      } catch (erroBanco) {
        console.error('🚨 Erro crítico na execução das queries do ecossistema Supabase:', erroBanco);
        return NextResponse.json({ error: 'Falha interna na gravação de dados' }, { status: 500 });
      }
    }
  }

  // Retorna status positivo para a Stripe saber que recebemos o Webhook com sucesso
  return NextResponse.json({ received: true }, { status: 200 });
}
