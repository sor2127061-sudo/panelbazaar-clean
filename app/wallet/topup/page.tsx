import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession } from '@/lib/verifytaka'
import { redirect } from 'next/navigation'
import crypto from 'crypto'

export default function TopupPage() {
  async function handleTopup(formData: FormData) {
    'use server'
    const amount = Number(formData.get('amount'))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    const merchant_order_id = `topup_${crypto.randomUUID()}`
    await supabase.from('transactions').insert({ user_id: user.id, type: 'TOPUP', amount, merchant_order_id, status: 'PENDING' })
    const session = await createCheckoutSession({ amount, merchant_order_id, user_id: user.id })
    if (session?.checkout_url) {
      await supabase.from('transactions').update({ vt_session_id: session.session_id, checkout_url: session.checkout_url }).eq('merchant_order_id', merchant_order_id)
      redirect(session.checkout_url)
    }
  }
  return (
    <div className="max-w-md mx-auto p-6 mt-12"><div className="p-8 bg-gray-900 border border-gray-800 rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-white">Top Up Wallet</h1>
      <form action={handleTopup} className="space-y-4">
        <div><label className="block text-gray-400 mb-2">Amount (৳)</label><input name="amount" type="number" min="10" required className="w-full p-3 rounded bg-gray-800 border border-gray-700 text-white" /></div>
        <button type="submit" className="w-full py-3 bg-[#0070f3] text-white rounded hover:bg-blue-600">Pay with bKash / Nagad</button>
      </form>
    </div></div>
  )
}