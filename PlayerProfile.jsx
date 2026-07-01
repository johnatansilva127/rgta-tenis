import { useEffect, useState } from 'react'
import { supabase, matchView, MATCH_SELECT, compatible } from './supabaseClient'
import Avatar from './Avatar.jsx'
import Icon from './Icon.jsx'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function PlayerProfile({ session, profile, playerId, nav, tick }) {
  const [p, setP] = useState(null)
  const [matches, setMatches] = useState(null)
  const me = session.user.id
  const [challenging, setChallenging] = useState(false)
  async function challenge(pl) {
    const msg = prompt('Enviar desafio para ' + pl.name + '? (mensagem opcional)', '')
    if (msg === null) return
    setChallenging(true)
    const { error } = await supabase.rpc('create_challenge', { p_opponent: pl.id, p_message: msg || null })
    setChallenging(false)
    alert(error ? error.message : 'Desafio enviado! Ele vai receber um aviso.')
  }

  useEffect(() => {
    supabase.from('rankings').select('*').eq('id', playerId).single().then(({ data }) => setP(data))
    supabase.from('matches').select(MATCH_SELECT)
      .eq('status', 'approved').or(`winner_id.eq.${playerId},loser_id.eq.${playerId}`)
      .order('played_at', { ascending: false }).limit(60)
      .then(({ data }) => setMatches(data || []))
  }, [playerId, tick])

  if (!p) return (<><div className="topbar"><div className="row"><button className="ic" onClick={() => nav('ranking')} aria-label="Voltar"><Icon name="chevronLeft" size={22} /></button><h3>Perfil</h3><div style={{ width: 34 }} /></div></div><div className="center"><div className="spin" /></div></>)

  const theirView = (matches || []).map(m => matchView(m, playerId))
  const h2h = (matches || []).filter(m => m.winner_id === me || m.loser_id === me)
  const myWins = h2h.filter(m => m.winner_id === me).length
  const theirWins = h2h.filter(m => m.winner_id === playerId).length
  const isMe = playerId === me

  const total = p.wins + p.losses
  const winRate = total ? Math.round((p.wins / total) * 100) : 0
  const streak = currentStreak(theirView)
  const monthly = buildMonthly(theirView)

  return (
    <>
      <div className="topbar"><div className="row">
        <button className="ic" onClick={() => nav('ranking')} aria-label="Voltar"><Icon name="chevronLeft" size={22} /></button>
        <h3>Jogador</h3><div style={{ width: 34 }} />
      </div></div>
      <div className="scroll">
        <div className="prof-head">
          <Avatar name={p.name} url={p.avatar_url} size={84} style={{ border: '3px solid rgba(255,255,255,.55)' }} />
          <div className="nm">{p.name}</div>
          <div className="cat">Categoria {p.category} · {p.position}º no ranking</div>
        </div>
        <div className="stat-card">
          <div className="stat-grid">
            <div><div className="k">Pontos</div><div className="v">{p.points}</div></div>
            <div><div className="k">Vitórias / Derrotas</div><div className="v">{p.wins} / {p.losses}</div></div>
            <div><div className="k">Melhor ranking</div><div className="v">{p.best_rank ? p.best_rank + 'º' : '—'}</div></div>
            <div><div className="k">Aproveitamento</div><div className="v up">{winRate}%</div></div>
            <div><div className="k">Sequência atual</div><div className="v">{streak > 0 ? <>{streak}<Icon name="flame" size={15} /></> : '—'}</div></div>
            <div><div className="k">Total de jogos</div><div className="v">{total}</div></div>
          </div>
          <Bars data={monthly} />
        </div>
        {!isMe && (
          <div className="stat-card" style={{ textAlign: 'center' }}>
            <div className="k">Retrospecto direto (você x {p.name.split(' ')[0]})</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>
              <span style={{ color: 'var(--up)' }}>{myWins}</span> — <span style={{ color: 'var(--down)' }}>{theirWins}</span>
            </div>
            <div className="k">{h2h.length} {h2h.length === 1 ? 'confronto' : 'confrontos'}</div>
          </div>
        )}
        {!isMe && compatible(profile?.category, p.category) && (
          <div className="sec" style={{ paddingBottom: 0 }}>
            <button className="cta" disabled={challenging} onClick={() => challenge(p)}><Icon name="swords" size={18} /> Desafiar {p.name.split(' ')[0]}</button>
          </div>
        )}
        <div className="sec"><h4>Partidas recentes</h4>
          {matches === null && <div className="center"><div className="spin" /></div>}
          {matches && matches.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nenhuma partida válida ainda.</div>}
          {theirView.map(m => (
            <div className="hist-row" key={m.id}>
              <div className={'res ' + (m.result === 'V' ? 'w' : 'l')}>{m.result}</div>
              <div><div className="nm">vs. {m.opponent?.name}{m.is_extra ? ' · extra' : ''}</div>
                <div className="sub">{m.set_scores} · {(m.played_at || '').slice(8, 10)}/{(m.played_at || '').slice(5, 7)}</div></div>
              <div className="pts up">+{m.myPoints}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function Bars({ data }) {
  const max = Math.max(1, ...data.map(d => d.v))
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 90, marginTop: 14, paddingTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '6px 6px 0 0', height: `${Math.max(6, (d.v / max) * 100)}%`,
            background: d.v > 0 ? 'linear-gradient(180deg,var(--orange-2),var(--orange))' : '#dfe6e7' }} />
        ))}
      </div>
      <div className="axis">{data.map((d, i) => <span key={i}>{d.label}</span>)}</div>
    </>
  )
}
function currentStreak(matches) { let st = 0; for (const m of matches) { if (m.result === 'V') st++; else break } return st }
function buildMonthly(matches) {
  const now = new Date(); const out = []
  for (let k = 5; k >= 0; k--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - k, 1)
    out.push({ label: MONTHS[dt.getMonth()], key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`, v: 0 })
  }
  const idx = Object.fromEntries(out.map((o, i) => [o.key, i]))
  for (const m of matches) { const key = (m.played_at || '').slice(0, 7); if (key in idx) out[idx[key]].v += m.myPoints }
  return out
}
