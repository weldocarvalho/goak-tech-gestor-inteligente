// components/ecommerce/VisualizacaoPix.tsx
'use client';

import React, { useState } from 'react';

interface PixProps {
  pedidoId: string;
  copiaECola: string;
  qrCodeBase64: string;
  onFechar: () => void;
  corBotaoPrimario: string;
}

export default function VisualizacaoPix({ pedidoId, copiaECola, qrCodeBase64, onFechar, corBotaoPrimario }: PixProps) {
  const [copiado, setCopiado] = useState(false);

  const copiarChavePix = () => {
    navigator.clipboard.writeText(copiaECola);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div className="p-6 text-center space-y-4 overflow-y-auto">
      <h3 className="text-lg font-bold text-zinc-800">Pedido Gerado com Sucesso!</h3>
      <p className="text-xs text-zinc-500">Pague o Pix abaixo para enviar o pedido diretamente para a cozinha.</p>
      
      {qrCodeBase64 && (
        <div className="flex justify-center p-3 bg-zinc-50 border rounded-2xl max-w-[180px] mx-auto">
          <img src={`data:image/jpeg;base64,${qrCodeBase64}`} alt="QR Code Pix" className="w-full h-auto" />
        </div>
      )}

      <div className="space-y-1.5 text-left">
        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Código Copia e Cola</label>
        <div className="flex gap-2">
          <input type="text" readOnly value={copiaECola} className="w-full bg-[#F3F3F3] border rounded-xl px-3 py-2 text-[11px] font-medium text-zinc-600 focus:outline-none" />
          <button type="button" onClick={copiarChavePix} className="px-3 bg-zinc-900 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition-colors whitespace-nowrap">
            {copiado ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <button type="button" onClick={() => { onFechar(); window.location.href = `/status-pedido?id=${pedidoId}`; }} className={`w-full py-3 text-white font-black text-xs rounded-[14px] shadow-sm transition-all ${corBotaoPrimario}`}>
        Acompanhar Pedido em Tempo Real ➔
      </button>
    </div>
  );
}
