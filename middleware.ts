import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) { return request.cookies.get(name)?.value },
      set(name: string, value: string, options: CookieOptions) { request.cookies.set({ name, value, ...options }); response = NextResponse.next({ request: { headers: request.headers } }); response.cookies.set({ name, value, ...options }) },
      remove(name: string, options: CookieOptions) { request.cookies.set({ name, value: '', ...options }); response = NextResponse.next({ request: { headers: request.headers } }); response.cookies.set({ name, value: '', ...options }) },
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isPublic = ['/', '/login', '/register', '/banned'].includes(path) || path.startsWith('/product/')
  const isAuthPage = ['/login', '/register'].includes(path)
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_banned, is_admin').eq('id', user.id).single()
    if (profile?.is_banned && path !== '/banned') return NextResponse.redirect(new URL('/banned', request.url))
    if (isAuthPage) return NextResponse.redirect(new URL('/dashboard', request.url))
    if (path.startsWith('/admin') && !profile?.is_admin) return NextResponse.redirect(new URL('/dashboard', request.url))
  } else if (!isPublic && !path.startsWith('/api/') && !path.startsWith('/_next/')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] }