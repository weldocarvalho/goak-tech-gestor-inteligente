// app/(dashboard)/admin/onboarding/components/PassoProdutoCampeao.tsx
'use client';

interface PassoProdutoProps {
  nome: string;
  precoVenda: string;
  onChange: (dados: { nome: string; precoVenda: string }) => void;
}

export default function PassoProdutoCampeao({ nome, precoVenda, onChange }: PassoProdutoProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-base font-bold text-gray-900 tracking-tight">Cadastro do Produto Campeão</h4>
        <p className="text-xs text-gray-500">Insira o nome público do item e o valor praticado no cardápio atual.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Nome do Item</label>
          <input 
            type="text" 
            required
            placeholder="Ex: Burger Smash Duplo"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
            value={nome}
            onChange={(e) => onChange({ nome: e.target.value, precoVenda })}
          />
        </div>
        <div>
          <label className="block text-[10px] font-extrabold text-gray-500 uppercase mb-1">Preço de Venda (R$)</label>
          <input 
            type="number" 
            required
            placeholder="35.00"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-[#E16349] transition font-medium"
            value={precoVenda}
            onChange={(e) => onChange({ nome, precoVenda: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
