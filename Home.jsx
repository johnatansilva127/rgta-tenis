import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { supabase, matchView, MATCH_SELECT } from './supabaseClient'
import Avatar from './Avatar.jsx'

function pill(m) {
  if (m.status === 'awaiting_opponent') return <span className="pill pend">Aguardando confirmação</span>
  if (m.status === 'pending') return <span className="pill pend">Em aprovação</span>
  if (m.status === 'rejected') return <span className="pill loss">Recusada</span>
  return <span className={'pill ' + (m.result === 'V' ? 'win' : 'loss')}>+{m.myPoints}</span>
}

export default function Home({ session, profile, nav, isAdmin, openNotifs, badge, tick }) {
  const [last, setLast] = useState(null)

  useEffect(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .or(`winner_id.eq.${id},loser_id.eq.${id}`)
      .order('played_at', { ascending: false }).limit(6)
      .then(({ data }) => setLast((data || []).map(m => matchView(m, id))))
  }, [session, tick])

  const [league, setLeague] = useState(null)
  useEffect(() => {
    supabase.rpc('recent_results', { p_limit: 12 }).then(({ data }) => setLeague(data || []))
  }, [tick])

  return (
    <>
      <div className="topbar">
        <div className="row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/logo-rgta.png" alt="RGTA" width={34} height={34} style={{ display: 'block', borderRadius: '50%' }} />
            <h3>RGTA</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ic bell" onClick={openNotifs} aria-label="Avisos"><Icon name="bell" size={20} />{badge > 0 && <span className="bdg">{badge}</span>}</button>
            <button className="ic" onClick={() => nav('profile')}><Avatar name={profile?.name} url={profile?.avatar_url} size={34} /></button>
          </div>
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
          <button className="cta" onClick={() => nav('register')}><Icon name="plus" size={18} /> Registrar nova partida</button>
          {isAdmin && <button className="cta ghost" style={{ marginTop: 10 }} onClick={() => nav('admin')}><Icon name="shield" size={18} /> Painel do administrador</button>}
        </div>
        <div className="sec" style={{ paddingTop: 0 }}>
          <h4>Últimos resultados</h4>
          {last === null && <div className="center"><div className="spin" /></div>}
          {last && last.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nenhuma partida ainda. Registre a primeira!</div>}
          {last && last.map(m => (
            <div className="result-row" key={m.id}>
              <Avatar name={m.opponent?.name} url={m.opponent?.avatar_url} />
              <div>
                <div className="nm">vs. {m.opponent?.name || 'Adversário'}</div>
                <div className="sub">{m.set_scores}{m.went_super ? ' · STB' : ''}</div>
              </div>
              {pill(m)}
            </div>
          ))}
        </div>
        <div className="sec" style={{ paddingTop: 0 }}>
          <h4>Últimos jogos da liga</h4>
          {league === null && <div className="center"><div className="spin" /></div>}
          {league && league.map(m => (
            <div className="feed-row" key={m.id}>
              <Avatar name={m.winner_name} url={m.winner_avatar} size={30} />
              <div className="feed-txt"><b>{m.winner_name}</b> venceu {m.loser_name}<div className="sub">{m.set_scores}{m.went_super ? ' · STB' : ''} · {fmtd(m.played_at)}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function fmtd(d) { if (!d) return ''; const [y, m, day] = d.split('-'); return `${day}/${m}` }
