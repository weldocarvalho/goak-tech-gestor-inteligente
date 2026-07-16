import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import {
  baseUrl,
  carregarEnvLocal,
  esperarServidorPronto,
  iniciarServidor,
  pararServidor,
} from './helpers.mjs'

let servidor

before(async () => {
  carregarEnvLocal()
  servidor = iniciarServidor()
  await esperarServidorPronto(baseUrl)
})

after(async () => {
  await pararServidor(servidor)
})

test('bloco 5: webhook/pagamento com validações defensivas', async () => {
  const getWebhook = await fetch(`${baseUrl}/api/webhooks/pagamentos`, {
    method: 'GET',
    redirect: 'manual',
  })
  assert.equal(getWebhook.status, 405)

  const postSemAssinatura = await fetch(`${baseUrl}/api/webhooks/pagamentos`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  })

  const bodySemAssinatura = await postSemAssinatura.json()
  assert.equal(postSemAssinatura.status, 400)
  assert.equal(
    String(bodySemAssinatura.error || '').includes('identificador de pagamento'),
    true,
    'Webhook deve rejeitar notificação sem id do pagamento'
  )

  const postTipoIrrelevante = await fetch(`${baseUrl}/api/webhooks/pagamentos?restaurante_id=teste`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ type: 'ping', data: { id: '123' } }),
  })

  const bodyTipoIrrelevante = await postTipoIrrelevante.json()
  assert.equal(postTipoIrrelevante.status, 200)
  assert.equal(bodyTipoIrrelevante.received, true)
})
