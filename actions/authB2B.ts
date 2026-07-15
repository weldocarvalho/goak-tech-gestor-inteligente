// actions/authB2B.ts
'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

// Inicializa o cliente Admin bypassando políticas RLS para gerar o token
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

interface RespostaAutenticacao {
  sucesso: boolean;
  erro?: string;
}

/**
 * Realiza o login automático e seguro do cliente corporativo B2B pós-pagamento
 * gerando e injetando os cookies de sessão oficiais do Supabase diretamente no Next.js.
 */
export async function autenticarSessaoSilenciosa(emailCorporativo: string): Promise<RespostaAutenticacao> {
  if (!emailCorporativo) {
    return { sucesso: false, erro: 'E-mail corporativo obrigatório para autenticação.' };
  }

  try {
    // 1. Gera o link e captura as propriedades brutas do hash gerado pelo Supabase Auth Engine
    const { data, error: errorLink } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: emailCorporativo,
    });

    if (errorLink || !data?.properties?.hashed_token) {
      console.error('🚨 Erro ao gerar link de autenticação B2B:', errorLink);
      return { sucesso: false, erro: 'Não foi possível gerar os tokens de acesso.' };
    }

    // Captura o hash seguro gerado
    const hashSeguroStripe = data.properties.hashed_token;

    // 2. Inicializa o cliente do Next.js responsável por injetar cookies legítimos
    const supabaseServer = await createServerClient();

    // 3. Validação sênior do hash: usamos obrigatoriamente token_hash e type: 'email'
    // Isso evita o erro 'otp_expired' e força a gravação imediata dos cookies na resposta HTTP do Next.js
    const { error: errorSessao } = await supabaseServer.auth.verifyOtp({
      token_hash: hashSeguroStripe,
      type: 'email'
    });

    if (errorSessao) {
      console.error('🚨 Erro ao consolidar sessão no servidor Next.js:', errorSessao);
      return { sucesso: false, erro: 'O token de autenticação automática expirou ou é inválido.' };
    }

    console.log(`🚀 Cookies de sessão injetados com sucesso via OTP para: ${emailCorporativo}`);
    return { sucesso: true };

  } catch (error) {
    console.error('🚨 Erro crítico na Server Action de autenticação silenciosa:', error);
    return { sucesso: false, erro: 'Erro interno no servidor de autenticação.' };
  }
}
