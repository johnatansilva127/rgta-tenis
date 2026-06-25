import { useEffect, useState } from 'react'
import { supabase, initials, matchView, MATCH_SELECT } from './supabaseClient'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Profile({ session, profile }) {
  const [monthly, setMonthly] = useState(null)

  useEffect(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .or(`winner_id.eq.${id},loser_id.eq.${id}`)
      .eq('status', 'approved')
      .then(({ data }) => setMonthly(buildMonthly((data || []).map(m => matchView(m, id)))))
  }, [session])

  if (!profile) return <div className="center"><div className="spin" /></div>

  const total = profile.wins + profile.losses
  const winRate = total ? Math.round((profile.wins / total) * 100) : 0
  async function logout() { await supabase.auth.signOut() }

  return (
    <>
      <div className="topbar"><div className="row">
        <h3>Perfil</h3>
        <button className="ic" onClick={logout} title="Sair">⏻</button>
      </div></div>
      <div className="scroll">
        <div className="prof-head">
          <div className="ava">{initials(profile.name)}</div>
          <div className="nm">{profile.name}{profile.is_admin ? ' 🛠️' : ''}</div>
          <div className="cat">Categoria {profile.category} · {profile.position}º no ranking</div>
        </div>
        <div className="stat-card">
          <div className="stat-grid">
            <div><div className="k">Pontos totais</div><div className="v">{profile.points}</div></div>
            <div><div className="k">Vitórias / Derrotas</div><div className="v">{profile.wins} / {profile.losses}</div></div>
            <div><div className="k">Melhor ranking</div><div className="v">{profile.best_rank ? profile.best_rank + 'º' : '—'}</div></div>
            <div><div className="k">Aproveitamento</div><div className="v up">{winRate}%</div></div>
          </div>
          <Bars data={monthly} />
        </div>
      </div>
    </>
  )
}

function Bars({ data }) {
  if (!data) return <div className="center" style={{ padding: 20 }}><div className="spin" /></div>
  const max = Math.max(1, ...data.map(d => d.v))
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96, marginTop: 14, paddingTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{
            flex: 1, borderRadius: '6px 6px 0 0',
            height: `${Math.max(6, (d.v / max) * 100)}%`,
            background: d.v > 0 ? 'linear-gradient(180deg,var(--orange-2),var(--orange))' : '#dfe6e7',
          }} />
        ))}
      </div>
      <div className="axis">{data.map((d, i) => <span key={i}>{d.label}</span>)}</div>
    </>
  )
}

function buildMonthly(matches) {
  const now = new Date()
  const out = []
  for (let k = 5; k >= 0; k--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - k, 1)
    out.push({ label: MONTHS[dt.getMonth()], key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`, v: 0 })
  }
  const idx = Object.fromEntries(out.map((o, i) => [o.key, i]))
  for (const m of matches) {
    const key = (m.played_at || '').slice(0, 7)
    if (key in idx) out[idx[key]].v += m.myPoints
  }
  return out
}
