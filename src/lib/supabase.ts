import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Student simulator — anon, subject to RLS
export const supabase = createClient(url, anonKey)

// Admin panel — service role, bypasses RLS, no browser auth storage
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  }
})