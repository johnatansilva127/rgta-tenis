import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export default function History({ session }) {
  const [rows, setRows] = useState(null)

  useEffect(() => {
    supabase.from('matches')
      .select('id,set_scores,result,points_delta,played_at,opponent:opponent_id(name)')
      .eq('player_id', session.user.id)
      .order('played_at', { ascending: false }).limit(50)
      .then(({ data }) => setRows(data || []))
  }, [session])

  const total = rows ? rows.reduce((a, m) => a + m.points_delta, 0) : 0
  const pts = rows ? rows.slice().reverse() : []
  const chart = buildChart(pts)

  return (
    <>
      <div className="topbar"><div className="row"><h3>Minhas Partidas</h3><div style={{ width: 34 }} /></div></div>
      <div className="scroll">
        <div className="chart-card">
          <h4>Evolução de pontos</h4>
          <div className="small">{rows ? `${rows.length} partidas · saldo ${total >= 0 ? '+' : ''}${total} pts` : '—'}</div>
          <svg viewBox="0 0 260 90" style={{ width: '100%', height: 90 }}>
            {chart.area && <polygon fill="rgba(237,118,32,.12)" points={chart.area} />}
            {chart.line && <polyline fill="none" stroke="#ED7620" strokeWidth="3" points={chart.line} />}
            {chart.dots.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="3.2" fill="#fff" stroke="#ED7620" strokeWidth="2" />
            ))}
          </svg>
        </div>
        <div className="sec" style={{ paddingBottom: 4 }}><h4>Partidas</h4></div>
        {rows === null && <div className="center"><div className="spin" /></div>}
        {rows && rows.length === 0 && <div className="center">Sem partidas ainda.</div>}
        {rows && rows.map(m => (
          <div className="hist-row" key={m.id}>
            <div className={'res ' + (m.result === 'V' ? 'w' : 'l')}>{m.result}</div>
            <div>
              <div className="nm">vs. {m.opponent?.name || 'Adversário'}</div>
              <div className="sub">{m.set_scores} · {fmt(m.played_at)}</div>
            </div>
            <div className={'pts ' + (m.points_delta >= 0 ? 'up' : 'down')}>
              {m.points_delta >= 0 ? '+' : ''}{m.points_delta}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function fmt(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}`
}

function buildChart(matches) {
  if (!matches.length) return { line: '', area: '', dots: [] }
  let acc = 0
  const cum = matches.map(m => (acc += m.points_delta))
  const min = Math.min(0, ...cum), max = Math.max(0, ...cum)
  const span = max - min || 1
  const n = cum.length
  const x = i => n === 1 ? 130 : 5 + (i * 250) / (n - 1)
  const y = v => 80 - ((v - min) / span) * 70
  const dots = cum.map((v, i) => [Math.round(x(i)), Math.round(y(v))])
  const line = dots.map(p => p.join(',')).join(' ')
  const area = `${line} ${dots[dots.length - 1][0]},90 ${dots[0][0]},90`
  return { line, area, dots }
}
