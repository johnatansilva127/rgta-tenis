import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Config ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.')
}

export const supabase = createClient(url, key)

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

export const CAT_RANK = { A: 3, B: 2, C: 1 }
export function compatible(c1, c2) { return Math.abs(CAT_RANK[c1] - CAT_RANK[c2]) <= 1 }

export const DEFAULT_SETTINGS = {
  win_same: 10, loss_same: 3, win_above: 15, win_below: 5,
  loss_extra: 2, super_bonus: 1, start_points: 0, rematch_days: 15,
}

export function calcPoints(cw, cl, wentSuper, s = DEFAULT_SETTINGS) {
  let wp, baseLoss
  if (cw === cl) { wp = s.win_same; baseLoss = s.loss_same }
  else { wp = CAT_RANK[cw] < CAT_RANK[cl] ? s.win_above : s.win_below; baseLoss = s.loss_extra }
  return { winner: wp, loser: baseLoss + (wentSuper ? s.super_bonus : 0) }
}

export const MATCH_SELECT =
  'id,set_scores,went_super,is_extra,winner_points,loser_points,status,played_at,created_by,winner_id,loser_id,winner:winner_id(name,category,avatar_url),loser:loser_id(name,category,avatar_url)'

export function matchView(m, myId) {
  const iWon = m.winner_id === myId
  return {
    id: m.id, result: iWon ? 'V' : 'D',
    opponent: iWon ? m.loser : m.winner,
    opponentId: iWon ? m.loser_id : m.winner_id,
    myPoints: iWon ? m.winner_points : m.loser_points,
    status: m.status, set_scores: m.set_scores, went_super: m.went_super,
    is_extra: m.is_extra, played_at: m.played_at, created_by: m.created_by,
  }
}

export function avatarFor(p) { return p?.avatar_url || null }

// Sobe foto para o storage e devolve a URL publica
export async function uploadAvatar(userId, file) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
