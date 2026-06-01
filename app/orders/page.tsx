import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
export const dynamic = 'force-dynamic'
export default async function OrdersPage() {
  const supabase = createClient()
  const { data: orders } = await supabase.from('orders').select('*, products(name), product_packages(duration_days)').order('created_at', { ascending: false })
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center py-6 mb-8 border-b border-gray-800"><h1 className="text-2xl font-bold text-white">My Orders</h1><Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></header>
      <div className="space-y-4">
        {orders?.map((o: any) => (<div key={o.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg flex justify-between items-center"><div><h3 className="font-medium text-lg text-white">{o.products?.name}</h3><p className="text-gray-400 text-sm">{o.product_packages?.duration_days}d | ৳{o.amount_paid}</p></div><div className="text-right"><span className={`px-3 py-1 rounded text-sm ${o.status==='COMPLETED'?'bg-green-900/30 text-green-400':o.status==='PENDING'?'bg-yellow-900/30 text-yellow-400':'bg-red-900/30 text-red-400'}`}>{o.status}</span></div></div>))}
        {(!orders||orders.length===0) && <p className="text-gray-500 py-8 text-center">No orders.</p>}
      </div>
    </div>
  )
}