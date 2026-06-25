import { useEffect, useState } from 'react'
import { supabase, initials, matchView, MATCH_SELECT } from './supabaseClient'

export default function Home({ session, profile, nav, isAdmin }) {
  const [last, setLast] = useState(null)

  useEffect(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .or(`winner_id.eq.${id},loser_id.eq.${id}`)
      .order('played_at', { ascending: false }).limit(5)
      .then(({ data }) => setLast((data || []).map(m => matchView(m, id))))
  }, [session])

  return (
    <>
      <div className="topbar">
        <div className="row">
          <h3>RGTA</h3>
          <div className="ic" onClick={() => nav('profile')}>{profile ? initials(profile.name) : '·'}</div>
        </div>
      </div>
      <div className="summary">
        <div className="sum-card"><div className="lbl">Sua posição</div>
          <div className="val">{profile ? `${profile.position}º · Cat. ${profile.category}` : '—'}</div></div>
        <div className="sum-card"><div className="lbl">Pontos</div>
          <div className="val">{profile ? profile.points : '—'}</div></div>
      </div>
      <div className="scroll">
        <div className="sec">
          <button className="cta" onClick={() => nav('register')}>＋ Registrar nova partida</button>
          {isAdmin && <button className="cta ghost" style={{ marginTop: 10 }} onClick={() => nav('admin')}>🛠️ Painel do administrador</button>}
        </div>
        <div className="sec" style={{ paddingTop: 0 }}>
          <h4>Últimos resultados</h4>
          {last === null && <div className="center"><div className="spin" /></div>}
          {last && last.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nenhuma partida ainda. Que tal registrar a primeira?</div>}
          {last && last.map(m => (
            <div className="result-row" key={m.id}>
              <div className="ava">{initials(m.opponent?.name || '?')}</div>
              <div>
                <div className="nm">vs. {m.opponent?.name || 'Adversário'}</div>
                <div className="sub">{m.set_scores}{m.went_super ? ' · STB' : ''}</div>
              </div>
              {m.status === 'pending'
                ? <span className="pill pend">Pendente</span>
                : m.status === 'rejected'
                  ? <span className="pill loss">Recusada</span>
                  : <span className={'pill ' + (m.result === 'V' ? 'win' : 'loss')}>{m.result === 'V' ? `+${m.myPoints}` : `+${m.myPoints}`}</span>}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
