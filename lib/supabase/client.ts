import { createBrowserClient } from '@supabase/ssr'

/** Klien pelayar — hanya guna anon key; keselamatan dikuatkuasakan oleh RLS. */
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
