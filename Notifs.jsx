import { useEffect, useState, useCallback } from 'react'
import { supabase, matchView, MATCH_SELECT } from './supabaseClient'
import Avatar from './Avatar.jsx'

const ICON = { confirm_request: '✋', confirmed: '✅', disputed: '⚠️', approved: '🏆', rejected: '🚫', rank_up: '⬆️', rank_down: '⬇️', match_removed: '🗑️', to_approve: '📝' }

export default function Notifs({ session, nav, tick }) {
  const [confirms, setConfirms] = useState(null)
  const [notes, setNotes] = useState(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .eq('status', 'awaiting_opponent').or(`winner_id.eq.${id},loser_id.eq.${id}`).neq('created_by', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setConfirms((data || []).map(m => matchView(m, id))))
    supabase.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(40)
      .then(({ data }) => setNotes(data || []))
  }, [session])

  useEffect(() => { load() }, [load, tick])
  useEffect(() => { supabase.rpc('mark_notifications_read') }, [])

  async function act(id, fn) {
    setBusy(id)
    const { error } = await supabase.rpc(fn, { p_match: id })
    setBusy('')
    if (error) return alert(error.message)
    load()
  }

  return (
    <>
      <div className="topbar"><div className="row">
        <button className="ic" onClick={() => nav('home')}>‹</button>
        <h3>Avisos</h3><div style={{ width: 34 }} />
      </div></div>
      <div className="scroll">
        <div className="sec">
          <h4>Para confirmar</h4>
          {confirms === null && <div className="center"><div className="spin" /></div>}
          {confirms && confirms.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nada para confirmar agora.</div>}
          {confirms && confirms.map(m => (
            <div className="adm-card" key={m.id}>
              <div className="adm-line">
                <Avatar name={m.opponent?.name} url={m.opponent?.avatar_url} size={30} />
                <b>{m.opponent?.name}</b> registrou uma partida
              </div>
              <div className="adm-sub">{m.set_scores}{m.went_super ? ' · super TB' : ''} · resultado pra você: <b>{m.result === 'V' ? 'vitória' : 'derrota'}</b></div>
              <div className="adm-actions">
                <button className="bt ok" disabled={busy === m.id} onClick={() => act(m.id, 'confirm_match')}>Confirmar</button>
                <button className="bt no" disabled={busy === m.id} onClick={() => act(m.id, 'dispute_match')}>Contestar</button>
              </div>
            </div>
          ))}
        </div>
        <div className="sec" style={{ paddingTop: 0 }}>
          <h4>Histórico de avisos</h4>
          {notes === null && <div className="center"><div className="spin" /></div>}
          {notes && notes.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Sem avisos.</div>}
          {notes && notes.map(n => (
            <div className="note-row" key={n.id}>
              <div className="note-ic">{ICON[n.type] || '🔔'}</div>
              <div><div className="nm" style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</div>
                <div className="sub" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{n.body}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
