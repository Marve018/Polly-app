import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          // Only set cookies in Server Actions or Route Handlers
          // For regular page components, we'll just read cookies
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Silently ignore cookie setting errors in non-Server Action contexts
            console.warn('Cannot set cookie in this context:', error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Silently ignore cookie removal errors in non-Server Action contexts
            console.warn('Cannot remove cookie in this context:', error)
          }
        },
      },
    }
  )
}
