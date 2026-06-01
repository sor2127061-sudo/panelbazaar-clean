import { createClient } from '@/lib/supabase/server'
export const dynamic = 'force-dynamic'
export default async function AdminSettings() {
  const supabase = createClient(); const{data:settings}=await supabase.from('site_settings').select('*').order('key')
  async function save(fd: FormData) { 'use server'; const s=createClient(); for(const[k,v] of fd.entries()) await s.from('site_settings').update({value:v.toString()}).eq('key',k) }
  return (<div className="max-w-2xl"><h1 className="text-3xl font-bold mb-8 text-white">Settings</h1><form action={save} className="bg-gray-900 p-6 rounded-lg border border-gray-800 space-y-6">{settings?.map((s: any)=>(<div key={s.key}><label className="block mb-2 text-sm text-gray-400 font-mono">{s.key}</label>{s.key==='site_notice'?<textarea name={s.key} defaultValue={s.value} rows={4} className="w-full p-2 bg-gray-800 rounded border border-gray-700 font-mono text-white"/>:<input name={s.key} defaultValue={s.value} className="w-full p-2 bg-gray-800 rounded border border-gray-700 font-mono text-white"/>}</div>))}<button type="submit" className="px-6 py-2 bg-[#0070f3] text-white rounded">Save</button></form></div>)
}