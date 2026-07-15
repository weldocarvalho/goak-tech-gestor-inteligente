// app/(dashboard)/admin/onboarding/components/PassoFichaTecnica.tsx
'use client';

interface PassoFichaProps {
  nomeInsumo: string;
  custoUnitario: string;
  quantidadeNecessaria: string;
  precoVendaPai: number;
  onChange: (dados: { nome: string; custoUnitario: string; quantidadeNecessaria: string }) => void;
}

export default function PassoFichaTecnica({ nomeInsumo, custoUnitario, quantidadeNecessaria, precoVendaPai, onChange }: PassoFichaProps) {
  const custoInsumo = Number(custoUnitario) * Number(quantidadeNecessaria);
  const cmvProjetado = precoVendaPai > 0 ? (custoInsumo / precoVendaPai) * 100 : 0;
  const margemLucro = precoVendaPai - custoInsumo;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-bold text-gray-900 tracking-tight">Ficha Técnica e Alerta de Margem</h4>
        <p className="text-xs text-gray-500">Cadastre o principal insumo de custo deste produto.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Insumo Base</label>
          <input 
            type="text" 
            required
            placeholder="Ex: Carne de Sol 150g"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
            value={nomeInsumo}
            onChange={(e) => onChange({ nome: e.target.value, custoUnitario, quantidadeNecessaria })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Custo Insumo (R$)</label>
          <input 
            type="number" 
            required
            placeholder="4.50"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
            value={custoUnitario}
            onChange={(e) => onChange({ nome: nomeInsumo, custoUnitario: e.target.value, quantidadeNecessaria })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Quantidade Usada</label>
          <input 
            type="number" 
            required
            placeholder="1"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
            value={quantidadeNecessaria}
            onChange={(e) => onChange({ nome: nomeInsumo, custoUnitario, quantidadeNecessaria: e.target.value })}
          />
        </div>
      </div>

      {nomeInsumo && custoUnitario && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 grid grid-cols-2 gap-4 mt-2">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">CMV Estimado</p>
            <p className={`text-xl font-black ${cmvProjetado > 40 ? 'text-[#E16349]' : 'text-emerald-600'}`}>
              {cmvProjetado.toFixed(1)}%
              {cmvProjetado > 40 && <span className="text-[10px] font-bold block text-[#E16349]">⚠️ Alerta: CMV ideal é abaixo de 40%</span>}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Lucro por Unidade</p>
            <p className="text-xl font-black text-gray-900">R$ {margemLucro > 0 ? margemLucro.toFixed(2) : '0.00'}</p>
          </div>
        </div>
      )}
    </div>
  );
}
