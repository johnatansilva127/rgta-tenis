import { useState } from 'react'
import { supabase } from './supabaseClient'
import Legal from './Legal.jsx'
import Logo from './Logo.jsx'

export default function ConsentGate({ onAccepted }) {
  const [agree, setAgree] = useState(false)
  const [showLegal, setShowLegal] = useState(false)
  const [busy, setBusy] = useState(false)

  if (showLegal) return <div className="screen"><Legal onClose={() => setShowLegal(false)} /></div>

  async function accept() {
    setBusy(true)
    const { error } = await supabase.rpc('accept_terms')
    setBusy(false)
    if (error) return alert(error.message)
    onAccepted()
  }
  async function logout() { await supabase.auth.signOut() }

  return (
    <div className="login">
      <div className="court-lines" />
      <div className="brand"><Logo size={76} /><h2>RG<span>TA</span></h2></div>
      <div style={{ zIndex: 2, maxWidth: 360, textAlign: 'center' }}>
        <p style={{ fontSize: 14, marginBottom: 14, color: '#dfeaeb', lineHeight: 1.5 }}>
          Para usar o app, você precisa ler e aceitar nossa <b>Política de Privacidade</b> e os <b>Termos de Uso</b>, conforme a LGPD.
        </p>
        <button className="linkbtn reg" style={{ marginTop: 0 }} onClick={() => setShowLegal(true)}>Ler a Política de Privacidade e Termos</button>
        <label className="checkrow" style={{ color: '#dfeaeb', justifyContent: 'center', marginTop: 18 }}>
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
          Li e aceito a Política de Privacidade e os Termos
        </label>
        <button className="btn-primary" disabled={!agree || busy} onClick={accept}>{busy ? 'Aguarde…' : 'Aceitar e continuar'}</button>
        <button className="linkbtn" onClick={logout}>Sair</button>
      </div>
    </div>
  )
}
