import { createClient } from '@supabase/supabase-js'

// As chaves "publishable/anon" do Supabase sao seguras para o front-end:
// o acesso aos dados e protegido por RLS no banco.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://gddolfuirfbydoehzzua.supabase.co'
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_BcevTStinQttWWwHL-Udbg_kBmq41De'

export const supabase = createClient(url, key)

export function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
}

// ---- Regras de pontuacao (espelham o banco) ----
export const CAT_RANK = { A: 3, B: 2, C: 1 }

export function compatible(c1, c2) {
  return Math.abs(CAT_RANK[c1] - CAT_RANK[c2]) <= 1
}

// Pontos do vencedor e do perdedor dado as categorias e super tiebreak.
export function calcPoints(cw, cl, wentSuper) {
  let wp, baseLoss
  if (cw === cl) { wp = 10; baseLoss = 3 }
  else { wp = CAT_RANK[cw] < CAT_RANK[cl] ? 15 : 5; baseLoss = 2 }
  return { winner: wp, loser: baseLoss + (wentSuper ? 1 : 0) }
}

// Visao de uma partida do ponto de vista de um jogador.
export function matchView(m, myId) {
  const iWon = m.winner_id === myId
  return {
    id: m.id,
    result: iWon ? 'V' : 'D',
    opponent: iWon ? m.loser : m.winner,
    myPoints: iWon ? m.winner_points : m.loser_points,
    status: m.status,
    set_scores: m.set_scores,
    went_super: m.went_super,
    is_extra: m.is_extra,
    played_at: m.played_at,
  }
}

export const MATCH_SELECT =
  'id,set_scores,went_super,is_extra,winner_points,loser_points,status,played_at,winner_id,loser_id,winner:winner_id(name,category),loser:loser_id(name,category)'
