import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'

export default function InstallBanner() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    try { if (localStorage.getItem('rgta-install-dismissed')) return } catch (_e) {}
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (standalone) return
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const handler = (e) => { e.preventDefault(); setDeferred(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    if (isIos && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)) { setIos(true); setShow(true) }
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show) return null
  function dismiss() { try { localStorage.setItem('rgta-install-dismissed', '1') } catch (_e) {}; setShow(false) }
  async function install() {
    if (!deferred) return
    deferred.prompt()
    try { await deferred.userChoice } catch (_e) {}
    setDeferred(null); setShow(false)
  }
  return (
    <div className="install-banner">
      <img src="/logo-rgta.png" width={34} height={34} alt="" style={{ borderRadius: '50%', flex: '0 0 auto' }} />
      <div className="ib-txt">
        {ios
          ? <>Instale o RGTA: toque em <b>Compartilhar</b> e depois <b>Adicionar à Tela de Início</b>.</>
          : <>Instale o RGTA no seu celular para abrir como app.</>}
      </div>
      {!ios && <button className="ib-btn" onClick={install}>Instalar</button>}
      <button className="ib-x" onClick={dismiss} aria-label="Fechar"><Icon name="x" size={16} /></button>
    </div>
  )
}
