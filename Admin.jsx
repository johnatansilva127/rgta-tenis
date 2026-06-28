import { useEffect, useState, useCallback } from 'react'
import Icon from './Icon.jsx'
import { supabase, initials, compatible, calcPoints, MATCH_SELECT } from './supabaseClient'
import Avatar from './Avatar.jsx'

const today = () => new Date().toISOString().slice(0, 10)
const fmtDate = (d) => { if (!d) return ''; const [y, m, da] = d.split('-'); return `${da}/${m}/${y}` }
const TABS = [['aprovar', 'Aprovações'], ['jogadores', 'Jogadores'], ['lancar', 'Lançar'], ['partidas', 'Partidas'], ['config', 'Pontuação'], ['logs', 'Logs']]

export default function Admin({ session, settings, reload, tick }) {
  const [tab, setTab] = useState('aprovar')
  return (
    <>
      <div className="topbar"><div className="row"><h3>Painel do Admin</h3><div style={{ width: 34 }} /></div></div>
      <div className="tabs scroll-x">
        {TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div className="scroll">
        {tab === 'aprovar' && <Approvals reload={reload} tick={tick} />}
        {tab === 'jogadores' && <Players session={session} reload={reload} tick={tick} />}
        {tab === 'lancar' && <AddMatch settings={settings} reload={reload} />}
        {tab === 'partidas' && <MatchesAdmin reload={reload} tick={tick} />}
        {tab === 'config' && <Settings />}
        {tab === 'logs' && <Logs tick={tick} />}
      </div>
    </>
  )
}

function Approvals({ reload, tick }) {
  const [rows, setRows] = useState(null); const [busy, setBusy] = useState('')
  const load = useCallback(() => {
    supabase.from('matches').select(MATCH_SELECT).in('status', ['awaiting_opponent', 'pending']).order('created_at', { ascending: true })
      .then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load, tick])
  async function act(id, fn) {
    setBusy(id); const { error } = await supabase.rpc(fn, { p_match: id }); setBusy('')
    if (error) return alert(error.message); await reload(); load()
  }
  if (rows === null) return <div className="center"><div className="spin" /></div>
  if (rows.length === 0) return <div className="center">Nenhuma partida aguardando aprovação. 🎉</div>
  return (
    <div className="sec">
      {rows.map(m => (
        <div className="adm-card" key={m.id}>
          <div className="adm-line"><b>{m.winner?.name}</b> <span className="tag">{m.winner?.category}</span> <span className="vs">venceu</span> {m.loser?.name} <span className="tag">{m.loser?.category}</span>{m.status === 'awaiting_opponent' && <span className="tag" style={{ background: 'var(--orange-l)', color: 'var(--orange-d)' }}>aguardando adversário</span>}</div>
          <div className="adm-sub">{fmtDate(m.played_at)} · {m.set_scores}{m.went_super ? ' · super TB' : ''}{m.is_extra ? ' · extra' : ''} · vencedor +{m.winner_points} / perdedor +{m.loser_points}</div>
          <div className="adm-actions">
            <button className="bt ok" disabled={busy === m.id} onClick={() => act(m.id, 'approve_match')}>Aprovar</button>
            <button className="bt no" disabled={busy === m.id} onClick={() => act(m.id, 'reject_match')}>Recusar</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function Players({ session, reload, tick }) {
  const [rows, setRows] = useState(null); const [q, setQ] = useState(''); const [editing, setEditing] = useState(null); const [form, setForm] = useState({}); const [msg, setMsg] = useState('')
  const load = useCallback(() => {
    supabase.from('rankings').select('*').order('category').order('points', { ascending: false }).then(({ data }) => setRows(data || []))
  }, [])
  useEffect(() => { load() }, [load, tick])
  function startEdit(p) { setEditing(p.id); setMsg(''); setForm({ name: p.name, category: p.category, points: p.points, wins: p.wins, losses: p.losses }) }
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  async function save(p) {
    const { error } = await supabase.rpc('admin_update_player', { p_id: p.id, p_name: form.name, p_category: form.category, p_points: Number(form.points) || 0, p_wins: Number(form.wins) || 0, p_losses: Number(form.losses) || 0 })
    if (error) return alert(error.message); setEditing(null); setMsg(`${form.name} atualizado.`); await reload(); load()
  }
  async function toggleAdmin(p) { const { error } = await supabase.rpc('admin_set_admin', { p_id: p.id, p_value: !p.is_admin }); if (error) return alert(error.message); load(); reload() }
  async function del(p) {
    if (!confirm(`Excluir ${p.name}? Remove a conta e as partidas. Não dá para desfazer.`)) return
    const { error } = await supabase.rpc('admin_delete_player', { p_id: p.id }); if (error) return alert(error.message); setMsg(`${p.name} excluído.`); load()
  }
  async function resetPwd(p) {
    const np = prompt(`Nova senha para ${p.name} (mínimo 6 caracteres):`); if (!np) return
    const { data, error } = await supabase.functions.invoke('admin-reset-password', { body: { user_id: p.id, new_password: np } })
    if (error || !data?.ok) return alert(error?.message || data?.error || 'Erro'); alert(`Senha de ${p.name} redefinida.`)
  }
  if (rows === null) return <div className="center"><div className="spin" /></div>
  const filtered = rows.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="sec">
      {msg && <div className="ptsbox" style={{ marginBottom: 10 }}>{msg}</div>}
      <input className="date" placeholder="Buscar jogador…" value={q} onChange={e => setQ(e.target.value)} style={{ marginBottom: 12 }} />
      {filtered.map(p => (
        <div className="adm-card" key={p.id}>
          <div className="adm-line"><Avatar name={p.name} url={p.avatar_url} size={30} /> <b>{p.name}</b> <span className="tag">{p.category}</span> {p.is_admin && <span className="tag adm">admin</span>}<span style={{ marginLeft: 'auto', fontWeight: 800 }}>{p.points} pts</span></div>
          <div className="adm-sub">{p.wins}V / {p.losses}D · {p.position}º na categoria</div>
          {editing === p.id ? (
            <div className="edit-grid">
              <label>Nome<input value={form.name} onChange={e => setF('name', e.target.value)} /></label>
              <label>Categoria<select value={form.category} onChange={e => setF('category', e.target.value)}><option>A</option><option>B</option><option>C</option></select></label>
              <label>Pontos<input type="number" value={form.points} onChange={e => setF('points', e.target.value)} /></label>
              <label>Vitórias<input type="number" value={form.wins} onChange={e => setF('wins', e.target.value)} /></label>
              <label>Derrotas<input type="number" value={form.losses} onChange={e => setF('losses', e.target.value)} /></label>
              <div className="adm-actions" style={{ gridColumn: '1 / -1' }}>
                <button className="bt ok" onClick={() => save(p)}>Salvar</button><button className="bt" onClick={() => setEditing(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div className="adm-actions" style={{ flexWrap: 'wrap' }}>
              <button className="bt" onClick={() => startEdit(p)}>Editar</button>
              <button className="bt" onClick={() => resetPwd(p)}>Redefinir senha</button>
              <button className="bt" onClick={() => toggleAdmin(p)}>{p.is_admin ? 'Remover admin' : 'Tornar admin'}</button>
              {p.id !== session.user.id && <button className="bt no" onClick={() => del(p)}>Excluir</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function AddMatch({ settings, reload }) {
  const [players, setPlayers] = useState([]); const [winner, setWinner] = useState(''); const [loser, setLoser] = useState('')
  const [sets, setSets] = useState([['', ''], ['', ''], ['', '']]); const [superTb, setSuperTb] = useState(false); const [date, setDate] = useState(today())
  const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => { supabase.from('profiles').select('id,name,category').eq('is_player', true).order('name').then(({ data }) => setPlayers(data || [])) }, [])
  const W = players.find(p => p.id === winner), L = players.find(p => p.id === loser)
  const compat = W && L ? compatible(W.category, L.category) : true
  const [wo, setWo] = useState(false)
  const preview = W && L && compat ? calcPoints(W.category, L.category, superTb && !wo, settings, wo) : null
  function setScore(i, j, v) { const n = sets.map(r => [...r]); n[i][j] = v.replace(/[^0-9]/g, '').slice(0, 2); setSets(n) }
  function buildScores() { return sets.filter(([a, b]) => a !== '' || b !== '').map(([a, b]) => `${a || 0}-${b || 0}`).join(' / ') }
  async function save() {
    setErr(''); setOk('')
    if (!winner || !loser) return setErr('Selecione vencedor e perdedor.')
    if (winner === loser) return setErr('Jogadores devem ser diferentes.')
    if (!compat) return setErr('Categorias incompatíveis (A não joga com C).')
    const scores = wo ? 'W.O.' : buildScores(); if (!wo && !scores) return setErr('Informe o placar.')
    setSaving(true)
    const { error } = await supabase.rpc('admin_create_match', { p_winner: winner, p_loser: loser, p_set_scores: scores, p_went_super: superTb && !wo, p_played_at: date, p_wo: wo })
    setSaving(false); if (error) return setErr(error.message)
    setOk('Partida lançada e aprovada!'); setSets([['', ''], ['', ''], ['', '']]); setSuperTb(false); setWo(false); setWinner(''); setLoser(''); await reload()
  }
  return (
    <div className="sec">
      {err && <div className="err" style={{ color: '#a32', background: 'rgba(224,74,63,.1)', border: '1px solid rgba(224,74,63,.4)' }}>{err}</div>}
      {ok && <div className="ok" style={{ color: '#176c3a', background: 'rgba(46,158,91,.1)', border: '1px solid rgba(46,158,91,.4)' }}>{ok}</div>}
      <div className="form-lbl">VENCEDOR</div>
      <div className="sel"><select value={winner} onChange={e => setWinner(e.target.value)}><option value="">Selecione…</option>{players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}</select></div>
      <div className="form-lbl">PERDEDOR</div>
      <div className="sel"><select value={loser} onChange={e => setLoser(e.target.value)}><option value="">Selecione…</option>{players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}</select></div>
      {!compat && <div style={{ color: 'var(--down)', fontSize: 12, marginTop: 6 }}>A não joga contra C.</div>}
      <div className="form-lbl">PLACAR (vencedor - perdedor)</div>
      <div className="score-grid">{sets.map((s, i) => (
        <div className="set" key={i}><div className="st">{i === 2 && superTb ? 'SUPER TB' : 'SET ' + (i + 1)}</div>
          <div className="sc"><input inputMode="numeric" value={s[0]} onChange={e => setScore(i, 0, e.target.value)} placeholder="0" /><input inputMode="numeric" value={s[1]} onChange={e => setScore(i, 1, e.target.value)} placeholder="0" /></div></div>
      ))}</div>
      <label className="checkrow"><input type="checkbox" checked={superTb} onChange={e => setSuperTb(e.target.checked)} /> O 3º set foi super tie-break</label>
      <label className="checkrow"><input type="checkbox" checked={wo} onChange={e => setWo(e.target.checked)} /> Vitória por W.O. (perdedor fica com 0)</label>
      {preview && <div className="ptsbox">Vencedor +{preview.winner} · Perdedor +{preview.loser}</div>}
      <div className="form-lbl">DATA</div>
      <input className="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      <button className="cta" style={{ marginTop: 18 }} disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Lançar partida'}</button>
    </div>
  )
}

function MatchesAdmin({ reload, tick }) {
  const [rows, setRows] = useState(null); const [players, setPlayers] = useState([]); const [editing, setEditing] = useState(null); const [form, setForm] = useState({})
  const load = useCallback(() => {
    supabase.from('matches').select(MATCH_SELECT).eq('status', 'approved').order('played_at', { ascending: false }).limit(60).then(({ data }) => setRows(data || []))
    supabase.from('profiles').select('id,name,category').eq('is_player', true).order('name').then(({ data }) => setPlayers(data || []))
  }, [])
  useEffect(() => { load() }, [load, tick])
  function startEdit(m) { setEditing(m.id); setForm({ winner: m.winner_id, loser: m.loser_id, scores: m.set_scores, superTb: m.went_super }) }
  async function save(m) {
    const { error } = await supabase.rpc('admin_edit_match', { p_match: m.id, p_winner: form.winner, p_loser: form.loser, p_set_scores: form.scores, p_went_super: !!form.superTb })
    if (error) return alert(error.message); setEditing(null); await reload(); load()
  }
  async function del(m) {
    if (!confirm('Excluir esta partida? Os pontos serão revertidos.')) return
    const { error } = await supabase.rpc('admin_delete_match', { p_match: m.id }); if (error) return alert(error.message); await reload(); load()
  }
  if (rows === null) return <div className="center"><div className="spin" /></div>
  if (rows.length === 0) return <div className="center">Nenhuma partida aprovada ainda.</div>
  return (
    <div className="sec">
      {rows.map(m => (
        <div className="adm-card" key={m.id}>
          <div className="adm-line"><b>{m.winner?.name}</b> <span className="vs">venceu</span> {m.loser?.name}</div>
          <div className="adm-sub">{fmtDate(m.played_at)} · {m.set_scores}{m.went_super ? ' · super TB' : ''} · +{m.winner_points}/+{m.loser_points}</div>
          {editing === m.id ? (
            <div className="edit-grid">
              <label>Vencedor<select value={form.winner} onChange={e => setForm(f => ({ ...f, winner: e.target.value }))}>{players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}</select></label>
              <label>Perdedor<select value={form.loser} onChange={e => setForm(f => ({ ...f, loser: e.target.value }))}>{players.map(p => <option key={p.id} value={p.id}>{p.name} ({p.category})</option>)}</select></label>
              <label style={{ gridColumn: '1 / -1' }}>Placar<input value={form.scores} onChange={e => setForm(f => ({ ...f, scores: e.target.value }))} /></label>
              <label className="checkrow" style={{ gridColumn: '1 / -1' }}><input type="checkbox" checked={!!form.superTb} onChange={e => setForm(f => ({ ...f, superTb: e.target.checked }))} /> Super tie-break</label>
              <div className="adm-actions" style={{ gridColumn: '1 / -1' }}><button className="bt ok" onClick={() => save(m)}>Salvar</button><button className="bt" onClick={() => setEditing(null)}>Cancelar</button></div>
            </div>
          ) : (
            <div className="adm-actions"><button className="bt" onClick={() => startEdit(m)}>Editar</button><button className="bt no" onClick={() => del(m)}>Excluir</button></div>
          )}
        </div>
      ))}
    </div>
  )
}

function Settings() {
  const [s, setS] = useState(null); const [ok, setOk] = useState(''); const [saving, setSaving] = useState(false)
  useEffect(() => { supabase.from('app_settings').select('*').eq('id', 1).single().then(({ data }) => setS(data)) }, [])
  const setF = (k, v) => setS(o => ({ ...o, [k]: v }))
  async function save() {
    setSaving(true)
    const { error } = await supabase.rpc('update_settings', {
      p_win_same: +s.win_same, p_loss_same: +s.loss_same, p_win_above: +s.win_above, p_win_below: +s.win_below,
      p_loss_extra: +s.loss_extra, p_super_bonus: +s.super_bonus, p_start_points: +s.start_points, p_rematch_days: +s.rematch_days, p_loss_below: +s.loss_below,
    })
    setSaving(false); if (error) return alert(error.message); setOk('Pontuação salva!'); setTimeout(() => setOk(''), 2000)
  }
  if (!s) return <div className="center"><div className="spin" /></div>
  const F = (k, label) => <label className="cfg">{label}<input type="number" value={s[k]} onChange={e => setF(k, e.target.value)} /></label>
  return (
    <div className="sec">
      {ok && <div className="ptsbox" style={{ marginBottom: 10 }}>{ok}</div>}
      <div className="cfg-grid">
        {F('win_same', 'Vitória (mesma cat.)')}
        {F('loss_same', 'Derrota (mesma cat.)')}
        {F('win_above', 'Vencer de cima')}
        {F('win_below', 'Vencer de baixo')}
        {F('loss_extra', 'Derrota p/ cima')}
        {F('loss_below', 'Derrota p/ baixo')}
        {F('super_bonus', 'Bônus super TB')}
        {F('start_points', 'Pontos iniciais')}
        {F('rematch_days', 'Dias entre revanche')}
      </div>
      <button className="cta" style={{ marginTop: 16 }} disabled={saving} onClick={save}>{saving ? 'Salvando…' : 'Salvar pontuação'}</button>
    </div>
  )
}

function Logs({ tick }) {
  const [rows, setRows] = useState(null)
  useEffect(() => { supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(80).then(({ data }) => setRows(data || [])) }, [tick])
  if (rows === null) return <div className="center"><div className="spin" /></div>
  if (rows.length === 0) return <div className="center">Sem ações registradas ainda.</div>
  return (
    <div className="sec">
      {rows.map(r => (
        <div className="note-row" key={r.id}>
          <div className="note-ic"><Icon name="file" size={16} /></div>
          <div><div className="nm" style={{ fontSize: 13, fontWeight: 700 }}>{r.action}</div>
            <div className="sub" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{r.actor_name || '—'} · {new Date(r.created_at).toLocaleString('pt-BR')}</div></div>
        </div>
      ))}
    </div>
  )
}
