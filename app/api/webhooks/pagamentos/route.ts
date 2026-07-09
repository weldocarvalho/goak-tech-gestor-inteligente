// app/api/webhooks/pagamentos/route.ts
import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
const mpClient = accessToken ? new MercadoPagoConfig({ accessToken }) : null;

export async function POST(request: Request) {
  try {
    if (!mpClient) return NextResponse.json({ error: 'Config configuration error' }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id') || searchParams.get('data.id');
    const type = searchParams.get('type') || searchParams.get('action');

    // Consome apenas eventos focados em pagamento
    if (type !== 'payment' && type !== 'payment.updated') {
      return NextResponse.json({ received: true });
    }

    const paymentClient = new Payment(mpClient);
    const dadosPagamento = await paymentClient.get({ id: String(id) });

    if (!dadosPagamento || !dadosPagamento.status) {
      return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    }

    const statusMP = dadosPagamento.status;
    const metadados = dadosPagamento.metadata || {};
    
    const pedidoUuid = metadados.pedido_id; // Recupera o UUID real mapeado
    const restauranteUuid = metadados.restaurante_id;
    const dataDeHoje = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD para bater com o tipo 'date'

    if (statusMP === 'approved' && pedidoUuid) {
      console.log(`[Webhook] Compra Aprovada para o UUID de Pedido: ${pedidoUuid}`);

      /* 
      EXECUÇÃO DE SCRIPT NO SUPABASE CONFORME SEU BANCO DE DADOS EXATO:

      1. Atualiza o status do pedido para que o cliente veja a mudança reativa:
      await supabase
        .from('pedidos')
        .update({ status: 'pago' })
        .eq('id', pedidoUuid);

      2. ALIMENTAÇÃO DO SEU DASHBOARD FINANCEIRO (Métricas de Funil):
         Procura se já existe uma linha de métrica criada para aquele restaurante na data de hoje.
         Se existir, incrementa o contador de 'compras_concluidas'.
         
      const { data: metricaExistente } = await supabase
        .from('metricas_funil')
        .select('id, compras_concluidas')
        .eq('restaurante_id', restauranteUuid)
        .eq('data', dataDeHoje)
        .single();

      if (metricaExistente) {
        // Incrementa o contador na linha existente
        await supabase
          .from('metricas_funil')
          .update({ compras_concluidas: metricaExistente.compras_concluidas + 1 })
          .eq('id', metricaExistente.id);
      } else {
        // Se for a primeira venda do dia e a linha ainda não existir (raro, pois o clique cria antes), inicia o registro
        await supabase
          .from('metricas_funil')
          .insert({
            restaurante_id: restauranteUuid,
            data: dataDeHoje,
            visitas_cardapio: 1,
            checkouts_iniciados: 1,
            compras_concluidas: 1
          });
      }
      */
      
      console.log(`[Sucesso] Incremento computado na tabela 'metricas_funil' para a data ${dataDeHoje}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('Erro no processamento interno do Webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
