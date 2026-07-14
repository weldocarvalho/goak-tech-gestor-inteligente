// app/api/webhooks/pagamentos/route.ts

import { NextResponse } from 'next/server';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const mpClient = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

export async function POST(request: Request) {
  try {
    if (!mpClient) return NextResponse.json({ error: 'MP config error' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('data.id');
    const type = searchParams.get('type') || searchParams.get('action');

    let corpo: any = {};
    try { corpo = await request.json(); } catch {}

    const recursoId = id || corpo?.data?.id;
    const tipoEvento = type || corpo?.type || corpo?.action;

    if (tipoEvento !== 'payment' && tipoEvento !== 'payment.updated') {
      return NextResponse.json({ received: true });
    }

    // Consulta segura na API do Mercado Pago para evitar payloads forjados
    const paymentClient = new Payment(mpClient);
    const dadosPagamento = await paymentClient.get({ id: String(recursoId) });

    if (!dadosPagamento || !dadosPagamento.status) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
    }

    const statusMP = dadosPagamento.status;
    const metadados = dadosPagamento.metadata || {};
    const pedidoUuid = metadados.pedido_id;
    const restauranteId = metadados.restaurante_id;

    if (statusMP === 'approved' && pedidoUuid) {
      const supabase = createWebhookAdminClient();

      // TRAVA DE IDEMPOTÊNCIA: Só atualiza se o status atual for estritamente 'PENDENTE'
      const { data: pedidoAtual, error: errCheck } = await supabase
        .from('pedidos')
        .select('status')
        .eq('id', pedidoUuid)
        .single();

      if (errCheck || !pedidoAtual) throw new Error('Pedido não localizado.');
      
      // Se o pedido já foi pago em uma requisição de webhook anterior, ignora e retorna 200
      if (pedidoAtual.status === 'PAGO') {
        return NextResponse.json({ success: true, message: 'Idempotency triggered' }, { status: 200 });
      }

      // 1. Atualiza status do pedido mestre
      const { error: errUpdate } = await supabase
        .from('pedidos')
        .update({ status: 'PAGO' })
        .eq('id', pedidoUuid);

      if (errUpdate) throw errUpdate;

      // 2. Busca itens associados para dedução atômica
      const { data: itensPedido, error: errItens } = await supabase
        .from('itens_pedido')
        .select('item_cardapio_id, quantidade')
        .eq('pedido_id', pedidoUuid);

      if (errItens || !itensPedido) throw new Error('Falha ao processar conciliação de itens.');

      // 3. Processamento de Estoque via Procedure
      const idsProdutos = itensPedido.map(i => i.item_cardapio_id);
      const { data: composicoes } = await supabase
        .from('composicao_produto')
        .select('item_cardapio_id, insumo_id, quantidade_necessaria')
        .in('item_cardapio_id', idsProdutos);

      if (composicoes) {
        const quantidadePorItem = new Map(itensPedido.map(i => [i.item_cardapio_id, i.quantidade]));
        for (const comp of composicoes) {
          const qtdVendida = quantidadePorItem.get(comp.item_cardapio_id) || 0;
          const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * qtdVendida;
          
          if (quantidadeTotalDeduzir > 0) {
            await supabase.rpc('deduzir_estoque_insumo', {
              p_insumo_id: comp.insumo_id,
              p_quantidade: quantidadeTotalDeduzir
            });
          }
        }
      }

      // 4. Incremento Único e Seguro do Funil de Crescimento
      const hoje = new Date().toISOString().split('T')[0];
      await supabase.rpc('incrementar_compras_funil', {
        p_restaurante_id: restauranteId,
        p_data: hoje
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('[Webhook Critical Error]:', error.message);
    return NextResponse.json({ error: 'Internal processing failure' }, { status: 500 });
  }
}
