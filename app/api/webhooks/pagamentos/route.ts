import { NextResponse } from 'next/server';
import { createWebhookAdminClient } from '@/utils/supabase/webhook';
import {
  ambienteMercadoPagoEhSandbox,
  obterTokenMercadoPagoTesteConfigurado,
} from '@/utils/mercado-pago';

const MP_API_BASE = 'https://api.mercadopago.com';

interface ItemMetadado {
  item_cardapio_id: string;
  quantidade: number;
}

interface MetadataPedido {
  slug?: string;
  restauranteId?: string;
  dadosCliente?: string;
  itens?: string;
  metodoPagamento?: 'PIX' | 'CARTAO';
  ambiente?: 'production' | 'sandbox';
}

interface ItemCardapioPrecificado {
  id: string;
  preco_venda: number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro interno desconhecido.';
}

async function buscarPagamentoMercadoPago(accessToken: string, paymentId: string) {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || `Falha ao consultar pagamento ${paymentId}.`);
  }

  return payload as {
    id: string;
    status: string;
    payment_method_id?: string;
    metadata?: MetadataPedido;
    external_reference?: string;
    transaction_amount?: number;
  };
}

function validarItens(itens: ItemMetadado[]) {
  return itens.every(
    (item) =>
      typeof item.item_cardapio_id === 'string' &&
      item.item_cardapio_id.length > 0 &&
      Number.isInteger(item.quantidade) &&
      item.quantidade > 0
  );
}

async function extrairCorpo(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    return NextResponse.json({ error: 'URL pública da aplicação não configurada.' }, { status: 500 });
  }

  try {
    const body = await extrairCorpo(request);
    const dataId = body?.data?.id ?? body?.id ?? null;
    const tipo = body?.type ?? body?.topic ?? body?.action ?? null;
    const restauranteId = String(
      new URL(request.url).searchParams.get('restaurante_id') ?? body?.restaurante_id ?? ''
    ).trim();

    if (!dataId) {
      return NextResponse.json({ error: 'Notificação sem identificador de pagamento.' }, { status: 400 });
    }

    if (!restauranteId) {
      return NextResponse.json({ error: 'restaurante_id ausente na notificação.' }, { status: 400 });
    }

    if (tipo && !String(tipo).toLowerCase().includes('payment')) {
      return NextResponse.json({ received: true });
    }

    const supabase = createWebhookAdminClient();
    const tokenTeste = obterTokenMercadoPagoTesteConfigurado();
    let accessTokenParaConsulta = '';

    if (ambienteMercadoPagoEhSandbox() && tokenTeste) {
      accessTokenParaConsulta = tokenTeste;
    } else {
      const { data: integracao, error: errIntegracao } = await supabase
        .from('restaurante_integracoes_pagamento')
        .select('access_token, connection_status')
        .eq('restaurante_id', restauranteId)
        .maybeSingle();

      if (errIntegracao || !integracao?.access_token || integracao.connection_status !== 'conectado') {
        console.error('❌ Webhook sem token de integração válido:', {
          restauranteId,
          errIntegracao,
          connection_status: integracao?.connection_status,
        });
        return NextResponse.json({ error: 'Integração Mercado Pago indisponível.' }, { status: 409 });
      }

      accessTokenParaConsulta = integracao.access_token;
    }

    if (!accessTokenParaConsulta) {
      return NextResponse.json({ error: 'Token do Mercado Pago indisponível para consulta.' }, { status: 409 });
    }

    const pagamento = await buscarPagamentoMercadoPago(accessTokenParaConsulta, String(dataId));
    if (pagamento.status !== 'approved') {
      return NextResponse.json({ received: true });
    }

    const metadata = pagamento.metadata ?? {};
    const slug = String(metadata.slug ?? '').trim();
    const dadosCliente = metadata.dadosCliente ? JSON.parse(metadata.dadosCliente) : null;
    const itens = metadata.itens ? (JSON.parse(metadata.itens) as ItemMetadado[]) : [];

    if (!slug) {
      return NextResponse.json({ error: 'Slug do restaurante ausente nos metadados.' }, { status: 400 });
    }

    if (!dadosCliente || typeof dadosCliente.nome !== 'string' || typeof dadosCliente.telefone !== 'string') {
      return NextResponse.json({ error: 'Dados do cliente inválidos.' }, { status: 400 });
    }

    if (!Array.isArray(itens) || itens.length === 0 || !validarItens(itens)) {
      return NextResponse.json({ error: 'Itens do pagamento inválidos.' }, { status: 400 });
    }

    const { data: restaurante, error: errRestaurante } = await supabase
      .from('restaurantes')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (errRestaurante || !restaurante) {
      return NextResponse.json({ error: 'Restaurante não localizado.' }, { status: 404 });
    }

    const idsProdutos = itens.map((item) => item.item_cardapio_id);
    const { data: produtosBanco, error: errProdutos } = await supabase
      .from('itens_cardapio')
      .select('id, preco_venda')
      .eq('restaurante_id', restaurante.id)
      .in('id', idsProdutos);

    if (errProdutos || !produtosBanco || produtosBanco.length !== idsProdutos.length) {
      return NextResponse.json({ error: 'Falha ao recuperar preços vigentes.' }, { status: 400 });
    }

    const produtos = produtosBanco as ItemCardapioPrecificado[];
    const valorTotal = itens.reduce((acc, item) => {
      const prod = produtos.find((p) => p.id === item.item_cardapio_id);
      if (!prod) {
        return acc;
      }
      return acc + Number(prod.preco_venda) * item.quantidade;
    }, 0);

    const pedidoExistente = await supabase
      .from('pedidos')
      .select('id')
      .eq('restaurante_id', restaurante.id)
      .eq('fb_click_id', String(pagamento.id))
      .maybeSingle();

    if (pedidoExistente.data) {
      console.log('ℹ️ Webhook ignorado: pagamento já conciliado.', {
        restauranteId,
        paymentId: String(pagamento.id),
      });
      return NextResponse.json({ received: true });
    }

    const formaPagamento = String(pagamento.payment_method_id || metadata.metodoPagamento || 'CARTAO').toUpperCase() === 'PIX'
      ? 'PIX'
      : 'CARTAO';

    const { data: novoPedido, error: errPedido } = await supabase
      .from('pedidos')
      .insert([
        {
          restaurante_id: restaurante.id,
          status: 'PAGO',
          valor_total: Math.round(valorTotal * 100) / 100,
          forma_pagamento: formaPagamento,
          dados_cliente: dadosCliente,
          fb_click_id: String(pagamento.id),
        },
      ])
      .select()
      .single();

    if (errPedido || !novoPedido) {
      throw errPedido || new Error('Erro ao criar pedido.');
    }

    const linhasItens = itens.map((item) => {
      const prod = produtos.find((p) => p.id === item.item_cardapio_id);
      return {
        pedido_id: novoPedido.id,
        item_cardapio_id: item.item_cardapio_id,
        quantidade: item.quantidade,
        preco_unitario: prod ? Number(prod.preco_venda) : 0,
      };
    });

    const { error: errItens } = await supabase.from('itens_pedido').insert(linhasItens);
    if (errItens) {
      throw errItens;
    }

    const { data: composicoes, error: errCompo } = await supabase
      .from('composicao_produto')
      .select('item_cardapio_id, insumo_id, quantidade_necessaria')
      .in('item_cardapio_id', idsProdutos);

    if (errCompo) {
      throw new Error(`Falha ao carregar composição dos produtos: ${errCompo.message}`);
    }

    if (composicoes) {
      const quantidadePorItem = new Map(itens.map((item) => [item.item_cardapio_id, item.quantidade]));

      for (const comp of composicoes) {
        const qtdVendidaDoProduto = quantidadePorItem.get(comp.item_cardapio_id) || 0;
        const quantidadeTotalDeduzir = Number(comp.quantidade_necessaria) * qtdVendidaDoProduto;

        if (quantidadeTotalDeduzir > 0) {
          const { error: errDeduzir } = await supabase.rpc('deduzir_estoque_insumo', {
            p_insumo_id: comp.insumo_id,
            p_quantidade: quantidadeTotalDeduzir,
          });

          if (errDeduzir) {
            throw new Error(`Falha ao deduzir estoque: ${errDeduzir.message}`);
          }
        }
      }
    }

    const hoje = new Date().toISOString().split('T')[0];
    const { error: errFunil } = await supabase.rpc('incrementar_compras_funil', {
      p_restaurante_id: restaurante.id,
      p_data: hoje,
    });

    if (errFunil) {
      throw new Error(`Falha ao atualizar métricas de funil: ${errFunil.message}`);
    }

    console.log(`✅ Pedido ${novoPedido.id} conciliado via webhook Mercado Pago.`);
    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('❌ Erro de processamento interno no webhook Mercado Pago:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
