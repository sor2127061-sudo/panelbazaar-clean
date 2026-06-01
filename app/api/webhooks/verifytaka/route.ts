import { createHmac } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-verifytaka-signature')
  if (!signature) return Response.json({ error: 'No signature' }, { status: 400 })
  const expected = createHmac('sha256', process.env.VT_WEBHOOK_SECRET!).update(rawBody).digest('hex')
  if (expected !== signature) return Response.json({ error: 'Invalid signature' }, { status: 400 })
  const payload = JSON.parse(rawBody)
  if (payload.event === 'payment.verified') {
    const { merchant_order_id, amount, txn_id, mfs_type, metadata } = payload
    if (!metadata?.user_id) return Response.json({ error: 'No user_id' }, { status: 400 })
    const supabase = createAdminClient()
    await supabase.rpc('credit_wallet', { p_user_id: metadata.user_id, p_amount: amount, p_merchant_order_id: merchant_order_id, p_vt_txn_id: txn_id, p_mfs_type: mfs_type.toUpperCase(), p_webhook_raw: payload })
  }
  return Response.json({ received: true }, { status: 200 })
}