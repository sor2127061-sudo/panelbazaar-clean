import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export default async function AdminPage() {
  const supabase = createClient()
  const [{ count: uc }, { count: oc }, { data: rev }] = await Promise.all([supabase.from('profiles').select('*',{count:'exact',head:true}), supabase.from('orders').select('*',{count:'exact',head:true}), supabase.from('orders').select('amount_paid').eq('status','COMPLETED')])
  const tr = rev?.reduce((s: number,o: any) => s+Number(o.amount_paid),0)||0
  return (
    <div className="min-h-screen flex"><aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-4"><h2 className="text-xl font-bold text-[#0070f3] mb-8">Admin</h2><Link href="/admin" className="text-white font-medium">Overview</Link><Link href="/admin/products" className="text-gray-300 hover:text-white">Products</Link><Link href="/admin/keys" className="text-gray-300 hover:text-white">Keys</Link><Link href="/admin/orders" className="text-gray-300 hover:text-white">Orders</Link><Link href="/admin/users" className="text-gray-300 hover:text-white">Users</Link><Link href="/admin/transactions" className="text-gray-300 hover:text-white">Transactions</Link><Link href="/admin/settings" className="text-gray-300 hover:text-white">Settings</Link><div className="mt-auto pt-8"><Link href="/dashboard" className="text-sm text-gray-500">&larr; App</Link></div></aside>
    <main className="flex-1 p-8"><h1 className="text-3xl font-bold mb-8 text-white">Overview</h1><div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="p-6 bg-gray-900 border border-gray-800 rounded-lg"><h3 className="text-gray-400 mb-2">Revenue</h3><p className="text-4xl font-bold text-green-400">৳{tr}</p></div><div className="p-6 bg-gray-900 border border-gray-800 rounded-lg"><h3 className="text-gray-400 mb-2">Orders</h3><p className="text-4xl font-bold text-white">{oc||0}</p></div><div className="p-6 bg-gray-900 border border-gray-800 rounded-lg"><h3 className="text-gray-400 mb-2">Users</h3><p className="text-4xl font-bold text-white">{uc||0}</p></div></div></main></div>
  )
}