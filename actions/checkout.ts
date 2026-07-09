// actions/checkout.ts
'use server';

import { MercadoPagoConfig, Payment } from 'mercadopago';
// Importe seu cliente do supabase configurado no projeto (exemplo: @/lib/supabase ou similar)
// import { supabase } from '@/lib/supabase'; 

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const mpClient = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

interface ItemCarrinhoMapeado {
  item_cardapio_id: string;
  quantidade: number;
  preco_unitario: number;
}

interface DadosPagamentoMP {
  token?: string;
  issuer_id?: string;
  payment_method_id: string;
  transaction_amount: number;
  installments?: number;
  restaurante_id: string; // Resgatado via slug do catálogo
  payer: {
    email: string;
    nome: string;
    telefone: string;
  };
  itens: ItemCarrinhoMapeado[];
  metadata: {
    cmv_total: number;
    meta_click_id: string | null;
    meta_browser_id: string | null; // Adicionado fbp baseado no seu banco
  };
}

export async function criarPagamentoMercadoPago(dados: DadosPagamentoMP) {
  try {
    if (!mpClient) {
      return { sucesso: false, message: 'Erro de infraestrutura de pagamentos.' };
    }

    const payment = new Payment(mpClient);

    // PASSO 1: GRAVAÇÃO DO PEDIDO NO SUPABASE SEGUINDO A SUA ARQUITETURA
    // Deixamos o Supabase gerar o id UUID automaticamente na inserção.
    // Mapeamos os campos exatos que você enviou: dados_cliente (jsonb), fb_click_id, etc.
    
    /* 
    const { data: novoPedido, error: erroPedido } = await supabase
      .from('pedidos')
      .insert({
        restaurante_id: dados.restaurante_id,
        valor_total: dados.transaction_amount,
        status: 'pendente', // 'character varying' não nulo
        forma_pagamento: dados.payment_method_id, // 'character varying' não nulo
        fb_click_id: dados.metadata.meta_click_id,
        fb_browser_id: dados.metadata.meta_browser_id,
        dados_cliente: {
          nome: dados.payer.nome,
          email: dados.payer.email,
          telefone: dados.payer.telefone
        }
      })
      .select()
      .single();

    if (erroPedido || !novoPedido) throw new Error('Falha ao registrar pedido base.');

    // Salva os itens na tabela relacional 'itens_pedido' que você mapeou
    const itensParaInserir = dados.itens.map(item => ({
      pedido_id: novoPedido.id, // O UUID gerado pelo banco
      item_cardapio_id: item.item_cardapio_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario
    }));

    await supabase.from('itens_pedido').insert(itensParaInserir);
    const uuidPedidoReal = novoPedido.id;
    */

    // Como estamos rodando em ambiente local sem o Supabase conectado ainda, simulamos um UUID válido:
    const uuidPedidoReal = '3b2d114a-1ab2-4c32-bc91-23678cdfa123'; 

    // PASSO 2: REQUISIÇÃO AO MERCADO PAGO UTILIZANDO O UUID REAL
    const corpoRequisicao: any = {
      transaction_amount: dados.transaction_amount,
      description: `Pedido no ecossistema - Ref: ${uuidPedidoReal}`,
      payment_method_id: dados.payment_method_id,
      payer: { email: dados.payer.email },
      notification_url: `${process.env.NEXT_PUBLIC_URL || 'https://ngrok-free.app'}/api/webhooks/pagamentos`,
      
      metadata: {
        pedido_id: uuidPedidoReal, // Amarra o ID UUID do seu banco na transação externa
        restaurante_id: dados.restaurante_id,
        cmv_total: dados.metadata.cmv_total,
      },
    };

    if (dados.payment_method_id !== 'pix') {
      corpoRequisicao.token = dados.token;
      corpoRequisicao.issuer_id = dados.issuer_id;
      corpoRequisicao.installments = dados.installments;
    }

    const respostaMP = await payment.create({ body: corpoRequisicao });

    if (respostaMP && respostaMP.id) {
      const dadosPix = respostaMP.point_of_interaction?.transaction_data;
      return {
        sucesso: true,
        pedidoId: uuidPedidoReal, // Devolve o UUID para a rota de status de pedido do cliente
        pixCopiaECola: dadosPix?.qr_code || null,
        pixQrCodeBase64: dadosPix?.qr_code_base64 || null,
      };
    }

    return { sucesso: false, mensagem: 'O gateway recusou os parâmetros da transação.' };

  } catch (error: any) {
    console.error('Erro na Server Action atualizada:', error);
    return { sucesso: false, mensagem: error?.message || 'Erro interno no servidor.' };
  }
}
