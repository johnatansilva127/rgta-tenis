import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { supabase } from './supabaseClient'
import Avatar from './Avatar.jsx'

export default function PublicRanking({ onEnter }) {
  const [tab, setTab] = useState('A')
  const [all, setAll] = useState(null)

  useEffect(() => {
    supabase.rpc('public_ranking').then(({ data }) => setAll(data || []))
  }, [])

  const rows = (all || []).filter(r => r.category === tab)

  return (
    <>
      <div className="topbar"><div className="row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <img src="/logo-rgta.png" alt="RGTA" width={34} height={34} style={{ display: 'block', borderRadius: '50%' }} />
          <h3>RGTA</h3>
        </div>
        <button className="enter-btn" onClick={onEnter}><Icon name="user" size={16} /> Entrar</button>
      </div></div>
      <div className="tabs">
        {['A', 'B', 'C'].map(c => <button key={c} className={tab === c ? 'on' : ''} onClick={() => setTab(c)}>CAT. {c}</button>)}
      </div>
      <div className="scroll">
        {all === null && <div className="center"><div className="spin" /></div>}
        {all && rows.length === 0 && <div className="center">Nenhum jogador na categoria {tab}.</div>}
        {rows.map(r => (
          <div className="rk-row" key={r.id} style={{ cursor: 'default' }}>
            <div className="rk-pos">{r.pos}</div>
            <Avatar name={r.name} url={r.avatar_url} size={34} />
            <div className="rk-name">{r.name}</div>
            <div className="rk-pts">{r.points}</div>
          </div>
        ))}
      </div>
    </>
  )
}
