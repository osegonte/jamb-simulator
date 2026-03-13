import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

if (!url)        console.error('[supabase] VITE_SUPABASE_URL is missing')
if (!anonKey)    console.error('[supabase] VITE_SUPABASE_ANON_KEY is missing')
if (!serviceKey) console.error('[supabase] VITE_SUPABASE_SERVICE_KEY is missing — admin writes will fail')

// Student simulator — anon, subject to RLS
export const supabase = createClient(url, anonKey)

// Admin panel — service role, bypasses RLS, no browser auth storage
export const supabaseAdmin = createClient(url, serviceKey ?? anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
})