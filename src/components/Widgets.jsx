// Kokpitin SVG tabanlı küçük bileşenleri. Hepsi faz değiştikçe prop'larla güncellenir.
import { useLang } from '../i18n.jsx'

export function SyntheticVision({ phase, degraded }) {
  const { t, pick } = useLang()
  const s = phase.set
  const pitch = (s.pitch ?? 0) * 1.4
  return (
    <div className="feed gp" data-card="feed">
      <img className="feed-img" src="/clouds.jpg" alt="Synthetic vision — outside view"
        style={{ transform: `translateY(${pitch}px) scale(1.12)`, transition: 'transform .5s cubic-bezier(.22,1,.36,1)' }} />
      <div className="feed-vignette" />
      <svg viewBox="0 0 420 200" preserveAspectRatio="xMidYMid slice" className="feed-svg">
        <g opacity=".3" stroke="#ffffff" strokeWidth=".6">
          {[80, 170, 250, 340].map((x) => <line key={x} x1={x} y1="20" x2={x} y2="180" />)}
        </g>
        <g stroke="#ffd23f" strokeWidth="1.6" fill="none">
          <circle cx="210" cy="100" r="7" />
          <line x1="203" y1="100" x2="195" y2="100" /><line x1="217" y1="100" x2="225" y2="100" />
          <line x1="210" y1="93" x2="210" y2="88" />
        </g>
        <rect x="300" y="86" width="26" height="26" rx="3" fill="none" stroke="#ffd23f" strokeWidth="1.4" opacity=".9" />
      </svg>

      <div className="overlay tl">
        <span className="chip accent">{phase.n.toUpperCase()}</span>
        <span className="chip">SYNTH VIS · 4K</span>
      </div>
      <div className="overlay tr">
        <span className="chip"><i className="dot red" /> LIVE</span>
        <span className="chip">{s.eta || '16:58'} ETA</span>
      </div>
      <div className="overlay br">
        <span className="chip">TERR</span>
        <span className="chip blue-b">TFC</span>
        <span className="chip">WX</span>
      </div>
      <div className={`next-action ${degraded ? 'degraded' : ''}`}>
        <div className="na-head">
          <i className="ti">✦</i>
          <span className={`na-lbl ${degraded ? 'warn' : ''}`}>{degraded ? t('na.unavail') : t('na.title')}</span>
          {!degraded && <span className="na-conf">{phase.conf}%</span>}
        </div>
        <div className="na-text">{degraded ? t('na.offline') : phase.action}</div>
        <div className="na-why">{degraded ? t('na.offlineWhy') : pick(phase.why)}</div>
      </div>
    </div>
  )
}

export function RadialGauge({ gauge }) {
  const off = 217 - (217 * gauge.val) / 100
  return (
    <svg viewBox="0 0 120 78" className="gauge-svg">
      <path className="svg-track" d="M14 70 A46 46 0 1 1 106 70" fill="none" strokeWidth="9" strokeLinecap="round" />
      <path d="M14 70 A46 46 0 1 1 106 70" fill="none" stroke={gauge.color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray="217" strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .6s, stroke .4s' }} />
      <text x="60" y="52" textAnchor="middle" fontSize="20" fontWeight="500" fill={gauge.color}>{gauge.val}</text>
      <text className="svg-muted" x="60" y="66" textAnchor="middle" fontSize="9">{gauge.cap}</text>
    </svg>
  )
}

export function Compass({ hdg = 0 }) {
  return (
    <>
      <div className="chip blue-b hdg-chip">{hdg}°</div>
      <svg viewBox="0 0 100 100" className="compass-svg">
        <circle className="svg-fill svg-line" cx="50" cy="50" r="44" />
        <g style={{ transform: `rotate(${-hdg}deg)`, transformOrigin: '50px 50px', transition: 'transform .6s cubic-bezier(.22,1,.36,1)' }}>
          <text x="50" y="20" textAnchor="middle" fill="#ff5f5f" fontSize="10" fontWeight="500">N</text>
          <text className="svg-muted" x="83" y="54" textAnchor="middle" fontSize="9">E</text>
          <text className="svg-muted" x="50" y="88" textAnchor="middle" fontSize="9">S</text>
          <text className="svg-muted" x="17" y="54" textAnchor="middle" fontSize="9">W</text>
          <line x1="50" y1="26" x2="50" y2="34" stroke="#5f6b7d" />
          <line x1="74" y1="50" x2="66" y2="50" stroke="#5f6b7d" />
        </g>
        <path d="M50 30 L45 52 L50 47 L55 52 Z" fill="#5aa6ff" />
      </svg>
    </>
  )
}

export function JogDial({ appr, autobrakeReady, flapsReady }) {
  const active = (m) => (appr ? m === 'APPR' : ['LNAV', 'VNAV', 'A/THR'].includes(m))
  const pos = { VNAV: 'top', LNAV: 'left', APPR: 'right', 'A/THR': 'bottom' }
  // Checklist senaryolarında (örn. iniş öncesi) kullanılan ek göstergeler —
  // yalnızca prop verildiğinde render edilir, Dashboard'daki normal kullanımı etkilemez.
  const showChecklist = autobrakeReady !== undefined || flapsReady !== undefined
  return (
    <div className="dial-wrap">
      <svg viewBox="0 0 96 96" className="dial-svg">
        <circle className="svg-fill svg-line" cx="48" cy="48" r="45" />
        <circle className="svg-fill svg-line" cx="48" cy="48" r="22" />
      </svg>
      {Object.keys(pos).map((m) => (
        <span key={m} className={`mode ${pos[m]} ${active(m) ? 'on' : ''}`}>{m}</span>
      ))}
      {showChecklist && <span className={`mode corner-l ${autobrakeReady ? 'on' : ''}`}>A/BRK</span>}
      {showChecklist && <span className={`mode corner-r ${flapsReady ? 'on' : ''}`}>FLAP</span>}
      <span className="mode-center">MODE</span>
    </div>
  )
}
