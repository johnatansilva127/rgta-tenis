import { useEffect, useState } from 'react'
import { supabase, matchView, MATCH_SELECT } from './supabaseClient'
import Avatar from './Avatar.jsx'

export default function PlayerProfile({ session, playerId, nav, tick }) {
  const [p, setP] = useState(null)
  const [matches, setMatches] = useState(null)
  const me = session.user.id

  useEffect(() => {
    supabase.from('rankings').select('*').eq('id', playerId).single().then(({ data }) => setP(data))
    supabase.from('matches').select(MATCH_SELECT)
      .eq('status', 'approved').or(`winner_id.eq.${playerId},loser_id.eq.${playerId}`)
      .order('played_at', { ascending: false }).limit(40)
      .then(({ data }) => setMatches(data || []))
  }, [playerId, tick])

  if (!p) return (<><div className="topbar"><div className="row"><button className="ic" onClick={() => nav('ranking')}>‹</button><h3>Perfil</h3><div style={{ width: 34 }} /></div></div><div className="center"><div className="spin" /></div></>)

  const theirView = (matches || []).map(m => matchView(m, playerId))
  const h2h = (matches || []).filter(m => m.winner_id === me || m.loser_id === me)
  const myWins = h2h.filter(m => m.winner_id === me).length
  const theirWins = h2h.filter(m => m.winner_id === playerId).length
  const isMe = playerId === me

  return (
    <>
      <div className="topbar"><div className="row">
        <button className="ic" onClick={() => nav('ranking')}>‹</button><h3>Jogador</h3><div style={{ width: 34 }} />
      </div></div>
      <div className="scroll">
        <div className="prof-head">
          <Avatar name={p.name} url={p.avatar_url} size={78} style={{ border: '3px solid rgba(255,255,255,.5)' }} />
          <div className="nm">{p.name}{p.is_admin ? ' 🛠️' : ''}</div>
          <div className="cat">Categoria {p.category} · {p.position}º no ranking</div>
        </div>
        <div className="stat-card">
          <div className="stat-grid">
            <div><div className="k">Pontos</div><div className="v">{p.points}</div></div>
            <div><div className="k">Vitórias / Derrotas</div><div className="v">{p.wins} / {p.losses}</div></div>
          </div>
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
        <div className="sec"><h4>Partidas recentes</h4>
          {matches === null && <div className="center"><div className="spin" /></div>}
          {matches && matches.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nenhuma partida válida ainda.</div>}
          {theirView.map(m => (
            <div className="hist-row" key={m.id}>
              <div className={'res ' + (m.result === 'V' ? 'w' : 'l')}>{m.result}</div>
              <div><div className="nm">vs. {m.opponent?.name}</div>
                <div className="sub">{m.set_scores} · {(m.played_at || '').slice(8, 10)}/{(m.played_at || '').slice(5, 7)}</div></div>
              <div className="pts up">+{m.myPoints}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
