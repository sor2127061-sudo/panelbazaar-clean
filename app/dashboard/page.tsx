import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center py-6 mb-8 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <form action={async () => { 'use server'; const s = createClient(); await s.auth.signOut(); redirect('/login') }}><button className="text-gray-400 hover:text-white">Sign Out</button></form>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="text-gray-400 mb-2">Wallet Balance</h3>
          <p className="text-4xl font-bold text-[#0070f3]">৳ {profile?.wallet_balance || 0}</p>
          <Link href="/wallet/topup" className="inline-block mt-4 px-6 py-2 bg-[#0070f3] text-white rounded hover:bg-blue-600">Add Money</Link>
        </div>
        <div className="p-6 bg-gray-900 border border-gray-800 rounded-lg">
          <h3 className="text-gray-400 mb-2">Total Spent</h3>
          <p className="text-4xl font-bold text-white">৳ {profile?.total_spent || 0}</p>
          <div className="mt-4 space-x-4"><Link href="/orders" className="text-[#0070f3]">Orders</Link><Link href="/my-keys" className="text-[#0070f3]">Keys</Link><Link href="/transactions" className="text-[#0070f3]">History</Link></div>
        </div>
      </div>
    </div>
  )
}