import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Auth from './Auth.jsx'
import Home from './Home.jsx'
import Profile from './Profile.jsx'
import Ranking from './Ranking.jsx'
import Register from './Register.jsx'
import History from './History.jsx'

const TABS = [
  { id: 'home', icon: '🏠', label: 'Início' },
  { id: 'ranking', icon: '📊', label: 'Ranking' },
  { id: 'register', icon: '＋', label: 'Registrar' },
  { id: 'history', icon: '🎾', label: 'Partidas' },
  { id: 'profile', icon: '👤', label: 'Perfil' },
]

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = carregando
  const [profile, setProfile] = useState(null)
  const [screen, setScreen] = useState('home')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadProfile = useCallback(async () => {
    if (!session) return
    const { data } = await supabase.from('rankings').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }, [session])

  useEffect(() => { loadProfile() }, [loadProfile])

  if (session === undefined) {
    return <Shell><div className="screen"><div className="center"><div className="spin" /></div></div></Shell>
  }
  if (!session) {
    return <Shell><div className="screen"><Auth /></div></Shell>
  }

  const nav = (s) => setScreen(s)
  const props = { session, profile, reload: loadProfile, nav }

  return (
    <Shell>
      <div className="screen">
        {screen === 'home' && <Home {...props} />}
        {screen === 'ranking' && <Ranking {...props} />}
        {screen === 'register' && <Register {...props} />}
        {screen === 'history' && <History {...props} />}
        {screen === 'profile' && <Profile {...props} />}
        <nav className="tabbar">
          {TABS.map(t => (
            <button key={t.id} className={screen === t.id ? 'on' : ''} onClick={() => nav(t.id)}>
              <span className="ti">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return <div className="app-shell"><div className="phone">{children}</div></div>
}
