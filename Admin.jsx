import { useEffect, useState, useCallback } from 'react'
import { supabase, initials, compatible, calcPoints, MATCH_SELECT } from './supabaseClient'

const today = () => new Date().toISOString().slice(0, 10)

export default function Admin({ reload }) {
  const [tab, setTab] = useState('aprovar')
  return (
    <>
      <div className="topbar"><div className="row"><h3>Painel do Admin</h3><div style={{ width: 34 }} /></div></div>
      <div className="tabs">
        <button className={tab === 'aprovar' ? 'on' : ''} onClick={() => setTab('aprovar')}>Aprovações</button>
        <button className={tab === 'jogadores' ? 'on' : ''} onClick={() => setTab('jogadores')}>Jogadores</button>
        <button className={tab === 'lancar' ? 'on' : ''} onClick={() => setTab('lancar')}>Lançar</button>
      </div>
      <div className="scroll">
        {tab === 'aprovar' && <Approvals reload={reload} />}
        {tab === 'jogadores' && <Players />}
        {tab === 'lancar' && <AddMatch reload={reload} />}
      </div>
    </>
  )
}

/* ---------- APROVAÇÕES ---------- */
function Approvals({ reload }) {
  const [rows, setRows] = useState(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    supabase.from('matches').select(MATCH_SELECT).eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load])

  async function act(id, fn) {
    setBusy(id)
    const { error } = await supabase.rpc(fn, { p_match: id })
    setBusy('')
    if (error) { alert(error.message); return }
    await reload()
    load()
  }

  if (rows === null) return <div className="center"><div className="spin" /></div>
  if (rows.length === 0) return <div className="center">Nenhuma partida aguardando aprovação. 🎉</div>

  return (
    <div className="sec">
      {rows.map(m => (
        <div className="adm-card" key={m.id}>
          <div className="adm-line">
            <b>{m.winner?.name}</b> <span className="tag">{m.winner?.category}</span>
            <span className="vs">venceu</span>
            {m.loser?.name} <span className="tag">{m.loser?.category}</span>
          </div>
          <div className="adm-sub">{m.set_scores}{m.went_super ? ' · super TB' : ''}{m.is_extra ? ' · extra' : ''} · vencedor +{m.winner_points} / perdedor +{m.loser_points}</div>
          <div className="adm-actions">
            <button className="bt ok" disabled={busy === m.id} onClick={() => act(m.id, 'approve_match')}>Aprovar</button>
            <button className="bt no" disabled={busy === m.id} onClick={() => act(m.id, 'reject_match')}>Recusar</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- JOGADORES ---------- */
function Players() {
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')

  const load = useCallback(() => {
    supabase.from('rankings').select('*').order('category').order('points', { ascending: false })
      .then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load])

  async function changeCat(p, cat) {
    const { error } = await supabase.rpc('admin_update_player', { p_id: p.id, p_name: p.name, p_category: cat })
    if (error) return alert(error.message)
    setMsg(`${p.name} agora é categoria ${cat}.`)
    load()
  }
  async function toggleAdmin(p) {
    const { error } = await supabase.rpc('admin_set_admin', { p_id: p.id, p_value: !p.is_admin })
    if (error) return alert(error.message)
    load()
  }

  if (rows === null) return <div className="center"><div className="spin" /></div>
  return (
    <div className="sec">
      {msg && <div className="ptsbox" style={{ marginBottom: 10 }}>{msg}</div>}
      {rows.map(p => (
        <div className="adm-card" key={p.id}>
          <div className="adm-line">
            <div className="ava" style={{ width: 30, height: 30, fontSize: 12 }}>{initials(p.name)}</div>
            <b>{p.name}</b> {p.is_admin && <span className="tag adm">admin</span>}
            <span style={{ marginLeft: 'auto', fontWeight: 800 }}>{p.points} pts</span>
          </div>
          <div className="adm-sub">{p.wins}V / {p.losses}D · {p.position}º na categoria</div>
          <div className="adm-actions">
            <select value={p.category} onChange={e => changeCat(p, e.target.value)} className="minisel">
              <option value="A">Cat. A</option><option value="B">Cat. B</option><option value="C">Cat. C</option>
            </select>
            <button className="bt" onClick={() => toggleAdmin(p)}>{p.is_admin ? 'Remover admin' : 'Tornar admin'}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- LANÇAR PARTIDA ---------- */
function AddMatch({ reload }) {
  const [players, setPlayers] = useState([])
  const [winner, setWinner] = useState('')
  const [loser, setLoser] = useState('')
  const [sets, setSets] = useState([['', ''], ['', ''], ['', '']])
  const [superTb, setSuperTb] = useState(false)
  const [date, setDate] = useState(today())
  const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('id,name,category').order('name').then(({ data }) => setPlayers(data || []))
  }, [])

  const W = players.find(p => p.id === winner)
  const L = players.find(p => p.id === loser)
  const compat = W && L ? compatible(W.category, L.category) : true
  const preview = W && L && compat ? calcPoints(W.category, L.category, superTb) : null

  function setScore(i, j, v) {
    const n = sets.map(r => [...r]); n[i][j] = v.replace(/[^0-9]/g, '').slice(0, 2); setSets(n)
  }
  function buildScores() {
    return sets.filter(([a, b]) => a !== '' || b !== '').map(([a, b]) => `${a || 0}-${b || 0}`).join(' / ')
  }
  async function save() {
    setErr(''); setOk('')
    if (!winner || !loser) return setErr('Selecione vencedor e perdedor.')
    if (winner === loser) return setErr('Jogadores devem ser diferentes.')
    if (!compat) return setErr('Categorias incompatíveis (A não joga com C).')
    const scores = buildScores()
    if (!scores) return setErr('Informe o placar.')
    setSaving(true)
    const { error } = await supabase.rpc('admin_create_match', {
      p_winner: winner, p_loser: loser, p_set_scores: scores, p_went_super: superTb, p_played_at: date,
    })
    setSaving(false)
    if (error) return setErr(error.message)
    setOk('Partida lançada e aprovada!')
    setSets([['', ''], ['', ''], ['', '']]); setSuperTb(false); setWinner(''); setLoser('')
    await reload()
  }

  return (
    <div className="sec">
      {err && <div className="err" style={{ color: '#a32', background: 'rgba(224,74,63,.1)', border: '1px solid rgba(224,74,63,.4)' }}>{err}</div>}
      {ok && <div className="ok" style={{ color: '#176c3a', background: 'rgba(46,158,91,.1)', border: '1px solid rgba(46,158,91,.4)' }}>{ok}</div>}
      <div className="form-lbl">VENCEDOR</div>
      <div className="sel"><select value={winner} onChange={e => setWinner(e.target.value)}>
        <option value="">Selecione…</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
      </select></div>
      <div className="form-lbl">PERDEDOR</div>
      <div className="sel"><select value={loser} onChange={e => setLoser(e.target.value)}>
        <option value="">Selecione…</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}
      </select></div>
      {!compat && <div style={{ color: 'var(--down)', fontSize: 12, marginTop: 6 }}>A não joga contra C.</div>}

      <div className="form-lbl">PLACAR (vencedor - perdedor)</div>
      <div className="score-grid">
        {sets.map((s, i) => (
          <div className="set" key={i}>
            <div className="st">{i === 2 && superTb ? 'SUPER TB' : 'SET ' + (i + 1)}</div>
            <div className="sc">
              <input inputMode="numeric" value={s[0]} onChange={e => setScore(i, 0, e.target.value)} placeholder="0" />
              <input inputMode="numeric" value={s[1]} onChange={e => setScore(i, 1, e.target.value)} placeholder="0" />
            </div>
          </div>
        ))}
      </div>
      <label className="checkrow">
        <input type="checkbox" checked={superTb} onChange={e => setSuperTb(e.target.checked)} />
        O 3º set foi super tie-break
      </label>
      {preview && <div className="ptsbox">Vencedor +{preview.winner} · Perdedor +{preview.loser}</div>}
      <div className="form-lbl">DATA</div>
      <input className="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className="cta" style={{ marginTop: 18 }} disabled={saving} onClick={save}>
        {saving ? 'Salvando…' : 'Lançar partida'}
      </button>
    </div>
  )
}
