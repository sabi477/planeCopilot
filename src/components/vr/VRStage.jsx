// AURA VR — gerçek WebXR uyumlu "kavisli ekran" modu.
//
// Neden yeniden yazıldı: eski sürüm kokpiti drei <Html transform> ile CANLI DOM
// olarak gösteriyordu. immersive-vr oturumunda (Quest) tarayıcı YALNIZ WebGL
// katmanını composite eder — DOM görünmez. Yani başlığa girince panel boş kalıyordu.
//
// Yeni yaklaşım: kokpit arayüzü ekran dışında canlı DOM olarak render edilir,
// html-to-image ile bir <canvas>'a rasterize edilip THREE.CanvasTexture olarak
// 3B ekran mesh'ine yansıtılır. Doku WebGL olduğundan VR başlığında DA görünür.
// Kumanda ışını (veya masaüstünde fare) ekrana pointer event gönderir; ışının
// vurduğu nokta UV → DOM koordinatına çevrilip gerçek bir tıklamaya dönüştürülür,
// böylece faz şeridi (Dynamic Focus Mode) dahil tüm panel gerçekten tıklanabilir.
// VR içinde 2B overlay görünmediğinden temel aksiyonlar için 3B butonlar eklendi.

import { useEffect, useLayoutEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { createXRStore, XR, XROrigin, useXR } from '@react-three/xr'
import * as THREE from 'three'
import { toCanvas } from 'html-to-image'
import { Dashboard } from '../Dashboard.jsx'
import { Glyph } from '../Glyph.jsx'
import { PHASES } from '../../data/phases.js'

const store = createXRStore()

const NAV = ['layout-dashboard', 'play', 'radar', 'stack', 'cloud', 'bell', 'settings']

// Fiziksel ekran boyutu (metre). Yükseklik yakalanan dokunun en-boy oranından türetilir.
const SCREEN_W = 3.4
const SCREEN_POS = [0, 1.5, -2.3]

// Yakalama kaynağı: ekran dışında render edilen canlı kokpit. Faz şeridi gerçek
// setCur ile bağlı olduğundan ışın tıklaması bu DOM'u günceller.
function CockpitScreen({ cur, setCur, theme, degraded }) {
  return (
    <div className="cockpit">
      <nav className="rail">
        <div className="rail-logo">AU</div>
        {NAV.map((icon, i) => (
          <div key={icon} className={`railb ${i === 0 ? 'on' : ''}`}><Glyph name={icon} /></div>
        ))}
        <div className="rail-spacer" />
        <div className="railb"><Glyph name={theme === 'dark' ? 'sun' : 'moon'} /></div>
        <div className="rail-avatar">SY</div>
        <div className="railb power"><Glyph name="power" /></div>
      </nav>
      <div className="main">
        <header className="topbar">
          <div className="tb-left">
            <span className="brand">AURA</span>
            <span className="brand-div" />
            <Glyph name="plane" className="accent-t" />
            <strong>AFR1742</strong>
            <span className="sub">A350-900 · F-WXYZ</span>
            <span className="chip accent">DASHBOARD</span>
          </div>
          <div className="tb-right">
            <span className="sub">UTC 14:22</span>
            <span className="sub">LCL 16:22</span>
            <span className="chip btn"><i className={`dot ${degraded ? 'amber' : 'green'}`} /> {degraded ? 'AURA DEGRADED' : 'AURA AKTİF'}</span>
            <span className="emer">EMER</span>
          </div>
        </header>
        <Dashboard cur={cur} setCur={setCur} degraded={degraded} />
      </div>
    </div>
  )
}

// 3B buton yüzeyi için canvas'a çizilmiş etiket dokusu (ağ/ font bağımlılığı yok,
// Türkçe karakterleri sistem fontuyla doğru çizer).
function makeLabelTexture(label, accent) {
  const W = 512, H = 168, r = 26, x = 6, y = 6, w = W - 12, h = H - 12
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
  ctx.fillStyle = accent ? 'rgba(45,212,191,0.94)' : 'rgba(15,27,34,0.94)'
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = accent ? 'rgba(67,224,205,1)' : 'rgba(255,255,255,0.18)'
  ctx.stroke()
  ctx.fillStyle = accent ? '#06302b' : '#e9eef6'
  ctx.font = '600 60px Inter, system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, W / 2, H / 2 + 4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

// Işın/fare ile tıklanabilen 3B buton. Hem masaüstü faresi hem XR kumandası
// R3F pointer event'lerini tetikler.
function VRButton({ position, label, accent, onClick }) {
  const [hover, setHover] = useState(false)
  const tex = useMemo(() => makeLabelTexture(label, accent), [label, accent])
  useEffect(() => () => tex.dispose(), [tex])
  return (
    <mesh
      position={position}
      scale={hover ? 1.07 : 1}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true) }}
      onPointerOut={() => setHover(false)}
    >
      <planeGeometry args={[0.62, 0.2]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} color={hover ? '#ffffff' : '#d7dfe9'} />
    </mesh>
  )
}

// Ekranın arkasındaki çerçeve + turkuaz kenar parıltısı.
function ScreenFrame({ height }) {
  return (
    <group position={SCREEN_POS}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[SCREEN_W + 0.22, height + 0.22]} />
        <meshBasicMaterial color="#0a1218" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[SCREEN_W + 0.42, height + 0.42]} />
        <meshBasicMaterial color="#123039" side={THREE.DoubleSide} toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// Kokpit dokusunu taşıyan ekran. onSelect'e ışının vurduğu yerel nokta iletilir.
function ScreenMesh({ texture, width, height, ready, onSelect }) {
  const ref = useRef()
  return (
    <mesh
      ref={ref}
      position={SCREEN_POS}
      onClick={(e) => { e.stopPropagation(); onSelect(e, ref.current) }}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={ready ? texture : null} color={ready ? '#ffffff' : '#0a1218'} toneMapped={false} />
    </mesh>
  )
}

// XR oturumu yokken (masaüstü) fareyle bakış; oturum açıkken kamera XR'a ait.
function DesktopControls() {
  const session = useXR((s) => s.session)
  if (session) return null
  return (
    <OrbitControls
      target={SCREEN_POS} enablePan={false}
      minDistance={1.4} maxDistance={7}
      minPolarAngle={0.55} maxPolarAngle={1.72}
      enableDamping dampingFactor={0.08}
    />
  )
}

// Yerel nokta / rect üzerinden ekran dışı DOM'da gerçek tıklamayı sentezle.
function dispatchClick(el, clientX, clientY) {
  const o = { bubbles: true, cancelable: true, clientX, clientY, view: window, button: 0 }
  const p = { ...o, pointerId: 1, pointerType: 'mouse', isPrimary: true }
  el.dispatchEvent(new PointerEvent('pointerdown', p))
  el.dispatchEvent(new MouseEvent('mousedown', o))
  el.dispatchEvent(new PointerEvent('pointerup', p))
  el.dispatchEvent(new MouseEvent('mouseup', o))
  el.dispatchEvent(new MouseEvent('click', o))
}

export function VRStage({ cur, setCur, theme, setTheme, degraded, setDegraded, onExit }) {
  const [supported, setSupported] = useState(null)
  const [note, setNote] = useState('')
  const [inSession, setInSession] = useState(false)
  const [ready, setReady] = useState(false)
  const [aspect, setAspect] = useState(1.6)
  const [scale, setScale] = useState(1)

  const hostRef = useRef(null)       // yakalanan (doğal 1320px) kokpit düğümü
  const busy = useRef(false)         // eşzamanlı yakalamayı engelle

  const screenH = SCREEN_W / aspect

  // Tek CanvasTexture + hedef canvas — her karede yeniden tahsis etme.
  const targetCanvas = useMemo(() => document.createElement('canvas'), [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(targetCanvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [targetCanvas])

  // Canlı DOM'u dokuya rasterize et.
  const capture = useCallback(async () => {
    const node = hostRef.current
    if (!node || busy.current) return
    busy.current = true
    try {
      // Google Fonts stylesheet'i cross-origin olduğundan gömülemez (CORS) ve
      // html-to-image her karede onu getirmeye çalışıp konsolu hatayla doldurur.
      // fontEmbedCSS:'' bu ağ çağrısını tamamen atlatır (skipFonts bu sürümde
      // onurlandırılmıyor). Metin sistem fontuyla çizilir — 'Inter', system-ui
      // zaten font yığınında, görsel fark yok; yakalama da çok daha hızlı.
      const c = await toCanvas(node, {
        pixelRatio: 1.75,
        cacheBust: false,
        skipFonts: true,
        fontEmbedCSS: '',
      })
      if (c.width && c.height) {
        targetCanvas.width = c.width
        targetCanvas.height = c.height
        targetCanvas.getContext('2d').drawImage(c, 0, 0)
        texture.needsUpdate = true
        setAspect(c.width / c.height)
        setReady(true)
      }
    } catch { /* bir kare atla, sonraki dener */ }
    finally { busy.current = false }
  }, [targetCanvas, texture])

  // Etkileşimden sonra değişikliği yakalamak için kısa seri.
  const bumpCapture = useCallback(() => {
    capture()
    setTimeout(capture, 130)
    setTimeout(capture, 340)
  }, [capture])

  // Işın vuruşu → ekran dışı DOM'da tıklama.
  const onSelect = useCallback((e, mesh) => {
    const node = hostRef.current
    if (!node || !mesh || !e.point) return
    const local = mesh.worldToLocal(e.point.clone())
    const u = THREE.MathUtils.clamp(local.x / SCREEN_W + 0.5, 0, 1)
    const v = THREE.MathUtils.clamp(local.y / screenH + 0.5, 0, 1)
    const rect = node.getBoundingClientRect()
    const x = rect.left + u * rect.width
    const y = rect.top + (1 - v) * rect.height
    const target = document.elementsFromPoint(x, y).find((el) => node.contains(el))
    if (target) dispatchClick(target, x, y)
    bumpCapture()
  }, [screenH, bumpCapture])

  // WebXR desteği.
  useEffect(() => {
    if (!navigator.xr) { setSupported(false); return }
    navigator.xr.isSessionSupported('immersive-vr').then(setSupported).catch(() => setSupported(false))
  }, [])

  // Oturum durumunu izle (overlay ipucu + kamera).
  useEffect(() => {
    setInSession(!!store.getState().session)
    return store.subscribe((s) => setInSession(!!s.session))
  }, [])

  // Ekran dışı düğümü görünüme sığdır — böylece elementsFromPoint tüm paneli
  // vurabilir (yakalama doğal 1320px'de kalır, bu yalnız isabet testini etkiler).
  useLayoutEffect(() => {
    const measure = () => {
      const node = hostRef.current
      if (!node) return
      const w = node.scrollWidth || 1320
      const h = node.scrollHeight || 820
      const s = Math.min(1, (window.innerWidth - 24) / w, (window.innerHeight - 24) / h)
      setScale(s > 0 ? s : 1)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // İlk yakalama + canlı kalp atışı (saat/animasyonlu widget'lar için).
  useEffect(() => {
    const t = setTimeout(capture, 90)
    const hb = setInterval(capture, 1200)
    return () => { clearTimeout(t); clearInterval(hb) }
  }, [capture])

  // Faz/durum/tema değişince hemen yeni kare al.
  useEffect(() => { bumpCapture() }, [cur, degraded, theme, bumpCapture])

  const enterVR = useCallback(async () => {
    try { await store.enterVR(); setNote('') }
    catch (e) { setNote('VR başlatılamadı: ' + (e?.message || e)) }
  }, [])

  const prevPhase = () => setCur(Math.max(0, cur - 1))
  const nextPhase = () => setCur(Math.min(PHASES.length - 1, cur + 1))

  // 3B buton satırı (VR içinde overlay görünmediğinden temel aksiyonlar burada).
  const buttons = [
    { label: '‹ Faz', fn: prevPhase },
    { label: 'Faz ›', fn: nextPhase },
    { label: 'Tema', fn: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { label: degraded ? 'AURA ✕' : 'AURA ✓', fn: () => setDegraded(!degraded), accent: true },
    { label: 'Çıkış', fn: onExit },
  ]
  const bStep = 0.7
  const bX0 = -((buttons.length - 1) * bStep) / 2

  return (
    <div className="vr-root">
      {/* Yakalama kaynağı — görünmez, ekran dışı; scale yalnız isabet testi içindir. */}
      <div className="vr-capture-host" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} aria-hidden="true">
        <div ref={hostRef} className="app vr-screen-app" data-theme={theme}>
          <CockpitScreen cur={cur} setCur={setCur} theme={theme} degraded={degraded} />
        </div>
      </div>

      <div className="vr-overlay">
        <div className="vr-brand">AURA · VR</div>
        <div className="vr-actions">
          {supported && <button className="vr-btn primary" onClick={enterVR}>VR’a Gir</button>}
          <button className="vr-btn" onClick={prevPhase}>‹ Faz</button>
          <button className="vr-btn" onClick={nextPhase}>Faz ›</button>
          <button className="vr-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>Tema</button>
          <button className="vr-btn" onClick={() => setDegraded(!degraded)}>{degraded ? 'AURA: kapalı' : 'AURA: açık'}</button>
          <button className="vr-btn" onClick={onExit}>← Kokpite dön</button>
        </div>
        <div className="vr-note">
          {supported === false
            ? 'immersive-VR desteklenmiyor — 3B önizleme aktif · sürükleyerek bak, panele/faz şeridine tıkla (gerçekten çalışır).'
            : (note || (inSession
              ? 'VR aktif — kumanda ışınıyla panele nişan al ve tetikle; faz şeridi çalışır.'
              : 'Sürükleyerek bak · panele tıkla · “VR’a Gir” ile Quest’te aynı ekrana geç.'))}
        </div>
      </div>

      <Canvas
        className="vr-canvas"
        camera={{ position: [0, 1.5, 2.4], fov: 55 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#05070b']} />
        <fog attach="fog" args={['#05070b', 8, 26]} />

        <XR store={store}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 6, 3]} intensity={0.6} />
          <pointLight position={[0, 3, 1]} intensity={20} distance={16} color="#2dd4bf" />

          <ScreenFrame height={screenH} />
          <ScreenMesh texture={texture} width={SCREEN_W} height={screenH} ready={ready} onSelect={onSelect} />

          <group position={[0, 0.3, -1.75]}>
            {buttons.map((b, i) => (
              <VRButton key={b.label + i} position={[bX0 + i * bStep, 0, 0]} label={b.label} accent={b.accent} onClick={b.fn} />
            ))}
          </group>

          <Grid
            position={[0, 0, -1]} args={[40, 40]}
            cellSize={0.6} cellThickness={0.6} cellColor="#12303a"
            sectionSize={3} sectionThickness={1} sectionColor="#1c5a63"
            fadeDistance={28} fadeStrength={1.4} infiniteGrid
          />

          <XROrigin position={[0, 0, 0]} />
          <DesktopControls />
        </XR>
      </Canvas>
    </div>
  )
}
