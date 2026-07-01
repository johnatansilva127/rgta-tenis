import { useEffect, useState, useCallback } from 'react'
import Icon from './Icon.jsx'
import { supabase, matchView, MATCH_SELECT } from './supabaseClient'
import Avatar from './Avatar.jsx'

const ICON = { confirm_request: 'userCheck', confirmed: 'check', disputed: 'alert', approved: 'trophy', rejected: 'ban', rank_up: 'arrowUp', rank_down: 'arrowDown', match_removed: 'trash', to_approve: 'file' }

export default function Notifs({ session, nav, tick }) {
  const [confirms, setConfirms] = useState(null)
  const [notes, setNotes] = useState(null)
  const [chals, setChals] = useState(null)
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    const id = session.user.id
    supabase.from('matches').select(MATCH_SELECT)
      .eq('status', 'awaiting_opponent').or(`winner_id.eq.${id},loser_id.eq.${id}`).neq('created_by', id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setConfirms((data || []).map(m => matchView(m, id))))
    supabase.from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(40)
      .then(({ data }) => setNotes(data || []))
    supabase.from('challenges')
      .select('*, challenger:challenger_id(name,avatar_url,category), challenged:challenged_id(name,avatar_url,category)')
      .eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data }) => setChals(data || []))
  }, [session])
  async function respond(id, accept) { const { error } = await supabase.rpc('respond_challenge', { p_id: id, p_accept: accept }); if (error) return alert(error.message); load() }
  async function cancelC(id) { const { error } = await supabase.rpc('cancel_challenge', { p_id: id }); if (error) return alert(error.message); load() }

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
        <button className="ic" onClick={() => nav('home')} aria-label="Voltar"><Icon name="chevronLeft" size={22} /></button>
        <h3>Avisos</h3><div style={{ width: 34 }} />
      </div></div>
      <div className="scroll">
        <div className="sec">
          <h4>Desafios</h4>
          {chals === null && <div className="center"><div className="spin" /></div>}
          {chals && chals.length === 0 && <div style={{ color: 'var(--ink-2)', fontSize: 13 }}>Nenhum desafio no momento.</div>}
          {chals && chals.map(c => {
            const incoming = c.challenged_id === session.user.id
            const other = incoming ? c.challenger : c.challenged
            return (
              <div className="adm-card" key={c.id}>
                <div className="adm-line"><Avatar name={other?.name} url={other?.avatar_url} size={30} /> {incoming ? <><b>{other?.name}</b> te desafiou</> : <>Você desafiou <b>{other?.name}</b></>}</div>
                {c.message && <div className="adm-sub">"{c.message}"</div>}
                <div className="adm-actions">
                  {incoming
                    ? <><button className="bt ok" onClick={() => respond(c.id, true)}>Aceitar</button><button className="bt no" onClick={() => respond(c.id, false)}>Recusar</button></>
                    : <button className="bt no" onClick={() => cancelC(c.id)}>Cancelar</button>}
                </div>
              </div>
            )
          })}
        </div>
        <div className="sec" style={{ paddingTop: 0 }}>
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
              <div className="note-ic"><Icon name={ICON[n.type] || 'bell'} size={17} /></div>
              <div><div className="nm" style={{ fontSize: 13, fontWeight: 700 }}>{n.title}</div>
                <div className="sub" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{n.body}</div></div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
