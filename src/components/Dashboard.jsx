import { useMemo } from 'react'
import { PHASES } from '../data/phases.js'
import { SyntheticVision, RadialGauge, Compass, JogDial } from './Widgets.jsx'
import { FlightPlan } from './FlightPlan.jsx'
import { Glyph } from './Glyph.jsx'
import { useLang } from '../i18n.jsx'

export function Dashboard({ cur, setCur, degraded }) {
  const { t } = useLang()
  const phase = PHASES[cur]
  const isFocus = (id) => phase.focus.includes(id)
  // Degraded modda hiçbir prioritizasyon yok — her panel eşit, tam görünür.
  const cls = (...ids) => (degraded ? '' : ids.some(isFocus) ? 'focus' : 'dim')

  // Önceki fazların değerlerini taşı (her faz sadece değişenleri tanımlıyor).
  const merged = useMemo(() => {
    const acc = {}
    for (let i = 0; i <= cur; i++) Object.assign(acc, PHASES[i].set)
    return acc
  }, [cur])

  return (
    <>
      <div className="phase-rail">
        {PHASES.map((p, i) => (
          <button key={p.n}
            className={`phase ${i === cur ? 'on' : i < cur ? 'done' : ''}`}
            onClick={() => setCur(i)}>
            {p.n}
          </button>
        ))}
      </div>

      <div className="row-top">
        <SyntheticVision phase={{ ...phase, set: merged }} degraded={degraded} />

        <div className={`gp status ${cls('status')}`} data-card="status">
          <div className="st-head">
            <div><div className="v">AFR1742</div><div className="sub">A350-900 · live</div></div>
            <Glyph name="plane" className="accent-t" />
          </div>
          <Bar label={t('st.fuel')} value={merged.fuel} pct={merged.fuelPct ?? 100} color="var(--amber)" tone="amber" />
          <Bar label={t('st.alt')} value={merged.alt} pct={altPct(merged.alt)} color="var(--blue)" />
          <div className="gauge-mount"><RadialGauge gauge={degraded ? { val: 0, cap: 'AURA OFF', color: '#76829a' } : phase.gauge} /></div>
        </div>
      </div>

      <FlightPlan phaseIndex={cur} focused={isFocus('flightplan')} degraded={degraded} />

      <div className="row-mid">
        <div className={`gp metrics ${cls('metrics', 'pfd')}`} data-card="metrics">
          <div className="m-grid">
            <Metric l="Speed" v={merged.spd} u="kt" />
            <Metric l="Mach" v={merged.mach} />
            <Metric l="Alt" v={merged.alt} />
            <Metric l="V/S" v={merged.vs} u="fpm" />
            <Metric l="Ground" v={merged.gs} u="kt" />
            <Metric l="ETA" v={cur < 3 ? '—' : '16:58'} />
          </div>
          <div className="trend">
            <svg viewBox="0 0 70 22" width="74" height="22">
              <polyline points={cur >= 9 && cur <= 11 ? '0,6 12,8 24,9 36,12 48,13 60,16 70,17' : '0,14 12,12 24,15 36,9 48,11 60,6 70,8'}
                fill="none" stroke="var(--blue)" strokeWidth="1.5" />
            </svg>
            <span className="sub">V/S trend · {cur >= 9 && cur <= 11 ? 'descending' : 'stable'}</span>
          </div>
        </div>

        <div className={`gp dial ${cls('dial')}`} data-card="dial">
          <span className="lbl">Autopilot</span>
          <JogDial appr={phase.appr} />
        </div>

        <div className={`gp compass ${cls('compass')}`} data-card="compass">
          <Compass hdg={merged.hdg ?? 0} />
        </div>
      </div>

      <div className="config">
        <ConfigChip id="flaps" label="Flaps" value={merged.flaps} focused={isFocus('flaps')} degraded={degraded} />
        <ConfigChip id="gear" label="Gear" value={merged.gear} focused={isFocus('gear')} degraded={degraded} />
        <ConfigChip id="thrust" label="Thrust" value={merged.thrust} focused={isFocus('thrust')} degraded={degraded} />
        <ConfigChip id="spoilers" label="Spoilers" value={merged.spoilers} focused={isFocus('spoilers')} degraded={degraded} />
        <ConfigChip id="autobrake" label="Autobrake" value={merged.autobrake} focused={isFocus('autobrake')} degraded={degraded} />
        <ConfigChip id="apu" label="APU" value={merged.apu} focused={isFocus('apu')} degraded={degraded} />
        <ConfigChip id="weather" label="Xwind" value={merged.xwind} focused={isFocus('weather')} degraded={degraded} />
        <ConfigChip id="pressurization" label="Cabin" value={merged.cabin} focused={isFocus('pressurization')} degraded={degraded} />
      </div>
    </>
  )
}

function ConfigChip({ id, label, value, focused, degraded }) {
  const [text, tone] = value || ['—', 'gray']
  // Dikkat gerektiren (amber/red) durum asla sönmez — bilgi gizlenmez.
  const elevated = tone === 'amber' || tone === 'red'
  const state = degraded ? '' : focused ? 'focus' : elevated ? '' : 'dim'
  return (
    <div className={`cc ${state}`} data-card={id}>
      <p className="lbl">{label}</p>
      <span className={`v ${tone}`}>{text}</span>
    </div>
  )
}

function Metric({ l, v, u }) {
  return <div className="metric"><p className="lbl">{l}</p><span className="v">{v}</span>{u && <span className="unit"> {u}</span>}</div>
}

function Bar({ label, value, pct, color, tone }) {
  return (
    <div className="bar">
      <div className="bar-head"><span className="sub">{label}</span><span className={`v ${tone || ''}`}>{value}</span></div>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.max(6, pct)}%`, background: color }} /></div>
    </div>
  )
}

function altPct(alt) {
  if (!alt) return 50
  const n = parseInt(String(alt).replace(/\D/g, '')) || 0
  return Math.min(100, String(alt).includes('FL') ? n / 4 : n / 80)
}
