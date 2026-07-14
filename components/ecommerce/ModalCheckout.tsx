// components/ecommerce/ModalCheckout.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { initMercadoPago } from '@mercadopago/sdk-react';
import { useCarrinho } from './ContextoCarrinho';
import AbasCheckout from './AbasCheckout';
import VisualizacaoPix from './VisualizacaoPix';
import ProvedorMercadoPago from './ProvedorMercadoPago';
import FormularioDadosPessoais from './FormularioDadosPessoais';
import FormularioEnderecoEntrega from './FormularioEnderecoEntrega';
import { criarPedidoEMercadoPago } from '@/actions/checkout';

if (process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY, { locale: 'pt-BR' });
}

interface CheckoutProps { aberto: boolean; onFechar: () => void; slug: string; ehAcai: boolean; }

export default function ModalCheckout({ aberto, onFechar, slug, ehAcai }: CheckoutProps) {
  const { itens, valorTotal, limparCarrinho } = useCarrinho();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Estados locais do Form
  const [abaAtiva, setAbaAtiva] = useState<'CEP' | 'GPS' | 'RETIRADA'>('CEP');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  
  const [carregandoEndereco, setCarregandoEndereco] = useState(false);
  const [erroLocalizacao, setErroLocalizacao] = useState<string | null>(null);
  const [dadosPix, setDadosPix] = useState<{ pedidoId: string; copiaECola: string; qrCodeBase64: string } | null>(null);

  const enderecoRestaurante = "Setor de Clubes Esportivos Sul, Trecho 2, Brasília - DF";

  useEffect(() => { setMounted(true); return () => setMounted(false); }, []);

  useEffect(() => {
    if (abaAtiva === 'RETIRADA') {
      setRua('Retirada no Balcão'); setNumero('S/N'); setBairro('Centro');
    } else {
      setRua(''); setNumero(''); setBairro('');
    }
    setErroLocalizacao(null);
  }, [abaAtiva]);

  if (!aberto || !mounted || itens.length === 0) return null;

  const lidarComMudancaCep = async (valor: string) => {
    const cepSanitizado = valor.replace(/\D/g, ''); 
    setCep(cepSanitizado);
    if (cepSanitizado.length === 8) {
      setCarregandoEndereco(true); setErroLocalizacao(null);
      try {
        const r = await fetch(`https://viacep.com.br/ws/${cepSanitizado}/json/`);
        const d = await r.json();
        if (!d.erro) {
          setRua(d.logradouro || ''); setBairro(d.bairro || '');
          setTimeout(() => document.getElementById('input-numero')?.focus(), 50);
        } else { setErroLocalizacao('CEP não encontrado.'); }
      } catch { setErroLocalizacao('Erro ao buscar CEP.'); }
      finally { setCarregandoEndereco(false); }
    }
  };

  const capturarGeolocalizacao = () => {
    if (!navigator.geolocation) return setErroLocalizacao('GPS não suportado.');
    setCarregandoEndereco(true); setErroLocalizacao(null);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch(`/api/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const d = await r.json();
        if (d?.address) {
          setRua(d.address.road || d.address.pedestrian || ''); setBairro(d.address.suburb || '');
          setTimeout(() => document.getElementById('input-numero')?.focus(), 50);
        }
      } catch { setErroLocalizacao('Falha no mapa.'); }
      finally { setCarregandoEndereco(false); }
    }, () => setCarregandoEndereco(false), { enableHighAccuracy: true });
  };

  const onSubmitMercadoPago = async ({ formData }: any) => {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get('fbclid') || null;

    startTransition(async () => {
      try {
        const payload = {
          token: formData.token, issuer_id: formData.issuer_id, 
          payment_method_id: formData.payment_method_id, transaction_amount: formData.transaction_amount, 
          installments: formData.installments, payer: { email: email.trim(), nome, telefone }, slug,
          dadosCliente: { nome, telefone, tipoEntrega: abaAtiva, endereco: { rua, numero, bairro, cidade: 'Brasília', cep } },
          itens: itens.map(i => ({ item_cardapio_id: i.produto.id, quantidade: i.quantidade, preco_unitario: Number(i.produto.preco_venda) })),
          fb_click_id: fbclid
        };

        const resultado = await criarPedidoEMercadoPago(payload);
        if (resultado.success && resultado.pedidoId) {
          limparCarrinho();
          if (formData.payment_method_id === 'pix' && resultado.pixCopiaECola) {
            setDadosPix({ pedidoId: resultado.pedidoId, copiaECola: resultado.pixCopiaECola, qrCodeBase64: resultado.pixQrCodeBase64 || '' });
          } else {
            onFechar(); window.location.href = `/status-pedido?id=${resultado.pedidoId}`;
          }
        } else { setErroLocalizacao(`❌ Erro: ${resultado.error || 'Falha no pagamento.'}`); }
      } catch { setErroLocalizacao('❌ Falha na conexão transacional.'); }
    });
  };

  const corBotaoPrimario = ehAcai ? 'bg-[#3B0D2C] hover:bg-[#2C0A25]' : 'bg-[#E16349] hover:bg-[#c8523a]';
  const corTextoDestaque = ehAcai ? 'text-[#3B0D2C]' : 'text-[#E16349]';
  const formularioPreenchidoCompleto = nome.length > 2 && telefone.length > 7 && email.includes('@') && rua.length > 2;

  return createPortal(
    <div className="fixed inset-0 bg-zinc-950/30 backdrop-blur-md flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[28px] shadow-2xl border border-zinc-100 overflow-hidden max-h-[95vh] flex flex-col">
        <div className="p-5 border-b border-[#F3F3F3] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold tracking-tight text-[#1A1A1A]">Finalizar Pedido</h2>
            <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">AceleraFood Checkout</p>
          </div>
          <button type="button" onClick={onFechar} className="w-6 h-6 bg-[#F3F3F3] rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500">✕</button>
        </div>

        {dadosPix ? (
          <VisualizacaoPix pedidoId={dadosPix.pedidoId} copiaECola={dadosPix.copiaECola} qrCodeBase64={dadosPix.qrCodeBase64} onFechar={onFechar} corBotaoPrimario={corBotaoPrimario} />
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col py-4">
            <div className="space-y-4">
              <AbasCheckout abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} corTextoDestaque={corTextoDestaque} />
              
              <FormularioDadosPessoais nome={nome} setNome={setNome} telefone={telefone} setTelefone={setTelefone} email={email} setEmail={setEmail} />

              <div className="px-5 space-y-2">
                {carregandoEndereco && <div className="text-[11px] text-zinc-500 font-semibold bg-zinc-50 border p-2.5 rounded-[14px] animate-pulse">Processando geolocalização...</div>}
                {erroLocalizacao && <div className="text-[11px] text-red-600 font-semibold bg-red-50 border p-2.5 rounded-[14px]">{erroLocalizacao}</div>}
              </div>

              <FormularioEnderecoEntrega 
                abaAtiva={abaAtiva} cep={cep} lidarComMudancaCep={lidarComMudancaCep} capturarGeolocalizacao={capturarGeolocalizacao}
                rua={rua} setRua={setRua} numero={numero} setNumero={setNumero} bairro={bairro} setBairro={setBairro} enderecoRestaurante={enderecoRestaurante}
              />
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-[#F8F8F8] border border-zinc-100 rounded-[18px] p-3.5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total</span>
                <span className="font-black text-sm text-zinc-900">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal)}</span>
              </div>

              {formularioPreenchidoCompleto ? (
                <ProvedorMercadoPago key={`${email}-${valorTotal}`} valorTotal={valorTotal} email={email} nome={nome} isPending={isPending} onSubmitMercadoPago={onSubmitMercadoPago} />
              ) : (
                <div className="text-center p-4 border border-dashed rounded-2xl text-[11px] text-zinc-400 font-medium">
                  Preencha os dados obrigatórios para liberar o pagamento seguro.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
