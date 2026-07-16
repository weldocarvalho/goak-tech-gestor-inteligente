# WCS Gestor Inteligente

Aplicação de gestão e vendas para restaurantes, construída com Next.js, React e Supabase.

## Requisitos

- Node.js 20+
- npm 10+

## Variáveis de ambiente

Configure as variáveis abaixo no `.env.local`:

```bash
NEXT_PUBLIC_APP_NAME="WCS Gestor Inteligente"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
WCS_GESTOR_INTELIGENTE_CARDAPIO_BUCKET="seu_bucket_aqui"
MERCADO_PAGO_CLIENT_ID=""
MERCADO_PAGO_CLIENT_SECRET=""
MERCADO_PAGO_REDIRECT_URI=""
MERCADO_PAGO_STATE_SECRET=""
MERCADO_PAGO_ENV="production"
MERCADO_PAGO_TEST_ACCESS_TOKEN=""
MERCADO_PAGO_TEST_CLIENT_ID=""
MERCADO_PAGO_TEST_CLIENT_SECRET=""
MERCADO_PAGO_TEST_BUYER_EMAIL=""
HML_TEST_EMAIL="teste@restaurante.com"
HML_TEST_PASSWORD="1234"
HML_APP_PORT="4100"
HML_TEST_SLUG=""
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

## Qualidade e validação

```bash
npm run lint
npm run build
```

Esses dois comandos devem estar verdes antes de publicar em produção.

## Mercado Pago - produção e testes

- `MERCADO_PAGO_ENV="production"`: usa integração OAuth da conta conectada do estabelecimento.
- `MERCADO_PAGO_ENV="sandbox"` + `MERCADO_PAGO_TEST_ACCESS_TOKEN`: usa credenciais de teste do Mercado Pago para checkout/webhook sem mexer em produção.

Fluxo recomendado para suíte de testes do Mercado Pago:
1. Criar usuário **vendedor de teste** no painel Developers e copiar `access_token` para `MERCADO_PAGO_TEST_ACCESS_TOKEN`.
2. Criar usuário **comprador de teste** no painel Developers e copiar o email dele para `MERCADO_PAGO_TEST_BUYER_EMAIL`.
3. Definir `MERCADO_PAGO_ENV="sandbox"`.
4. Gerar PIX/cartão no checkout e validar a persistência pelo webhook.
5. Ao finalizar testes, voltar `MERCADO_PAGO_ENV="production"`.

## Homologação automatizada (Bloco 1)

```bash
npm run build
npm run test:hml:bloco1
```

O teste valida: proteção de rota sem sessão, login válido, acesso autenticado ao admin e logout com bloqueio novamente.

## Homologação automatizada (Bloco 2)

```bash
npm run build
npm run test:hml:bloco2
```

O teste valida: proteção das rotas `/admin/produtos`, `/admin/insumos` e `/admin/metricas` sem sessão, e acesso autenticado às três páginas com marcadores de renderização.

## Homologação automatizada (Bloco 3)

```bash
npm run build
npm run test:hml:bloco3
```

O teste valida: carregamento da vitrine pública por slug e renderização do checkout com carrinho vazio (estado inicial).

## Homologação automatizada (Bloco 4)

```bash
npm run build
npm run test:hml:bloco4
```

O teste valida: carregamento da tela de checkout por slug e regras defensivas da API de checkout para métodos/payloads inválidos.

## Homologação automatizada (Bloco 5)

```bash
npm run build
npm run test:hml:bloco5
```

O teste valida: contrato defensivo do webhook de pagamentos para método inválido, ausência de assinatura e assinatura inválida.

## Homologação automatizada (Bloco 6)

```bash
npm run build
npm run test:hml:bloco6
```

O teste valida: proteção da rota `/admin/cozinha` sem sessão e renderização dos principais marcadores operacionais com sessão autenticada.

## Iteração com banco (etapa inicial)

```bash
npm run test:hml:db-contexto
```

O teste valida: autenticação do gestor, resolução de `restaurante_id` em `perfis_admin` e vínculo consistente na tabela `restaurantes`.

## Iteração com banco (etapa 1 — insumos)

```bash
npm run test:hml:db-etapa1-insumos
```

O teste valida: criação, atualização e exclusão de insumo por actions (`adminInsumos`) com verificação de persistência no banco e cleanup do dado de teste.

## Iteração com banco (etapa 2 — produto + ficha técnica + complementos)

```bash
npm run test:hml:db-etapa2-produto-complementos
```

O teste valida: criação de produto com ficha técnica e complementos obrigatórios, persistência em produto/composição/complementos, alternância de disponibilidade e cleanup completo dos dados de teste.

## Iteração com banco (etapa 3 — leituras gerenciais)

```bash
npm run test:hml:db-etapa3-leituras
```

O teste valida: leitura de insumos e leitura de produtos com CMV calculado (`listarProdutosComCMV`) com consistência de custo/percentual/margem e cleanup dos dados de teste.

## Decisões técnicas importantes

- Branding centralizado em `utils/branding.ts` com fallback para `WCS Gestor Inteligente`.
- Proteção de rotas no ponto de entrada `proxy.ts` (convenção do Next.js 16), reutilizando `updateSession` em `utils/supabase/middleware.ts`.
- Fluxos críticos (checkout/webhook) com validação server-side e sem confiança em totais enviados pelo cliente.

## Stack principal

- Next.js 16
- React 19
- TypeScript
- Supabase
- Mercado Pago
