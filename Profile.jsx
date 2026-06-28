import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { supabase, matchView, MATCH_SELECT, uploadAvatar } from './supabaseClient'
import Avatar from './Avatar.jsx'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export default function Profile({ session, profile, reload, tick, nav }) {
  const [matches, setMatches] = useState(null)
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .or(`winner_id.eq.${id},loser_id.eq.${id}`).eq('status', 'approved')
      .order('played_at', { ascending: false })
      .then(({ data }) => setMatches((data || []).map(m => matchView(m, id))))
  }, [session, tick])

  if (!profile) return <div className="center"><div className="spin" /></div>

  const total = profile.wins + profile.losses
  const winRate = total ? Math.round((profile.wins / total) * 100) : 0
  const streak = currentStreak(matches || [])
  const monthly = buildMonthly(matches || [])

  async function logout() { await supabase.auth.signOut() }
  async function exportData() {
    const id = session.user.id
    const { data } = await supabase.from('matches').select(MATCH_SELECT).or(`winner_id.eq.${id},loser_id.eq.${id}`).order('played_at')
    const payload = {
      perfil: { nome: profile.name, categoria: profile.category, pontos: profile.points, vitorias: profile.wins, derrotas: profile.losses },
      partidas: (data || []).map(m => matchView(m, id)).map(m => ({ data: m.played_at, adversario: m.opponent?.name, resultado: m.result === 'V' ? 'Vitoria' : 'Derrota', placar: m.set_scores, pontos: m.myPoints, status: m.status })),
      exportado_em: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'meus-dados-rgta.json'; a.click()
  }
  async function requestDeletion() {
    if (!confirm('Deseja solicitar a exclusão da sua conta? O administrador será avisado e fará a remoção dos seus dados.')) return
    const { error } = await supabase.rpc('request_deletion', { p_reason: null })
    if (error) return alert(error.message)
    alert('Pedido enviado. O administrador foi avisado e fará a exclusão.')
  }
  function startEdit() { setName(profile.name); setEdit(true) }
  async function saveName() {
    setBusy(true)
    const { error } = await supabase.rpc('update_own_profile', { p_name: name, p_avatar_url: profile.avatar_url || null })
    setBusy(false)
    if (error) return alert(error.message)
    setEdit(false); await reload()
  }
  async function onPhoto(e) {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try {
      const url = await uploadAvatar(session.user.id, file)
      const { error } = await supabase.rpc('update_own_profile', { p_name: profile.name, p_avatar_url: url })
      if (error) throw error
      await reload()
    } catch (err) { alert(err.message) } finally { setBusy(false) }
  }

  return (
    <>
      <div className="topbar"><div className="row">
        <h3>Perfil</h3>
        <button className="ic" onClick={logout} title="Sair" aria-label="Sair"><Icon name="logout" size={18} /></button>
      </div></div>
      <div className="scroll">
        <div className="prof-head">
          <div style={{ position: 'relative' }} onClick={() => fileRef.current?.click()}>
            <Avatar name={profile.name} url={profile.avatar_url} size={78} style={{ border: '3px solid rgba(255,255,255,.5)' }} />
            <div className="cam"><Icon name="camera" size={14} /></div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          {edit ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input className="date" value={name} onChange={e => setName(e.target.value)} style={{ padding: '7px 10px' }} />
              <button className="bt ok" disabled={busy} onClick={saveName}>Salvar</button>
              <button className="bt" onClick={() => setEdit(false)}>X</button>
            </div>
          ) : (
            <div className="nm" onClick={startEdit}>{profile.name} <Icon name="pencil" size={15} style={{ opacity: .85 }} /></div>
          )}
          <div className="cat">Categoria {profile.category} · {profile.position}º no ranking</div>
        </div>
        <div className="stat-card">
          <div className="stat-grid">
            <div><div className="k">Pontos totais</div><div className="v">{profile.points}</div></div>
            <div><div className="k">Vitórias / Derrotas</div><div className="v">{profile.wins} / {profile.losses}</div></div>
            <div><div className="k">Melhor ranking</div><div className="v">{profile.best_rank ? profile.best_rank + 'º' : '—'}</div></div>
            <div><div className="k">Aproveitamento</div><div className="v up">{winRate}%</div></div>
            <div><div className="k">Sequência atual</div><div className="v">{streak > 0 ? <>{streak}<Icon name="flame" size={15} /></> : '—'}</div></div>
            <div><div className="k">Total de jogos</div><div className="v">{total}</div></div>
          </div>
          <Bars data={monthly} />
        </div>
        <div className="priv-card">
          <h4>Privacidade e dados (LGPD)</h4>
          <div className="small">Seus direitos sobre seus dados.</div>
          <div className="priv-actions">
            <button className="bt" onClick={() => nav('legal')}>Ver Política de Privacidade e Termos</button>
            <button className="bt" onClick={exportData}><Icon name="download" size={14} /> Baixar meus dados</button>
            <button className="bt no" onClick={requestDeletion}><Icon name="trash" size={14} /> Solicitar exclusão da conta</button>
          </div>
        </div>
        <div style={{ height: 12 }} />
      </div>
    </>
  )
}

function Bars({ data }) {
  const max = Math.max(1, ...data.map(d => d.v))
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96, marginTop: 14, paddingTop: 6 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, borderRadius: '6px 6px 0 0', height: `${Math.max(6, (d.v / max) * 100)}%`,
            background: d.v > 0 ? 'linear-gradient(180deg,var(--orange-2),var(--orange))' : '#dfe6e7' }} />
        ))}
      </div>
      <div className="axis">{data.map((d, i) => <span key={i}>{d.label}</span>)}</div>
    </>
  )
}
function currentStreak(matches) {
  let s = 0
  for (const m of matches) { if (m.result === 'V') s++; else break }
  return s
}
function buildMonthly(matches) {
  const now = new Date(); const out = []
  for (let k = 5; k >= 0; k--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - k, 1)
    out.push({ label: MONTHS[dt.getMonth()], key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`, v: 0 })
  }
  const idx = Object.fromEntries(out.map((o, i) => [o.key, i]))
  for (const m of matches) { const key = (m.played_at || '').slice(0, 7); if (key in idx) out[idx[key]].v += m.myPoints }
  return out
}
