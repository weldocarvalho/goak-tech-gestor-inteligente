// app/(dashboard)/admin/onboarding/components/PassoIdentidade.tsx
'use client';

interface PassoIdentidadeProps {
  tipoCozinha: string;
  slugCardapio: string;
  onChange: (dados: { tipoCozinha: string; slugCardapio: string }) => void;
}

export default function PassoIdentidade({ tipoCozinha, slugCardapio, onChange }: PassoIdentidadeProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-bold text-gray-900 tracking-tight">Identidade Operacional</h4>
        <p className="text-xs text-gray-500">Configure as chaves essenciais de categorização da sua cozinha.</p>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Segmento Principal</label>
          <select 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 font-medium focus:outline-none focus:border-[#E16349]"
            value={tipoCozinha}
            onChange={(e) => onChange({ tipoCozinha: e.target.value, slugCardapio })}
          >
            <option value="Hamburgueria">Hamburgueria</option>
            <option value="Pizzaria">Pizzaria</option>
            <option value="Japonesa">Cozinha Japonesa</option>
            <option value="Acai">Açaí & Sobremesas</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Slug do Endereço (URL)</label>
          <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-50 items-center px-3 focus-within:border-[#E16349] transition">
            <span className="text-xs text-gray-400 font-semibold select-none">wcs.delivery/</span>
            <input 
              type="text" 
              required
              placeholder="meu-restaurante"
              className="w-full bg-transparent border-0 px-1 py-2.5 text-sm text-gray-900 focus:outline-none font-medium"
              value={slugCardapio}
              onChange={(e) => onChange({ tipoCozinha, slugCardapio: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
