// components/ecommerce/FormularioDadosPessoais.tsx
'use client';

interface DadosPessoaisProps {
  nome: string;
  setNome: (v: string) => void;
  telefone: string;
  setTelefone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
}

export default function FormularioDadosPessoais({
  nome, setNome, telefone, setTelefone, email, setEmail
}: DadosPessoaisProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 px-5">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Seu Nome</label>
          <input 
            type="text" 
            required 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            placeholder="Ex: João" 
            className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none text-zinc-800" 
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">WhatsApp</label>
          <input 
            type="tel" 
            required 
            value={telefone} 
            onChange={(e) => setTelefone(e.target.value)} 
            placeholder="(61) 99999-0000" 
            className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none text-zinc-800" 
          />
        </div>
      </div>

      <div className="px-5 space-y-1">
        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">E-mail do Titular</label>
        <input 
          type="email" 
          required 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          placeholder="exemplo@email.com" 
          className="w-full bg-[#F3F3F3]/60 border border-transparent rounded-[14px] px-3.5 py-2 text-xs font-medium focus:outline-none text-zinc-800" 
        />
      </div>
    </div>
  );
}
