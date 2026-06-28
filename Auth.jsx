import { useState } from 'react'
import { supabase } from './supabaseClient'
import Logo from './Logo.jsx'
import Legal from './Legal.jsx'

const toEmail = (v) => {
  const t = (v || '').trim()
  if (t.includes('@')) return t
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '') + '@rgta.app'
}

export default function Auth() {
  const [mode, setMode] = useState('login') // login | signup
  const [name, setName] = useState('')
  const [category, setCategory] = useState('C')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [showLegal, setShowLegal] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setErr(''); setMsg(''); setLoading(true)
    try {
      if (mode === 'login') {
        let { error } = await supabase.auth.signInWithPassword({ email: toEmail(email), password })
        if (error) {
          const alt = password.trim().toLowerCase()
          if (alt && alt !== password) {
            const retry = await supabase.auth.signInWithPassword({ email: toEmail(email), password: alt })
            error = retry.error
          }
        }
        if (error) throw error
      } else {
        if (!name.trim()) throw new Error('Informe seu nome.')
        if (password.length < 6) throw new Error('A senha precisa ter ao menos 6 caracteres.')
        // Cadastro via Edge Function (cria o jogador ja confirmado, sem e-mail).
        const { data, error } = await supabase.functions.invoke('signup', {
          body: { email: toEmail(email), password, name: name.trim(), category },
        })
        if (error) throw new Error('Nao foi possivel concluir o cadastro. Tente novamente.')
        if (!data?.ok) throw new Error(data?.error || 'Nao foi possivel concluir o cadastro.')
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: toEmail(email), password })
        if (signInErr) throw signInErr
      }
    } catch (e) {
      setErr(traduz(e.message))
    } finally {
      setLoading(false)
    }
  }

  if (showLegal) return <Legal onClose={() => setShowLegal(false)} />

  return (
    <div className="login">
      <div className="court-lines" />
      <div className="brand">
        <Logo size={92} />
        <h2>RG<span>TA</span></h2>
        <p>RANKING GERAL DE TÊNIS AMADOR</p>
      </div>

      {err && <div className="err">{err}</div>}
      {msg && <div className="ok">{msg}</div>}

      <form onSubmit={submit} style={{ width: '100%', zIndex: 2 }}>
        {mode === 'signup' && (
          <>
            <div className="field">👤<input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="field">🎾
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="A">Categoria A</option>
                <option value="B">Categoria B</option>
                <option value="C">Categoria C</option>
              </select>
            </div>
          </>
        )}
        <div className="field">👤<input type="text" required placeholder="Seu nome (ou e-mail)" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="field">🔒<input type="password" required placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} /></div>
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Aguarde…' : (mode === 'login' ? 'Entrar' : 'Criar conta')}
        </button>
      </form>

      {mode === 'login'
        ? <button className="linkbtn reg" onClick={() => { setMode('signup'); setErr(''); setMsg('') }}>Não tem conta? Cadastre-se</button>
        : <button className="linkbtn" onClick={() => { setMode('login'); setErr(''); setMsg('') }}>Já tenho conta — Entrar</button>}
      <button className="linkbtn" style={{ marginTop: 18, opacity: .85 }} onClick={() => setShowLegal(true)}>Política de Privacidade e Termos</button>
    </div>
  )
}

function traduz(m = '') {
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.'
  if (/already registered|ja esta cadastrado/i.test(m)) return 'Este e-mail já está cadastrado.'
  if (/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar.'
  return m
}
