// components/ecommerce/FormularioEnderecoEntrega.tsx
'use client';

import FormularioEndereco from './FormularioEndereco';
import AbaCep from './AbaCep';
import AbaGps from './AbaGps';
import AbaRetirada from './AbaRetirada';

interface EnderecoEntregaProps {
  abaAtiva: 'CEP' | 'GPS' | 'RETIRADA';
  cep: string;
  lidarComMudancaCep: (v: string) => void;
  capturarGeolocalizacao: () => void;
  rua: string;
  setRua: (v: string) => void;
  numero: string;
  setNumero: (v: string) => void;
  bairro: string;
  setBairro: (v: string) => void;
  enderecoRestaurante: string;
}

export default function FormularioEnderecoEntrega({
  abaAtiva, cep, lidarComMudancaCep, capturarGeolocalizacao,
  rua, setRua, numero, setNumero, bairro, setBairro, enderecoRestaurante
}: EnderecoEntregaProps) {
  return (
    <div className="px-5 space-y-4">
      {abaAtiva === 'CEP' && <AbaCep cep={cep} onChangeCep={lidarComMudancaCep} abaAtiva={abaAtiva} />}
      {abaAtiva === 'GPS' && <AbaGps onCapturar={capturarGeolocalizacao} />}
      
      {abaAtiva !== 'RETIRADA' && (
        <FormularioEndereco 
          rua={rua} setRua={setRua} 
          numero={numero} setNumero={setNumero} 
          bairro={bairro} setBairro={setBairro} 
        />
      )}
      
      {abaAtiva === 'RETIRADA' && <AbaRetirada endereco={enderecoRestaurante} />}
    </div>
  );
}
