import { useEffect, useState, useCallback, useRef } from 'react'
import Icon from './Icon.jsx'
import { supabase, DEFAULT_SETTINGS } from './supabaseClient'
import Auth from './Auth.jsx'
import Home from './Home.jsx'
import Profile from './Profile.jsx'
import Ranking from './Ranking.jsx'
import Register from './Register.jsx'
import History from './History.jsx'
import Admin from './Admin.jsx'
import Notifs from './Notifs.jsx'
import PlayerProfile from './PlayerProfile.jsx'

const BASE_TABS = [
  { id: 'home', icon: 'home', label: 'Início' },
  { id: 'ranking', icon: 'chart', label: 'Ranking' },
  { id: 'register', icon: 'plus', label: 'Registrar' },
  { id: 'history', icon: 'ball', label: 'Partidas' },
  { id: 'profile', icon: 'user', label: 'Perfil' },
]
const ADMIN_TAB = { id: 'admin', icon: 'shield', label: 'Admin' }

export default function App() {
  const [session, setSession] = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [screen, setScreen] = useState('home')
  const [viewPlayer, setViewPlayer] = useState(null)
  const [tick, setTick] = useState(0)
  const [badge, setBadge] = useState(0)
  const chanRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) { setProfile(null); setScreen('home') }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadProfile = useCallback(async () => {
    if (!session) return
    const { data } = await supabase.from('rankings').select('*').eq('id', session.user.id).single()
    setProfile(data)
  }, [session])

  const loadBadge = useCallback(async () => {
    if (!session) return
    const id = session.user.id
    const { count: unread } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', id).eq('read', false)
    const { count: toConfirm } = await supabase.from('matches').select('id', { count: 'exact', head: true })
      .eq('status', 'awaiting_opponent').or(`winner_id.eq.${id},loser_id.eq.${id}`).neq('created_by', id)
    setBadge((unread || 0) + (toConfirm || 0))
  }, [session])

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('id', 1).single().then(({ data }) => { if (data) setSettings(data) })
  }, [])

  useEffect(() => { loadProfile(); loadBadge() }, [loadProfile, loadBadge])

  // tempo real
  useEffect(() => {
    if (!session) return
    const ch = supabase.channel('rgta-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => { setTick(t => t + 1); loadProfile(); loadBadge() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${session.user.id}` }, () => { setTick(t => t + 1); loadBadge() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { setTick(t => t + 1); loadProfile() })
      .subscribe()
    chanRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [session, loadProfile, loadBadge])

  if (session === undefined) return <Shell><div className="screen"><div className="center"><div className="spin" /></div></div></Shell>
  if (!session) return <Shell><div className="screen"><Auth /></div></Shell>

  const isAdmin = !!profile?.is_admin
  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS
  const nav = (s) => { setViewPlayer(null); setScreen(s) }
  const openPlayer = (id) => { setViewPlayer(id); setScreen('player') }
  const openNotifs = () => { setViewPlayer(null); setScreen('notifs') }
  const props = { session, profile, settings, reload: loadProfile, nav, isAdmin, tick, openPlayer, openNotifs, badge }

  return (
    <Shell>
      <div className="screen">
        {screen === 'home' && <Home {...props} />}
        {screen === 'ranking' && <Ranking {...props} />}
        {screen === 'register' && <Register {...props} />}
        {screen === 'history' && <History {...props} />}
        {screen === 'profile' && <Profile {...props} />}
        {screen === 'admin' && isAdmin && <Admin {...props} />}
        {screen === 'notifs' && <Notifs {...props} />}
        {screen === 'player' && <PlayerProfile {...props} playerId={viewPlayer} />}
        <nav className="tabbar">
          {tabs.map(t => {
            const active = screen === t.id || (t.id === 'home' && ['notifs', 'player'].includes(screen))
            return (
              <button key={t.id} className={active ? 'on' : ''} onClick={() => nav(t.id)}>
                <span className="ti"><Icon name={t.icon} size={22} /></span>{t.label}
              </button>
            )
          })}
        </nav>
      </div>
    </Shell>
  )
}

function Shell({ children }) {
  return <div className="app-shell"><div className="phone">{children}</div></div>
}
