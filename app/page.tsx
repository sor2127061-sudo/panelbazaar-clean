import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  let products: any[] = []
  try { const { data } = await supabase.from('products').select('*').eq('is_active', true).order('sort_order', { ascending: true }); products = data || [] } catch(e) { products = [] }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center py-6 mb-8 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-[#0070f3]">Panel Bazaar BD</h1>
        <div className="gap-4 flex">
          <Link href="/login" className="px-4 py-2 bg-gray-800 rounded hover:bg-gray-700 text-white">Login</Link>
          <Link href="/register" className="px-4 py-2 bg-[#0070f3] text-white rounded hover:bg-blue-600">Register</Link>
        </div>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p: any) => (
          <div key={p.id} className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
            <h2 className="text-xl font-semibold mb-2 text-white">{p.name}</h2>
            <div className="inline-block px-2 py-1 text-xs bg-gray-800 rounded mb-4 text-gray-300">{p.category}</div>
            <Link href={`/product/${p.id}`} className="block w-full text-center py-2 bg-gray-800 hover:bg-gray-700 rounded text-white">View Packages</Link>
          </div>
        ))}
        {products.length === 0 && <p className="col-span-full text-gray-500 text-center py-12">No products available yet.</p>}
      </div>
    </div>
  )
}