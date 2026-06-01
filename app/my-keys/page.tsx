import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
export const dynamic = 'force-dynamic'
export default async function MyKeysPage() {
  const supabase = createClient()
  const { data: keys } = await supabase.from('license_keys').select('*, products(name)').order('created_at', { ascending: false })
  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="flex justify-between items-center py-6 mb-8 border-b border-gray-800"><h1 className="text-2xl font-bold text-white">My Keys</h1><Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link></header>
      <div className="space-y-4">
        {keys?.map((k: any) => (<div key={k.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg"><h3 className="font-medium text-lg mb-2 text-white">{k.products?.name}</h3>{k.key_value && <p className="font-mono bg-black p-2 rounded text-[#0070f3]">{k.key_value}</p>}{k.login_user && <div className="space-y-1"><p className="text-gray-300">User: <span className="font-mono text-[#0070f3]">{k.login_user}</span></p><p className="text-gray-300">Pass: <span className="font-mono text-[#0070f3]">{k.login_pass}</span></p></div>}{k.service_content && <div className="mt-2 text-gray-300" dangerouslySetInnerHTML={{__html:k.service_content}}/>}{k.expires_at && <p className="text-xs text-gray-500 mt-4">Expires: {new Date(k.expires_at).toLocaleDateString()}</p>}</div>))}
        {(!keys||keys.length===0) && <p className="text-gray-500 py-8 text-center">No keys.</p>}
      </div>
    </div>
  )
}