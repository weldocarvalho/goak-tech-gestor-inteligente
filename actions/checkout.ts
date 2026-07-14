// actions/checkout.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const mpClient = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

interface ItemPedidoInput {
  item_cardapio_id: string;
  quantidade: number;
  preco_unitario: number;
}

interface PayloadRequisicaoMP {
  token?: string;
  issuer_id?: string;
  payment_method_id: string;
  transaction_amount: number;
  installments?: number;
  payer: { email: string; nome: string; telefone: string };
  slug: string;
  dadosCliente: any;
  itens: ItemPedidoInput[];
  fb_click_id: string | null;
}

export async function criarPedidoEMercadoPago(dados: PayloadRequisicaoMP) {
  try {
    const supabase = await createClient();

    if (!dados.slug || dados.itens.length === 0 || !mpClient) {
      return { success: false, error: 'Configurações de infraestrutura ausentes.' };
    }

    // 1. Busca o Restaurante
    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('id')
      .eq('slug', dados.slug)
      .maybeSingle();

    if (errRestaurante || !restaurante) {
      return { success: false, error: 'Restaurante não localizado ou inativo.' };
    }

    // 2. Cálculo Otimizado de CMV em Lote
    const itemIds = dados.itens.map(i => i.item_cardapio_id);
    const { data: composicoes } = await supabase
      .from('composicao_produto')
      .select('item_cardapio_id, quantidade_necessaria, insumos(custo_unitario)')
      .in('item_cardapio_id', itemIds);

    let cmvTotalCalculado = 0;
    if (composicoes) {
      const qtdPorItem = new Map(dados.itens.map(i => [i.item_cardapio_id, i.quantidade]));
      for (const comp of composicoes) {
        const qtdVendida = qtdPorItem.get(comp.item_cardapio_id) || 0;
        const custoInsumo = Number((comp.insumos as any)?.custo_unitario || 0);
        cmvTotalCalculado += Number(comp.quantidade_necessaria) * qtdVendida * custoInsumo;
      }
    }

    // 3. Criação Isolada do Pedido Mestre
    const { data: novoPedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert([{
        restaurante_id: restaurante.id,
        status: 'PENDENTE',
        valor_total: dados.transaction_amount,
        forma_pagamento: dados.payment_method_id === 'pix' ? 'PIX' : 'CARTAO',
        dados_cliente: dados.dadosCliente,
        fb_click_id: dados.fb_click_id
      }])
      .select('id')
      .single();

    if (errPedido || !novoPedido) {
      throw new Error(`Erro ao instanciar pedido: ${errPedido?.message}`);
    }

    // 4. Inserção dos Itens Relacionados
    const linhasItens = dados.itens.map(item => ({
      pedido_id: novoPedido.id,
      item_cardapio_id: item.item_cardapio_id,
      quantidade: item.quantidade,
      preco_unitario: item.preco_unitario
    }));

    const { error: errItens } = await supabase.from('itens_pedido').insert(linhasItens);
    if (errItens) throw new Error('Falha crítica ao vincular itens ao pedido mestre.');

    // 5. Disparo Transparente Gateway (Mercado Pago API v1)
    const payment = new Payment(mpClient);
    const corpoRequisicao: any = {
      transaction_amount: Number(dados.transaction_amount),
      description: `Pedido #${novoPedido.id.slice(0,8)} - AceleraFood`,
      payment_method_id: dados.payment_method_id,
      payer: { email: dados.payer.email.trim() },
      notification_url: `${process.env.NEXT_PUBLIC_URL || 'https://ngrok-free.app'}/api/webhooks/pagamentos`,
      metadata: {
        pedido_id: novoPedido.id,
        restaurante_id: restaurante.id,
        cmv_total: cmvTotalCalculado
      },
    };

    if (dados.payment_method_id !== 'pix') {
      corpoRequisicao.token = dados.token;
      corpoRequisicao.issuer_id = dados.issuer_id;
      corpoRequisicao.installments = Number(dados.installments);
    }

    const respostaMP = await payment.create({ body: corpoRequisicao });

    if (respostaMP && respostaMP.id) {
      const dadosPix = respostaMP.point_of_interaction?.transaction_data;
      return {
        success: true,
        pedidoId: novoPedido.id,
        pixCopiaECola: dadosPix?.qr_code || null,
        pixQrCodeBase64: dadosPix?.qr_code_base64 || null,
      };
    }

    return { success: false, error: 'O gateway rejeitou os parâmetros de cobrança.' };

  } catch (error: any) {
    console.error('[Action Error]:', error);
    return { success: false, error: error.message || 'Erro inesperado no motor de checkout.' };
  }
}
