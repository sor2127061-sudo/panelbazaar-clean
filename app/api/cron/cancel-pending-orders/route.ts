import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('cancel_expired_pending_orders')
  if (error) return Response.json({ error }, { status: 500 })
  return Response.json({ cancelled: data })
}