import { useState } from 'react'
import { FLIGHTPLAN, PHASE_LEG } from '../data/scenarios.js'
import { useLang } from '../i18n.jsx'

// Tıklanabilir uçuş planı. Aktif bacak vurgulanır, geçilenler sönük,
// gelecek noktalar nötr. Bir noktaya tıklayınca detay paneli açılır.
export function FlightPlan({ phaseIndex, focused, degraded }) {
  const { t, pick } = useLang()
  const activeLeg = PHASE_LEG[phaseIndex]
  const [selected, setSelected] = useState(null)
  const wp = selected != null ? FLIGHTPLAN[selected] : null

  const legState = (i) => {
    if (i < activeLeg) return 'past'
    if (i === activeLeg) return 'active'
    return 'future'
  }

  return (
    <div className={`gp fpl ${degraded ? '' : focused ? 'focus' : 'dim'}`} data-card="flightplan">
      <div className="fpl-head">
        <span className="lbl">{t('fpl.header')}</span>
        <span className="sub">{FLIGHTPLAN.length} {t('fpl.click')}</span>
      </div>
      <div className="fpl-track">
        {FLIGHTPLAN.map((w, i) => (
          <button
            key={w.id}
            className={`wpt ${legState(i)} ${w.kind} ${selected === i ? 'sel' : ''}`}
            onClick={() => setSelected(selected === i ? null : i)}
          >
            <span className="wpt-node" />
            <span className="wpt-name">{w.kind === 'tod' ? 'TOD' : w.id}</span>
            {i < FLIGHTPLAN.length - 1 && <span className={`leg ${legState(i)}`} />}
          </button>
        ))}
      </div>
      {wp && (
        <div className="wpt-detail">
          <div className="wd-top">
            <strong>{wp.id}</strong>
            <span className="sub">{pick(wp.note)}</span>
            <button className="wd-close" onClick={() => setSelected(null)}>×</button>
          </div>
          <div className="wd-grid">
            <div><p className="lbl">{t('fpl.distleg')}</p><span className="v">{wp.dist} nm</span></div>
            <div><p className="lbl">{t('fpl.constraint')}</p><span className="v">{wp.alt}</span></div>
            <div><p className="lbl">{t('fpl.speed')}</p><span className="v">{wp.spd}</span></div>
            <div><p className="lbl">{t('fpl.eta')}</p><span className="v">{wp.eta}</span></div>
            <div><p className="lbl">{t('fpl.fuel')}</p><span className="v">{wp.fuel}</span></div>
            <div><p className="lbl">{t('fpl.status')}</p><span className="v accent-t">
              {selected < PHASE_LEG[phaseIndex] ? t('fpl.passed')
                : selected === PHASE_LEG[phaseIndex] ? t('fpl.active') : t('fpl.ahead')}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
