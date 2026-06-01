import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
export const dynamic = 'force-dynamic'
export default async function TransactionsPage() {
  const supabase = createClient()
  const { data: txns } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center py-6 mb-8 border-b border-gray-800"><h1 className="text-2xl font-bold text-white">Transactions</h1><Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></header>
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full text-left"><thead className="bg-gray-800 text-gray-400"><tr><th className="p-4">Type</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></tr></thead>
        <tbody className="divide-y divide-gray-800">{txns?.map((t: any) => (<tr key={t.id}><td className="p-4 text-white">{t.type}</td><td className="p-4 text-white">৳{t.amount}</td><td className="p-4"><span className={t.status==='VERIFIED'?'text-green-400':'text-yellow-400'}>{t.status}</span></td><td className="p-4 text-sm text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td></tr>))}</tbody></table>
        {(!txns||txns.length===0) && <p className="text-gray-500 py-8 text-center">No transactions.</p>}
      </div>
    </div>
  )
}