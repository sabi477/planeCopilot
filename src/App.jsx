import { useState, useRef, useCallback } from 'react'
import { Glyph } from './components/Glyph.jsx'
import { Dashboard } from './components/Dashboard.jsx'
import { RadarView, SystemsView, WeatherView, AlertsView, SettingsView, ProfileView } from './components/Views.jsx'
import { Scenarios } from './components/Scenarios.jsx'
import { LangContext, makeT } from './i18n.jsx'
import { useVoice, pulseCard } from './voice.jsx'
import { VRStage } from './components/vr/VRStage.jsx'

const NAV = [
  { id: 'dashboard', icon: 'layout-dashboard' },
  { id: 'scenarios', icon: 'play' },
  { id: 'radar', icon: 'radar' },
  { id: 'systems', icon: 'stack' },
  { id: 'weather', icon: 'cloud' },
  { id: 'alerts', icon: 'bell' },
  { id: 'settings', icon: 'settings' },
]

export default function App() {
  const [lang, setLang] = useState('tr')
  const [theme, setTheme] = useState('dark')
  const [view, setView] = useState('dashboard')
  const [cur, setCur] = useState(8) // Cruise
  const [units, setUnits] = useState('metric')
  const [powerOff, setPowerOff] = useState(false)
  const [auraOk, setAuraOk] = useState(true)
  const [voiceMsg, setVoiceMsg] = useState(null) // { text, tone }
  const msgTimer = useRef(null)
  const scenarioCtrl = useRef({}) // Scenarios'ın next/prev/restart'ını sesle kontrol etmek için
  const { t } = makeT(lang)

  const flash = useCallback((text, tone = 'ok') => {
    setVoiceMsg({ text, tone })
    clearTimeout(msgTimer.current)
    msgTimer.current = setTimeout(() => setVoiceMsg(null), 3200)
  }, [])

  // Tanınan sesli cümleyi bir aksiyona eşle. text = küçük harfli tam cümle.
  const runCommand = useCallback((text) => {
    const has = (...ws) => ws.some((w) => text.includes(w))
    const jump = (v, label) => { setView(v); flash(`🎙 "${text}" → ${label}`) }

    // --- Senaryo listesinde gerçek uçuş callout'larıyla sıralı ilerleme ---
    // (örn. "Normal kalkış" senaryosu: thrust set → 100kt → V1 → rotate → positive rate/gear up → flaps up → climb power)
    if (view === 'scenarios') {
      const res = scenarioCtrl.current?.sayCallout?.(text)
      if (res && res.ok !== null) {
        flash(`🎙 "${text}" → ${res.msg}`, res.tone)
        return
      }
      // Callout verisi olmayan senaryolar için genel ileri/geri komutları
      if (has('sıradaki', 'sonraki', 'ileri', 'devam', 'next')) {
        scenarioCtrl.current?.next?.()
        flash(`🎙 "${text}" → sıradaki adım`, 'accent')
        return
      }
      if (has('geri', 'önceki', 'previous', 'back')) {
        scenarioCtrl.current?.prev?.()
        flash(`🎙 "${text}" → önceki adım`, 'accent')
        return
      }
      if (has('baştan', 'tekrar', 'yeniden', 'restart')) {
        scenarioCtrl.current?.restart?.()
        flash(`🎙 "${text}" → baştan`, 'accent')
        return
      }
    }

    // --- Sesli "tıklama": iniş takımı hazır ---
    if (has('tekerler hazır', 'teker hazır', 'tekerlek hazır', 'iniş takımı', 'gear down', 'gear')) {
      setView('dashboard'); setCur(10) // Approach — gear ilgili faz
      pulseCard('gear')
      flash('🎙 "tekerler hazır" → iniş takımı vurgulandı', 'accent')
      return
    }
    // --- Faz komutları ---
    const PH = [
      [['kalkış', 'takeoff'], 4], [['seyir', 'cruise'], 8],
      [['alçal', 'descent', 'descend'], 9], [['yaklaşma', 'approach'], 10],
      [['iniş', 'landing', 'land'], 11],
    ]
    for (const [ws, idx] of PH) {
      if (has(...ws)) { setView('dashboard'); setCur(idx); flash(`🎙 "${text}" → faz: ${idx}`, 'accent'); return }
    }
    // --- Navigasyon komutları ---
    if (has('panel', 'kokpit', 'flight deck', 'ana ekran')) return jump('dashboard', 'Uçuş paneli')
    if (has('senaryo')) return jump('scenarios', 'Senaryolar')
    if (has('trafik', 'radar')) return jump('radar', 'Trafik')
    if (has('sistem')) return jump('systems', 'Sistemler')
    if (has('hava')) return jump('weather', 'Hava durumu')
    if (has('tavsiye', 'uyarı', 'advisor')) return jump('alerts', 'Tavsiyeler')
    if (has('ayar', 'settings')) return jump('settings', 'Ayarlar')
    if (has('profil')) return jump('profile', 'Profil')
    // --- Tema komutları ---
    if (has('koyu tema', 'karanlık')) { setTheme('dark'); return flash('🎙 tema → koyu') }
    if (has('açık tema', 'aydınlık')) { setTheme('light'); return flash('🎙 tema → açık') }

    flash(`🎙 "${text}" — komut tanınmadı`, 'warn')
  }, [flash, view])

  const voice = useVoice({
    lang: lang === 'tr' ? 'tr-TR' : 'en-US',
    onResult: runCommand,
    onError: (err) => flash(`🎙 mikrofon hatası: ${err}`, 'warn'),
  })

  if (view === 'vr') {
    return (
      <LangContext.Provider value={{ lang, setLang }}>
        <VRStage
          cur={cur} setCur={setCur}
          theme={theme} setTheme={setTheme}
          degraded={!auraOk} setDegraded={(d) => setAuraOk(!d)}
          onExit={() => setView('dashboard')}
        />
      </LangContext.Provider>
    )
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div className="app" data-theme={theme}>
        <div className="cockpit">
          <nav className="rail">
            <div className="rail-logo" title="AURA — Adaptive Unified Response Assistant">AU</div>
            {NAV.map((n) => (
              <button key={n.id} className={`railb ${view === n.id ? 'on' : ''}`}
                title={t('nav.' + n.id)} aria-label={t('nav.' + n.id)} onClick={() => setView(n.id)}>
                <Glyph name={n.icon} />
              </button>
            ))}
            <button className={`railb ${view === 'vr' ? 'on' : ''}`}
              title="VR — kavisli ekran" aria-label="VR" onClick={() => setView('vr')}>
              <Glyph name="vr" />
            </button>
            <div className="rail-spacer" />
            <button className="railb theme-btn" title="Theme" aria-label="Theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Glyph name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button className={`rail-avatar ${view === 'profile' ? 'on' : ''}`} title={t('nav.profile')}
              aria-label={t('nav.profile')} onClick={() => setView('profile')}>SY</button>
            <button className="railb power" title={t('modal.title')} aria-label={t('modal.title')}
              onClick={() => setPowerOff(true)}><Glyph name="power" /></button>
          </nav>

          <div className="main">
            <header className="topbar">
              <div className="tb-left">
                <span className="brand" title="Adaptive Unified Response Assistant">AURA</span>
                <span className="brand-div" />
                <Glyph name="plane" className="accent-t" />
                <strong>AFR1742</strong>
                <span className="sub">A350-900 · F-WXYZ</span>
                <span className="chip accent">{t('nav.' + view).toUpperCase()}</span>
              </div>
              <div className="tb-right">
                <span className="sub">UTC 14:22</span>
                <span className="sub">LCL 16:22</span>
                {voice.supported && (
                  <button className={`chip btn mic ${voice.listening ? 'live' : ''}`}
                    onClick={voice.toggle}
                    title='Sesli komut (örn. "tekerler hazır", "senaryolar", "koyu tema")'>
                    <Glyph name={voice.listening ? 'mic' : 'mic-off'} size={15} />
                    {voice.listening ? (voice.transcript || 'dinleniyor…') : 'Sesli komut'}
                  </button>
                )}
                <button className="chip btn" onClick={() => setAuraOk(!auraOk)}
                  title="AURA durumu (demo) / AURA status (demo)">
                  <i className={`dot ${auraOk ? 'green' : 'amber'}`} /> {auraOk ? t('aura.active') : t('aura.degraded')}
                </button>
                <button className="emer">EMER</button>
              </div>
            </header>

            {view === 'dashboard' && <Dashboard cur={cur} setCur={setCur} degraded={!auraOk} />}
            {view === 'scenarios' && <Scenarios ctrlRef={scenarioCtrl} />}
            {view === 'radar' && <RadarView />}
            {view === 'systems' && <SystemsView />}
            {view === 'weather' && <WeatherView />}
            {view === 'alerts' && <AlertsView />}
            {view === 'settings' && <SettingsView theme={theme} setTheme={setTheme} units={units} setUnits={setUnits} />}
            {view === 'profile' && <ProfileView />}
          </div>
        </div>
        <p className="hint">{t('hint.' + view)}</p>

        {voiceMsg && <div className={`voice-toast ${voiceMsg.tone}`}>{voiceMsg.text}</div>}

        {powerOff && (
          <div className="modal-bg" onClick={() => setPowerOff(false)}>
            <div className="modal gp" onClick={(e) => e.stopPropagation()}>
              <Glyph name="power" className="red-t" size={28} />
              <div className="v" style={{ fontSize: 18, marginTop: 10 }}>{t('modal.title')}</div>
              <p className="sub" style={{ margin: '6px 0 16px', textAlign: 'center' }}>{t('modal.body')}</p>
              <div className="modal-actions">
                <button className="btn ghost" onClick={() => setPowerOff(false)}>{t('modal.cancel')}</button>
                <button className="btn danger" onClick={() => { setPowerOff(false); setView('dashboard'); setCur(0) }}>{t('modal.confirm')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LangContext.Provider>
  )
}
