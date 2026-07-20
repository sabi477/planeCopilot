import { useState, useEffect, useRef } from 'react'
import { SCENARIOS } from '../data/scenarios.js'
import { Glyph } from './Glyph.jsx'
import { JogDial } from './Widgets.jsx'
import { useLang } from '../i18n.jsx'

const SEVC = { info: 'blue', good: 'green', caution: 'amber', warning: 'red' }

export function Scenarios({ ctrlRef }) {
  const { t, pick: px } = useLang()
  const [sel, setSel] = useState(0)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef(null)
  const sc = SCENARIOS[sel]
  const last = sc.steps.length - 1
  const cur = sc.steps[step]
  // Bazı senaryolar (iniş öncesi checklist) son adımda AURA JogDial'ı otomatik fren/flap
  // teyidiyle senkron gösterir — adım o noktaya ulaşınca gösterge yanar ve öyle kalır.
  const jogIdx = sc.steps.findIndex((s) => s.jogdial)

  // Otomatik oynatma
  useEffect(() => {
    if (!playing) return
    if (step >= last) { setPlaying(false); return }
    timer.current = setTimeout(() => setStep((s) => s + 1), 2600)
    return () => clearTimeout(timer.current)
  }, [playing, step, last])

  const choose = (i) => { setSel(i); setStep(0); setPlaying(false) }
  const go = (i) => { setStep(Math.max(0, Math.min(last, i))); setPlaying(false) }

  // Sesli komutla adım kontrolü (App.jsx → runCommand) — her render'da güncel tutulur.
  const matches = (text, phrases) => phrases?.some((p) => text.includes(p))
  useEffect(() => {
    if (!ctrlRef) return
    ctrlRef.current = {
      next: () => go(step + 1),
      prev: () => go(step - 1),
      restart: () => { setStep(0); setPlaying(false) },
      // Gerçek callout'u sırasıyla söyleyerek ilerlet — adım atlanamaz.
      sayCallout: (text) => {
        if (step >= last) return { ok: null }
        const nextStep = sc.steps[step + 1]
        if (matches(text, nextStep.voice)) {
          go(step + 1)
          return { ok: true, msg: `✓ ${nextStep.t}`, tone: 'accent' }
        }
        for (let i = step + 2; i <= last; i++) {
          if (matches(text, sc.steps[i].voice)) {
            return { ok: false, msg: `sıra bu değil — önce "${nextStep.t}" callout'u lazım`, tone: 'warn' }
          }
        }
        return { ok: null }
      },
    }
  })

  return (
    <div className="view">
      <div className="view-head">
        <Glyph name="play" className="accent-t" />
        <div><div className="v" style={{ fontSize: 17 }}>{t('scn.title')}</div>
          <div className="sub">{t('scn.sub')}</div></div>
      </div>

      <div className="scn-layout">
        <div className="scn-list">
          {SCENARIOS.map((s, i) => (
            <button key={s.id} className={`gp scn-item ${i === sel ? 'on' : ''}`} onClick={() => choose(i)}>
              <span className={`scn-ic ${SEVC[s.severity]}-bg`}><Glyph name={s.icon} size={18} /></span>
              <span className="scn-meta">
                <span className="scn-title">{px(s.title)}</span>
                <span className="sub">{px(s.subtitle)}</span>
              </span>
              <span className={`tag ${SEVC[s.severity]}`}>{t('sev.' + s.severity)}</span>
            </button>
          ))}
        </div>

        <div className="scn-player">
          <div className="gp scn-stage">
            <div className="scn-stage-top">
              <span className={`tag ${SEVC[cur.sev]}`}>{cur.t}</span>
              <div className="scn-ctrl">
                <button className="ico-btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous"><Glyph name="chevron-left" size={18} /></button>
                <button className="ico-btn primary" onClick={() => { if (step >= last) { setStep(0); setPlaying(true) } else setPlaying(!playing) }} aria-label="Play">
                  <Glyph name={playing ? 'pause' : step >= last ? 'replay' : 'play'} size={18} />
                </button>
                <button className="ico-btn" onClick={() => go(step + 1)} disabled={step === last} aria-label="Next"><Glyph name="chevron-right" size={18} /></button>
              </div>
            </div>

            <div className={`scn-card ${SEVC[cur.sev]}`}>
              <div className="scn-card-head">
                <span className={`dot ${SEVC[cur.sev]}`} />
                <strong>{px(cur.title)}</strong>
                {cur.sev === 'warning'
                  ? <span className="scn-directive">{t('scn.directive')}</span>
                  : cur.conf != null && <span className="scn-conf">{cur.conf}%</span>}
              </div>
              <Field label={t('scn.what')} text={px(cur.what)} />
              <Field label={t('scn.why')} text={px(cur.why)} />
              <div className="scn-action">
                <Glyph name="check" size={15} className={`${SEVC[cur.sev]}-t`} />
                <span>{cur.action}</span>
              </div>
              {cur.conf != null && cur.sev !== 'warning' && (
                <div className="scn-confbar">
                  <span className="sub">{t('scn.conf')}</span>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${cur.conf}%`, background: `var(--${SEVC[cur.sev]})` }} /></div>
                </div>
              )}
            </div>

            {Object.keys(cur.m || {}).length > 0 && (
              <div className="scn-metrics">
                {Object.entries(cur.m).map(([k, v]) => (
                  <div key={k} className="scn-metric"><p className="lbl">{k}</p><span className="v">{v}</span></div>
                ))}
              </div>
            )}

            {jogIdx !== -1 && (
              <div className="scn-jogdial">
                <span className="lbl">AURA JogDial · Autobrake / Flaps</span>
                <JogDial appr autobrakeReady={step >= jogIdx} flapsReady={step >= jogIdx} />
              </div>
            )}
          </div>

          <div className="gp scn-timeline">
            <div className="scn-tl-head"><span className="lbl">{t('scn.timeline')}</span><span className="sub">{step + 1} / {sc.steps.length}</span></div>
            <div className="scn-steps">
              {sc.steps.map((s, i) => (
                <button key={i} className={`scn-step ${i === step ? 'on' : i < step ? 'past' : ''}`} onClick={() => go(i)}>
                  <span className={`scn-step-dot ${SEVC[s.sev]}`} />
                  <span className="scn-step-t">{s.t}</span>
                  <span className="scn-step-title">{px(s.title)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, text }) {
  return (
    <div className="scn-field">
      <p className="lbl">{label}</p>
      <p className="scn-field-text">{text}</p>
    </div>
  )
}
