import { useEffect, useState } from 'react'
import { supabase, initials } from './supabaseClient'

export default function Ranking({ session }) {
  const [tab, setTab] = useState('B')
  const [rows, setRows] = useState(null)

  useEffect(() => {
    setRows(null)
    supabase.from('rankings').select('*').eq('category', tab)
      .order('position', { ascending: true })
      .then(({ data }) => setRows(data || []))
  }, [tab])

  return (
    <>
      <div className="topbar"><div className="row"><h3>Ranking Detalhado</h3><div style={{ width: 34 }} /></div></div>
      <div className="tabs">
        {['A', 'B', 'C'].map(c => (
          <button key={c} className={tab === c ? 'on' : ''} onClick={() => setTab(c)}>CAT. {c}</button>
        ))}
      </div>
      <div className="scroll">
        {rows === null && <div className="center"><div className="spin" /></div>}
        {rows && rows.length === 0 && <div className="center">Nenhum jogador na categoria {tab} ainda.</div>}
        {rows && rows.map(r => (
          <div className={'rk-row ' + (r.id === session.user.id ? 'me' : '')} key={r.id}>
            <div className="rk-pos">{r.position}</div>
            <div className="ava">{initials(r.name)}</div>
            <div className="rk-name">{r.name}</div>
            <div className="rk-pts">{r.points}</div>
          </div>
        ))}
      </div>
    </>
  )
}
