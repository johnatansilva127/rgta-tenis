import { useEffect, useState } from 'react'
import { supabase, matchView, MATCH_SELECT } from './supabaseClient'

function badge(m) {
  if (m.status === 'awaiting_opponent') return <span className="pill pend" style={{ margin: 0 }}>A confirmar</span>
  if (m.status === 'pending') return <span className="pill pend" style={{ margin: 0 }}>Em aprovação</span>
  if (m.status === 'rejected') return <span className="pill loss" style={{ margin: 0 }}>Recusada</span>
  return <div className="pts up">+{m.myPoints}</div>
}

export default function History({ session, tick }) {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .or(`winner_id.eq.${id},loser_id.eq.${id}`)
      .order('played_at', { ascending: false }).limit(80)
      .then(({ data }) => setRows((data || []).map(m => matchView(m, id))))
  }, [session, tick])

  const approved = rows ? rows.filter(m => m.status === 'approved') : []
  const total = approved.reduce((a, m) => a + m.myPoints, 0)
  const chart = buildChart(approved.slice().reverse())

  return (
    <>
      <div className="topbar"><div className="row"><h3>Minhas Partidas</h3><div style={{ width: 34 }} /></div></div>
      <div className="scroll">
        <div className="chart-card">
          <h4>Evolução de pontos</h4>
          <div className="small">{rows ? `${approved.length} partidas válidas · +${total} pts` : '—'}</div>
          <svg viewBox="0 0 260 90" style={{ width: '100%', height: 90 }}>
            {chart.area && <polygon fill="rgba(237,118,32,.12)" points={chart.area} />}
            {chart.line && <polyline fill="none" stroke="#ED7620" strokeWidth="3" points={chart.line} />}
            {chart.dots.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill="#fff" stroke="#ED7620" strokeWidth="2" />)}
          </svg>
        </div>
        <div className="sec" style={{ paddingBottom: 4 }}><h4>Partidas</h4></div>
        {rows === null && <div className="center"><div className="spin" /></div>}
        {rows && rows.length === 0 && <div className="center">Sem partidas ainda.</div>}
        {rows && rows.map(m => (
          <div className="hist-row" key={m.id}>
            <div className={'res ' + (m.status !== 'approved' ? 'p' : m.result === 'V' ? 'w' : 'l')}>
              {m.status === 'approved' ? m.result : m.status === 'rejected' ? '×' : '…'}
            </div>
            <div>
              <div className="nm">vs. {m.opponent?.name || 'Adversário'}{m.is_extra ? ' · extra' : ''}</div>
              <div className="sub">{m.set_scores}{m.went_super ? ' · STB' : ''} · {fmt(m.played_at)}</div>
            </div>
            {badge(m)}
          </div>
        ))}
      </div>
    </>
  )
}

function fmt(d) { if (!d) return ''; const [y, m, day] = d.split('-'); return `${day}/${m}` }
function buildChart(matches) {
  if (!matches.length) return { line: '', area: '', dots: [] }
  let acc = 0
  const cum = matches.map(m => (acc += m.myPoints))
  const min = Math.min(0, ...cum), max = Math.max(0, ...cum)
  const span = max - min || 1, n = cum.length
  const x = i => n === 1 ? 130 : 5 + (i * 250) / (n - 1)
  const y = v => 80 - ((v - min) / span) * 70
  const dots = cum.map((v, i) => [Math.round(x(i)), Math.round(y(v))])
  const line = dots.map(p => p.join(',')).join(' ')
  const area = `${line} ${dots[dots.length - 1][0]},90 ${dots[0][0]},90`
  return { line, area, dots }
}
