import { initials } from './supabaseClient'

export default function Avatar({ name, url, size = 38, style }) {
  const s = { width: size, height: size, fontSize: size * 0.38, ...style }
  if (url) return <div className="ava" style={s}><img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
  return <div className="ava" style={s}>{initials(name)}</div>
}
