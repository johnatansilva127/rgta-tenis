import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Avatar from './Avatar.jsx'

function delta(p) {
  if (p.prev_position == null || p.prev_position === p.position) return <span className="delta">–</span>
  if (p.prev_position > p.position) return <span className="delta up">▲{p.prev_position - p.position}</span>
  return <span className="delta down">▼{p.position - p.prev_position}</span>
}

export default function Ranking({ session, tick, openPlayer }) {
  const [tab, setTab] = useState('B')
  const [rows, setRows] = useState(null)

  useEffect(() => {
    setRows(null)
    supabase.from('rankings').select('*').eq('category', tab).order('position', { ascending: true })
      .then(({ data }) => setRows(data || []))
  }, [tab, tick])

  function exportRanking() {
    const w = window.open('', '_blank')
    if (!w) return alert('Permita pop-ups para exportar.')
    const list = (rows || []).map(r => `<tr><td>${r.position}º</td><td>${r.name}</td><td style="text-align:right;font-weight:700">${r.points}</td></tr>`).join('')
    w.document.write(`<html><head><title>Ranking RGTA - Cat ${tab}</title><style>
      body{font-family:Arial;padding:24px;color:#1C2429}h1{color:#C85A0E}
      table{width:100%;border-collapse:collapse;margin-top:12px}td{padding:8px 6px;border-bottom:1px solid #eee;font-size:15px}
      .h{color:#5B6B72;font-size:12px}</style></head><body>
      <h1>RGTA · Ranking Categoria ${tab}</h1><div class="h">Gerado em ${new Date().toLocaleDateString('pt-BR')}</div>
      <table>${list}</table></body></html>`)
    w.document.close(); setTimeout(() => w.print(), 300)
  }

  return (
    <>
      <div className="topbar"><div className="row">
        <h3>Ranking</h3>
        <button className="ic" onClick={exportRanking} title="Exportar">⤓</button>
      </div></div>
      <div className="tabs">
        {['A', 'B', 'C'].map(c => <button key={c} className={tab === c ? 'on' : ''} onClick={() => setTab(c)}>CAT. {c}</button>)}
      </div>
      <div className="scroll">
        {rows === null && <div className="center"><div className="spin" /></div>}
        {rows && rows.length === 0 && <div className="center">Nenhum jogador na categoria {tab}.</div>}
        {rows && rows.map(r => (
          <div className={'rk-row ' + (r.id === session.user.id ? 'me' : '')} key={r.id} onClick={() => openPlayer(r.id)}>
            <div className="rk-pos">{r.position}</div>
            <Avatar name={r.name} url={r.avatar_url} size={34} />
            <div className="rk-name">{r.name}{r.is_admin ? ' 🛠️' : ''}</div>
            {delta(r)}
            <div className="rk-pts">{r.points}</div>
          </div>
        ))}
      </div>
    </>
  )
}
