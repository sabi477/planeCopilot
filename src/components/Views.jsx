import { Glyph } from './Glyph.jsx'
import { useLang } from '../i18n.jsx'

// ---- Radar / Traffic ----
const TRAFFIC = [
  { id: 'BAW221', x: 70, y: 58, rel: '+12', dist: '8.2 nm', clo: '−40 kt', tone: 'amber' },
  { id: 'DLH8X', x: 128, y: 96, rel: '−08', dist: '14 nm', clo: '+5 kt', tone: 'gray' },
  { id: 'AFR55', x: 96, y: 150, rel: '+02', dist: '11 nm', clo: '−12 kt', tone: 'gray' },
  { id: 'EZY44', x: 150, y: 132, rel: '−24', dist: '19 nm', clo: '+18 kt', tone: 'gray' },
]
export function RadarView() {
  const { t } = useLang()
  return (
    <div className="view two-col">
      <div className="gp panel">
        <ViewHead icon="radar" title={t('radar.title')} sub={t('radar.tcas')} tone="green" />
        <svg viewBox="0 0 220 220" className="scope">
          {[30, 60, 90].map((r) => <circle key={r} className="svg-line" cx="110" cy="110" r={r} fill="none" />)}
          <line className="svg-line" x1="110" y1="14" x2="110" y2="206" />
          <line className="svg-line" x1="14" y1="110" x2="206" y2="110" />
          <path d="M110 96 L102 120 L110 114 L118 120 Z" fill="var(--accent)" />
          {TRAFFIC.map((c) => (
            <g key={c.id}>
              <path d={`M${c.x} ${c.y - 5} L${c.x - 5} ${c.y + 4} L${c.x + 5} ${c.y + 4} Z`}
                fill={`var(--${c.tone === 'amber' ? 'amber' : 'blue'})`} />
              <text className="svg-muted" x={c.x + 8} y={c.y + 3} fontSize="8">{c.rel}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="gp panel">
        <ViewHead icon="alert" title={t('radar.nearby')} sub={`4 ${t('radar.contacts')}`} />
        <div className="list">
          {TRAFFIC.map((c) => (
            <div key={c.id} className="list-row">
              <span className={`dot ${c.tone === 'amber' ? 'amber' : 'blue'}`} />
              <strong>{c.id}</strong>
              <span className="sub">{c.dist}</span>
              <span className={`v ${c.tone === 'amber' ? 'amber' : ''}`} style={{ marginLeft: 'auto' }}>{c.rel}</span>
              <span className="sub">{c.clo}</span>
            </div>
          ))}
        </div>
        <div className="note amber-note">
          <Glyph name="alert" size={16} /> {t('radar.note')}
        </div>
      </div>
    </div>
  )
}

// ---- Systems ---- (sistem adları standart, EN bırakıldı)
const SYS = [
  ['Engine 1', 'N1 92%', 88, 'green', 'activity'],
  ['Engine 2', 'N1 91%', 87, 'green', 'activity'],
  ['Electrical', 'AC/DC OK', 100, 'green', 'bolt'],
  ['Hydraulic', 'G·Y·B 3000', 96, 'green', 'droplet'],
  ['Fuel', '38.2 t · bal', 62, 'amber', 'droplet'],
  ['Pressurization', 'ΔP 8.1 psi', 78, 'amber', 'gauge'],
  ['Flight controls', 'Normal law', 100, 'green', 'plane'],
  ['APU', 'Available', 40, 'gray', 'settings'],
]
export function SystemsView() {
  const { t } = useLang()
  return (
    <div className="view">
      <ViewHead icon="stack" title={t('sys.title')} sub={t('sys.sub')} tone="green" />
      <div className="sys-grid">
        {SYS.map(([name, val, pct, tone, icon]) => (
          <div key={name} className="gp sys-card">
            <div className="sys-top"><Glyph name={icon} size={16} className={`${tone}-t`} /><span className="lbl">{name}</span><span className={`dot ${tone}`} style={{ marginLeft: 'auto' }} /></div>
            <div className="v" style={{ marginTop: 6 }}>{val}</div>
            <div className="bar-track" style={{ marginTop: 8 }}><div className="bar-fill" style={{ width: `${pct}%`, background: `var(--${tone === 'gray' ? 'dim' : tone})` }} /></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Weather ----
function MetarCard({ icao, role, raw, wind, vis, cloud, temp, qnh, tone, t }) {
  return (
    <div className="gp panel">
      <div className="st-head">
        <div><div className="v">{icao} <span className="sub">· {role}</span></div></div>
        <span className={`chip ${tone}-b`}>{tone === 'green' ? 'CAVOK-ish' : 'MARGINAL'}</span>
      </div>
      <div className="metar">{raw}</div>
      <div className="wx-grid">
        <div><p className="lbl">{t('wx.wind')}</p><span className="v">{wind}</span></div>
        <div><p className="lbl">{t('wx.vis')}</p><span className="v">{vis}</span></div>
        <div><p className="lbl">{t('wx.cloud')}</p><span className="v">{cloud}</span></div>
        <div><p className="lbl">{t('wx.temp')}</p><span className="v">{temp}</span></div>
        <div><p className="lbl">{t('wx.qnh')}</p><span className="v">{qnh}</span></div>
      </div>
    </div>
  )
}
export function WeatherView() {
  const { t } = useLang()
  return (
    <div className="view">
      <ViewHead icon="cloud" title={t('wx.title')} sub={t('wx.sub')} />
      <div className="two-col">
        <MetarCard t={t} icao="LFPG" role={t('wx.departure')} raw="LFPG 142200Z 27014KT 9999 FEW040 14/06 Q1018"
          wind="270/14 kt" vis="10 km" cloud="FEW 4000" temp="14°C" qnh="1018" tone="green" />
        <MetarCard t={t} icao="EGLL" role={t('wx.arrival')} raw="EGLL 142150Z 25022G30KT 6000 BKN012 12/09 Q1011"
          wind="250/22G30" vis="6 km" cloud="BKN 1200" temp="12°C" qnh="1011" tone="amber" />
      </div>
      <div className="gp panel">
        <ViewHead icon="wind" title={t('wx.enroute')} sub="FL370 · DVR — OCK" />
        <div className="list">
          <div className="list-row"><span className="dot amber" /><strong>{t('wx.turb')}</strong><span className="sub">{t('wx.turbv')}</span><span className="v amber" style={{ marginLeft: 'auto' }}>AVOID</span></div>
          <div className="list-row"><span className="dot green" /><strong>{t('wx.icing')}</strong><span className="sub">{t('wx.icingv')}</span><span className="v" style={{ marginLeft: 'auto' }}>OK</span></div>
          <div className="list-row"><span className="dot blue" /><strong>{t('wx.windaloft')}</strong><span className="sub">{t('wx.windaloftv')}</span><span className="v" style={{ marginLeft: 'auto' }}>−42</span></div>
        </div>
      </div>
    </div>
  )
}

// ---- Alerts (alarm değil bağlam) ----
const ALERTS = [
  ['amber',
    { tr: 'Yan rüzgâr artıyor — RWY 27R', en: 'Crosswind increasing — RWY 27R' },
    { tr: 'Gust artık 250/22G30, bileşen 18 kt sol.', en: 'Gusts now 250/22G30, component 18 kt left.' },
    { tr: 'Max demonstrated 38 kt için brief; RWY 27L değerlendir.', en: 'Brief for max demonstrated 38 kt; consider RWY 27L.' }, 86],
  ['blue',
    { tr: 'Geç iniş riski', en: 'Late descent risk' },
    { tr: 'Mevcut profil OCK’ta seni 1200 ft yüksek tutuyor.', en: 'Current path keeps you 1200 ft high at OCK.' },
    { tr: 'Şimdi alçalma iste veya TOD’da speedbrake ekle.', en: 'Request lower now or add speedbrake at TOD.' }, 78],
  ['green',
    { tr: 'Yakıt planında', en: 'Fuel on plan' },
    { tr: 'Tüketim planla 0.3 t içinde örtüşüyor. Yedek sağlam.', en: 'Burn matches plan within 0.3 t. Reserve intact.' },
    { tr: 'Aksiyon gerekmiyor.', en: 'No action required.' }, 97],
  ['amber',
    { tr: 'Kabin tırmanış hızı yüksek', en: 'Cabin rate elevated' },
    { tr: 'Kabin 480 fpm tırmanıyor, hedef 350 fpm.', en: 'Cabin climbing at 480 fpm vs 350 fpm target.' },
    { tr: 'İzle; level-off’ta normale dönmesi beklenir.', en: 'Monitor; expect normal at level-off.' }, 81],
]
export function AlertsView() {
  const { t, pick } = useLang()
  return (
    <div className="view">
      <ViewHead icon="bell" title={t('alerts.title')} sub={t('alerts.sub')} />
      <div className="alerts">
        {ALERTS.map(([tone, title, what, action, conf], i) => (
          <div key={i} className={`gp alert ${tone}`}>
            <div className="alert-head"><span className={`dot ${tone}`} /><strong>{pick(title)}</strong><span className="conf">{conf}%</span></div>
            <p className="alert-what">{pick(what)}</p>
            <p className="alert-action"><Glyph name="check" size={14} className={`${tone}-t`} /> {pick(action)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Settings ----
export function SettingsView({ theme, setTheme, units, setUnits }) {
  const { t, lang, setLang } = useLang()
  return (
    <div className="view narrow">
      <ViewHead icon="settings" title={t('set.title')} sub={t('set.sub')} />
      <SettingRow label={t('set.lang')} desc={t('set.langDesc')}>
        <Seg t={t} options={[['tr', null], ['en', null]]} value={lang} onChange={setLang} />
      </SettingRow>
      <SettingRow label={t('set.theme')} desc={t('set.themeDesc')}>
        <Seg t={t} options={[['dark', 'moon'], ['light', 'sun']]} value={theme} onChange={setTheme} />
      </SettingRow>
      <SettingRow label={t('set.units')} desc={t('set.unitsDesc')}>
        <Seg t={t} options={[['metric', null], ['imperial', null]]} value={units} onChange={setUnits} />
      </SettingRow>
      <SettingRow label={t('set.focus')} desc={t('set.focusDesc')}>
        <input type="range" min="0" max="100" defaultValue="70" className="slider" />
      </SettingRow>
      <SettingRow label={t('set.voice')} desc={t('set.voiceDesc')}>
        <Seg t={t} options={[['on', null], ['off', null]]} value="on" onChange={() => {}} />
      </SettingRow>
    </div>
  )
}
function SettingRow({ label, desc, children }) {
  return (
    <div className="gp set-row">
      <div><div className="v">{label}</div><div className="sub">{desc}</div></div>
      <div className="set-control">{children}</div>
    </div>
  )
}
function Seg({ options, value, onChange, t }) {
  return (
    <div className="seg">
      {options.map(([opt, icon]) => (
        <button key={opt} className={`seg-btn ${value === opt ? 'on' : ''}`} onClick={() => onChange(opt)}>
          {icon && <Glyph name={icon} size={15} />}{t('seg.' + opt)}
        </button>
      ))}
    </div>
  )
}

// ---- Profile ----
export function ProfileView() {
  const { t } = useLang()
  const rows = [
    [t('prof.hours'), '11,240'], [t('prof.ontype'), '3,180'], [t('prof.license'), 'ATPL(A)'],
    [t('prof.medical'), t('prof.medicalv')], [t('prof.lastsim'), '2026-05-12'], [t('prof.currency'), t('prof.currencyv')],
  ]
  return (
    <div className="view narrow">
      <ViewHead icon="user" title={t('prof.title')} sub={t('prof.sub')} />
      <div className="gp panel profile">
        <div className="avatar-lg">SY</div>
        <div>
          <div className="v" style={{ fontSize: 18 }}>Capt. S. Yılmaz</div>
          <div className="sub">{t('prof.role')}</div>
        </div>
      </div>
      <div className="prof-grid">
        {rows.map(([l, v]) => (
          <div key={l} className="gp sys-card"><p className="lbl">{l}</p><span className="v">{v}</span></div>
        ))}
      </div>
    </div>
  )
}

function ViewHead({ icon, title, sub, tone }) {
  return (
    <div className="view-head">
      <Glyph name={icon} className={tone ? `${tone}-t` : 'accent-t'} />
      <div><div className="v" style={{ fontSize: 17 }}>{title}</div><div className="sub">{sub}</div></div>
    </div>
  )
}
