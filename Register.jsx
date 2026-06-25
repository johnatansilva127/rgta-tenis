import { useEffect, useState } from 'react'
import { supabase, initials } from './supabaseClient'

const today = () => new Date().toISOString().slice(0, 10)

export default function Register({ session, profile, reload, nav }) {
  const [players, setPlayers] = useState([])
  const [opponent, setOpponent] = useState('')
  const [result, setResult] = useState('V')
  const [sets, setSets] = useState([['', ''], ['', ''], ['', '']])
  const [date, setDate] = useState(today())
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('id,name').neq('id', session.user.id).order('name')
      .then(({ data }) => setPlayers(data || []))
  }, [session])

  function setScore(i, j, v) {
    const n = sets.map(r => [...r])
    n[i][j] = v.replace(/[^0-9]/g, '').slice(0, 2)
    setSets(n)
  }

  function buildScores() {
    return sets
      .filter(([a, b]) => a !== '' || b !== '')
      .map(([a, b]) => `${a || 0}-${b || 0}`)
      .join(' / ')
  }

  async function save() {
    setErr(''); setOk('')
    if (!opponent) return setErr('Selecione o adversário.')
    const scores = buildScores()
    if (!scores) return setErr('Informe o placar de pelo menos um set.')
    setSaving(true)
    const { error } = await supabase.rpc('register_match', {
      p_opponent: opponent,
      p_set_scores: scores,
      p_result: result,
      p_played_at: date,
    })
    setSaving(false)
    if (error) return setErr(error.message)
    await reload()
    setOk('Partida registrada!')
    setTimeout(() => nav('home'), 700)
  }

  const delta = result === 'V' ? '+20' : '-12'

  return (
    <>
      <div className="topbar"><div className="row">
        <button className="ic" onClick={() => nav('home')}>‹</button>
        <h3>Registrar Partida</h3><div style={{ width: 34 }} />
      </div></div>
      <div className="scroll"><div className="sec">
        {err && <div className="err" style={{ color: '#a32', background: 'rgba(224,74,63,.1)', border: '1px solid rgba(224,74,63,.4)' }}>{err}</div>}
        {ok && <div className="ok" style={{ color: '#176c3a', background: 'rgba(46,158,91,.1)', border: '1px solid rgba(46,158,91,.4)' }}>{ok}</div>}

        <div className="form-lbl">JOGADORES</div>
        <div className="vs-box">
          <div className="sel"><div className="ava">{profile ? initials(profile.name) : '·'}</div> Você</div>
          <span className="vs">VS</span>
          <div className="sel">
            <select value={opponent} onChange={e => setOpponent(e.target.value)}>
              <option value="">Adversário…</option>
              {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-lbl">PLACAR POR SET (você - adversário)</div>
        <div className="score-grid">
          {sets.map((s, i) => (
            <div className="set" key={i}>
              <div className="st">SET {i + 1}</div>
              <div className="sc">
                <input inputMode="numeric" value={s[0]} onChange={e => setScore(i, 0, e.target.value)} placeholder="0" />
                <input inputMode="numeric" value={s[1]} onChange={e => setScore(i, 1, e.target.value)} placeholder="0" />
              </div>
            </div>
          ))}
        </div>

        <div className="form-lbl">RESULTADO</div>
        <div className="seg">
          <div className={result === 'V' ? 'on' : ''} onClick={() => setResult('V')}>Vitória</div>
          <div className={result === 'D' ? 'on' : ''} onClick={() => setResult('D')}>Derrota</div>
        </div>

        <div className="form-lbl">DATA</div>
        <input className="date" type="date" value={date} onChange={e => setDate(e.target.value)} />

        <button className="cta" style={{ marginTop: 22 }} disabled={saving} onClick={save}>
          {saving ? 'Salvando…' : `Salvar partida (${delta} pts)`}
        </button>
      </div></div>
    </>
  )
}
