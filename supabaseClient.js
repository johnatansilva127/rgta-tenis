import { createClient } from '@supabase/supabase-js'

// As chaves "publishable/anon" do Supabase sao seguras para o front-end:
// o acesso aos dados e protegido por RLS no banco.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://gddolfuirfbydoehzzua.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BcevTStinQttWWwHL-Udbg_kBmq41De'

export const supabase = createClient(url, key)

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}
