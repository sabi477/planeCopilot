import { useEffect, useRef, useState, useCallback } from 'react'

// Tarayıcının Web Speech API'siyle (SpeechRecognition) sesli komut altyapısı.
// Sürekli dinler, tanınan her cümleyi küçük harfe çevirip onResult'a verir.
// Örn. "tekerler hazır" -> komut eşleştirici gear çipini vurgular.
export function useVoice({ lang = 'tr-TR', onResult, onError } = {}) {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recRef = useRef(null)
  // Callback'leri ref'te tut; recognition'ı yalnızca bir kez kuruyoruz,
  // böylece her render'da eski closure'a takılmadan güncel handler'ı çağırırız.
  const onResultRef = useRef(onResult)
  const onErrorRef = useRef(onError)
  onResultRef.current = onResult
  onErrorRef.current = onError

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const supported = !!SR

  useEffect(() => {
    if (!SR) return
    const rec = new SR()
    rec.lang = lang
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let finalText = ''
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interim += r[0].transcript
      }
      setTranscript((finalText || interim).trim())
      if (finalText) onResultRef.current?.(finalText.trim().toLowerCase())
    }
    rec.onerror = (e) => { onErrorRef.current?.(e.error); setListening(false) }
    rec.onend = () => setListening(false)
    recRef.current = rec
    return () => { try { rec.stop() } catch {} }
  }, [lang]) // eslint-disable-line

  const start = useCallback(() => {
    if (!recRef.current || listening) return
    setTranscript('')
    try { recRef.current.start(); setListening(true) } catch {}
  }, [listening])

  const stop = useCallback(() => {
    try { recRef.current?.stop() } catch {}
    setListening(false)
  }, [])

  const toggle = useCallback(() => (listening ? stop() : start()), [listening, start, stop])

  return { listening, transcript, supported, start, stop, toggle }
}

// Bir data-card öğesini geçici olarak vurgular (sesli "tıklama" geri bildirimi).
export function pulseCard(cardId, delay = 140) {
  setTimeout(() => {
    const el = document.querySelector(`[data-card="${cardId}"]`)
    if (!el) return
    el.classList.add('voice-hit')
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => el.classList.remove('voice-hit'), 1600)
  }, delay)
}
