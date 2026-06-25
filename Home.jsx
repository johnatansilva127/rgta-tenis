import { useEffect, useState } from 'react'
import { supabase, initials } from './supabaseClient'

export default function Home({ session, profile, nav }) {
  const [last, setLast] = useState(null)

  useEffect(() => {
    supabase.from('matches')
      .select('id,set_scores,result,points_delta,opponent:opponent_id(name)')
      .eq('player_id', session.user.id)
      .order('played_at', { ascending: false }).limit(5)
      .then(({ data }) => setLast(data || []))
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
        </div>
        <div className="sec" style={{ paddingTop: 0 }}>
          <h4>Últimos resultados</h4>
          {last === null && <div className="center"><div className="spin" /></div>}
          {last && last.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nenhuma partida registrada ainda. Que tal lançar a primeira?</div>}
          {last && last.map(m => (
            <div className="result-row" key={m.id}>
              <div className="ava">{initials(m.opponent?.name || '?')}</div>
              <div>
                <div className="nm">vs. {m.opponent?.name || 'Adversário'}</div>
                <div className="sub">{m.set_scores}</div>
              </div>
              <span className={'pill ' + (m.result === 'V' ? 'win' : 'loss')}>
                {m.result === 'V' ? 'Vitória' : 'Derrota'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
