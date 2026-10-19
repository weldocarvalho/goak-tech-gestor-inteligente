# Plano de implementação — fork do WCS Gestor Inteligente para ecommerce de eletrônicos

Loja única. Objetivo: sair do domínio "restaurante/delivery" para "venda de notebooks e celulares", reaproveitando a infraestrutura (auth, checkout, webhooks, admin, métricas) e substituindo o que é específico de restaurante.

## Princípio geral

Como é loja única, a primeira decisão estrutural é **remover a camada multi-tenant** (`restaurante_id`, assinatura SaaS da plataforma, onboarding de outros lojistas). Isso simplifica todo o resto: menos joins, menos RLS condicional, menos telas de configuração de "outra loja".

## Fase 0 — Preparação (0,5 dia)

- Criar branch `fork/eletronicos` a partir da main atual.
- Rodar `npm run build` e a suíte `test:hml:*` para ter uma baseline verde antes de começar a quebrar coisas.
- Fazer backup/export do schema atual do Supabase (`tables.json` já documenta a estrutura — usar como referência do que existe hoje).

## Fase 1 — Simplificar para loja única (1-2 dias)

- Remover o fluxo de `/assinar`, `/assinar/sucesso`, `POST /api/assinaturas/checkout` e o webhook `stripe-assinaturas` (isso é venda da plataforma para outros lojistas, não se aplica).
- Remover `sql-assinaturas-plataforma.sql` do pipeline de setup.
- Decidir: manter `restaurante_id` como "loja_id" fixo (mais simples de migrar, menos risco) ou eliminar a coluna de todas as tabelas (mais limpo, mais trabalho). Recomendo manter a coluna renomeada — reduz o raio de mudança em queries e RLS já escritas.
- Renomear `restaurantes` → `loja` (ou manter o nome e só trocar labels na UI) e ajustar `utils/branding.ts`.

## Fase 2 — Novo modelo de dados de produto (2-4 dias, é o núcleo do trabalho)

O modelo atual (`produtos` + `ficha_tecnica` + `insumos` + CMV por receita) é de comida. Para eletrônicos, substituir por:

- `produtos` (nível "modelo"): nome, marca, categoria (notebook/celular), descrição, specs fixas (processador, RAM, tela).
- `variacoes_produto`: SKU, cor, capacidade de armazenamento, preço, preço de custo (para margem), peso/dimensões (necessário para frete).
- `estoque`: quantidade por variação/SKU, e opcionalmente rastreio de série/IMEI por unidade (importante em eletrônico para garantia e antifurto).
- `garantia`: prazo padrão do fabricante + política da loja.

O que fica: a estrutura de listagem/filtro de `components/ecommerce` e o padrão de actions server-side (`actions/cardapio.ts` vira `actions/produtos.ts` com a lógica adaptada).
O que sai: `adminInsumos.ts`, a lógica de CMV por ficha técnica, `components/insumos-admin`, `components/cardapio-admin` (nome e conteúdo mudam).

## Fase 3 — Remover módulos que não existem em ecommerce de eletrônicos (1 dia)

- `app/(dashboard)/admin/cozinha`, `components/cozinha`, rotas de preparo de pedido — remover.
- `app/api/entregadores`, `app/(dashboard)/admin/entregadores`, `components/entregadores` — remover a lógica de motoboy/token de entrega. Isso é substituído na Fase 6 por rastreio de transportadora.
- `app/entrega/[token]` — remover ou reaproveitar a estrutura de "página pública de rastreio" para o rastreio de encomenda (ver Fase 6).

## Fase 4 — Vitrine e checkout (2-3 dias)

- Adaptar `components/ecommerce/lojas` e `components/ecommerce/temas` para exibir produto com variação (seletor de cor/armazenamento) em vez de complementos de lanche.
- Manter a arquitetura de `actions/checkout.ts` e `app/[slug]/checkout` (o padrão de validação server-side dos totais está correto e é justamente o que um ecommerce de ticket mais alto precisa).
- Adicionar: cálculo de parcelamento no cartão (comum em eletrônicos — 10x/12x), e campo de CPF/CNPJ do comprador (obrigatório para emissão de nota fiscal).

## Fase 5 — Frete real (2-3 dias)

- Integrar API de frete (Melhor Envio é o caminho mais simples para começar; Correios direto é mais burocrático). Calcular frete por CEP + peso/dimensões da variação no checkout.
- Ao aprovar pagamento, gerar etiqueta de envio e código de rastreio.
- Reaproveitar o padrão de "página pública de acompanhamento" (`app/[slug]/acompanhar`) trocando status de "em preparo/saiu para entrega" por status de transportadora (postado, em trânsito, entregue) via webhook/consulta da transportadora.

## Fase 6 — Nota fiscal eletrônica (1-2 dias de integração + homologação com a Sefaz, que costuma levar mais tempo do que o código em si)

- Integrar um emissor (Focus NFe, PlugNotas ou eNotas — os três têm API REST simples).
- Disparar emissão automaticamente no webhook de pagamento aprovado (mesmo ponto onde hoje `app/api/webhooks/pagamentos` já registra o pedido).
- Guardar o PDF/XML da nota vinculado ao pedido e disponibilizar para o cliente na tela de acompanhamento.
- **Atenção**: homologação de NF-e com certificado digital A1 da empresa é pré-requisito e não depende de código — resolver isso em paralelo, cedo, porque costuma ser o item que mais atrasa o lançamento.

## Fase 7 — Pagamento e antifraude (1-2 dias)

- Manter Stripe e/ou Mercado Pago (Mercado Pago já resolve Pix nativamente, o que é relevante no Brasil).
- Eletrônico é categoria de alto valor e alto risco de fraude/estorno — habilitar o antifraude nativo do gateway escolhido (Mercado Pago e Stripe Radar têm isso incluso) antes de ir ao ar. Não é opcional nesse nicho.

## Fase 8 — Painel do gestor / métricas (1-2 dias)

- Manter `actions/adminMetricas.ts`, `metricasFunil.ts`, `adminMetricasMetaAds.ts`, `adminPixelFacebook.ts` praticamente como estão — é a parte mais genérica e mais valiosa do projeto, não é específica de restaurante.
- Trocar apenas a fonte do custo unitário: hoje vem do CMV de ficha técnica, passa a vir do preço de custo da variação/SKU (Fase 2). O cálculo de margem líquida (receita − custo do produto − custo de anúncio) continua igual conceitualmente.

## Fase 9 — Homologação automatizada (contínuo, junto com cada fase)

- Adaptar os testes existentes: `bloco3-vitrine-carrinho`, `bloco4-checkout`, `bloco5-webhook-pagamento` para o novo domínio de produto.
- Remover `bloco6-cozinha`.
- Adicionar blocos novos: estoque/variação, cálculo de frete, emissão de NF-e (pelo menos o contrato defensivo, como já é feito hoje para o webhook de pagamento).

## Fase 10 — Deploy e pós-lançamento

- Rodar `npm run lint && npm run build` limpos antes de qualquer deploy (já é a prática do projeto).
- Lançar com um catálogo pequeno (poucos SKUs) para validar frete + NF-e + pagamento ponta a ponta antes de escalar o catálogo.

## Estimativa geral

Somando as fases de código: aproximadamente 3 a 4 semanas de um desenvolvedor trabalhando sozinho, sem contar o tempo de homologação de certificado digital/NF-e junto à Sefaz (esse costuma ser o gargalo de calendário, não de esforço técnico).

## Ordem recomendada se quiser lançar mais rápido com escopo reduzido

1. Fase 0, 1, 2, 3 (base + modelo de produto)
2. Fase 4 (vitrine/checkout)
3. Fase 6 (NF-e) e Fase 7 (antifraude) — **não pular**, são obrigação legal e risco financeiro real
4. Fase 5 (frete) — pode começar manual (frete fixo ou tabela simples) e evoluir para API depois
5. Fase 8 (métricas) — pode vir depois do MVP, não bloqueia vender
