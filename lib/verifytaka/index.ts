import { createHmac } from 'crypto'

export async function createCheckoutSession({ amount, merchant_order_id, user_id }: { amount: number; merchant_order_id: string; user_id: string }) {
  const res = await fetch('https://api.verifytaka.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'X-API-Key': process.env.VT_SECRET_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, merchant_order_id, success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/success`, cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/topup`, metadata: { user_id }, expires_in_seconds: 3600 })
  })
  return res.json()
}

export function verifyRedirectSignature(params: { txn_id: string; amount: string; merchant_order_id: string; session_id: string; timestamp: string; signature: string }): boolean {
  const canonical = [`amount=${params.amount}`, `merchant_order_id=${params.merchant_order_id}`, `session_id=${params.session_id}`, `timestamp=${params.timestamp}`, `txn_id=${params.txn_id}`].join('&')
  const expected = createHmac('sha256', process.env.VT_WEBHOOK_SECRET!).update(canonical).digest('hex')
  return expected === params.signature
}