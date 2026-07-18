// AURA VR — "kavisli ekran" modu (sağlam hibrit render).
//
// İki ortam, iki yol — beyaz/boş ekran riskini tamamen ortadan kaldırmak için:
//
// 1) MASAÜSTÜ (herhangi bir tarayıcı, Safari dahil): kokpit, 3B grid backdrop'un
//    ÜZERİNDE merkezi, düz, etkileşimli bir DOM paneli olarak gösterilir. Hiç
//    WebGL'e/rasterize'a/CSS3D matrix'e bağlı değildir → her tarayıcıda birebir
//    çalışır, faz şeridi (Dynamic Focus Mode) doğrudan tıklanabilir. Beyaz ekran
//    imkânsız.  (Neden gerekli: html-to-image bazı tarayıcılarda — özellikle
//    Safari — <foreignObject> canvas'ını taint eder/boş üretir; masaüstünde ona
//    hiç bel bağlamayız.)
//
// 2) GERÇEK BAŞLIK (immersive-vr): tarayıcı yalnız WebGL katmanını composite
//    eder, DOM görünmez. Bu yüzden yalnız oturum içinde kokpit ekran-dışı canlı
//    DOM'dan html-to-image ile bir CanvasTexture'a rasterize edilip 3B ekran
//    mesh'ine yansıtılır (Quest tarayıcısı Chromium tabanlı, orada çalışır).
//    Kumanda ışını UV → DOM eşlemesiyle panele tıklamayı sağlar.

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

// VR ekran mesh'i (yalnız immersive yol) fiziksel boyutu (metre).
const SCREEN_W = 3.4
const SCREEN_H = 2.0
const SCREEN_POS = [0, 1.5, -2.3]

// Kokpit arayüzü. Masaüstünde görünür panel, immersive'de ekran-dışı yakalama kaynağı.
// Faz şeridi gerçek setCur ile bağlı olduğundan her iki yolda da tıklanabilir.
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

// 3B buton yüzeyi için canvas'a çizilmiş etiket dokusu (ağ/font bağımlılığı yok).
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

// Işın/fare ile tıklanabilen 3B buton (immersive'de temel aksiyonlar).
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

// Ekranın arkasındaki çerçeve + turkuaz kenar parıltısı (immersive yol).
function ScreenFrame() {
  return (
    <group position={SCREEN_POS}>
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[SCREEN_W + 0.22, SCREEN_H + 0.22]} />
        <meshBasicMaterial color="#0a1218" side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.08]}>
        <planeGeometry args={[SCREEN_W + 0.42, SCREEN_H + 0.42]} />
        <meshBasicMaterial color="#123039" side={THREE.DoubleSide} toneMapped={false} transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

// Immersive yol: kokpit dokusunu taşıyan ekran. onSelect'e ışının yerel noktası iletilir.
function ScreenMesh({ texture, ready, onSelect }) {
  const ref = useRef()
  return (
    <mesh
      ref={ref}
      position={SCREEN_POS}
      onClick={(e) => { e.stopPropagation(); onSelect(e, ref.current) }}
    >
      <planeGeometry args={[SCREEN_W, SCREEN_H]} />
      <meshBasicMaterial map={ready ? texture : null} color={ready ? '#ffffff' : '#0a1218'} toneMapped={false} />
    </mesh>
  )
}

// XR oturumu yokken (masaüstü) fareyle backdrop'a bakış; oturum açıkken kamera XR'a ait.
function DesktopControls() {
  const session = useXR((s) => s.session)
  if (session) return null
  return (
    <OrbitControls
      target={[0, 1, -3]} enablePan={false}
      minDistance={1.4} maxDistance={9}
      minPolarAngle={0.7} maxPolarAngle={1.6}
      enableDamping dampingFactor={0.08}
    />
  )
}

// Yerel nokta / rect üzerinden ekran-dışı DOM'da gerçek tıklamayı sentezle (immersive yol).
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
  const [scale, setScale] = useState(1)

  const hostRef = useRef(null)       // immersive: ekran-dışı yakalanan kokpit düğümü
  const busy = useRef(false)

  // Immersive yolu için tek CanvasTexture + hedef canvas.
  const targetCanvas = useMemo(() => document.createElement('canvas'), [])
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(targetCanvas)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [targetCanvas])

  // Canlı DOM'u dokuya rasterize et (YALNIZ immersive oturumda çağrılır).
  const capture = useCallback(async () => {
    const node = hostRef.current
    if (!node || busy.current) return
    busy.current = true
    try {
      const c = await toCanvas(node, { pixelRatio: 1.75, cacheBust: false, skipFonts: true, fontEmbedCSS: '' })
      if (c.width && c.height) {
        targetCanvas.width = c.width
        targetCanvas.height = c.height
        targetCanvas.getContext('2d').drawImage(c, 0, 0)
        texture.needsUpdate = true
        setReady(true)
      }
    } catch { /* bir kare atla */ }
    finally { busy.current = false }
  }, [targetCanvas, texture])

  const bumpCapture = useCallback(() => {
    capture()
    setTimeout(capture, 130)
    setTimeout(capture, 340)
  }, [capture])

  // Immersive yol: ışın vuruşu → ekran-dışı DOM'da tıklama.
  const onSelect = useCallback((e, mesh) => {
    const node = hostRef.current
    if (!node || !mesh || !e.point) return
    const local = mesh.worldToLocal(e.point.clone())
    const u = THREE.MathUtils.clamp(local.x / SCREEN_W + 0.5, 0, 1)
    const v = THREE.MathUtils.clamp(local.y / SCREEN_H + 0.5, 0, 1)
    const rect = node.getBoundingClientRect()
    const x = rect.left + u * rect.width
    const y = rect.top + (1 - v) * rect.height
    const target = document.elementsFromPoint(x, y).find((el) => node.contains(el))
    if (target) dispatchClick(target, x, y)
    bumpCapture()
  }, [bumpCapture])

  // WebXR desteği.
  useEffect(() => {
    if (!navigator.xr) { setSupported(false); return }
    navigator.xr.isSessionSupported('immersive-vr').then(setSupported).catch(() => setSupported(false))
  }, [])

  // Oturum durumunu izle — masaüstü/immersive yolunu belirler.
  useEffect(() => {
    setInSession(!!store.getState().session)
    return store.subscribe((s) => setInSession(!!s.session))
  }, [])

  // Kokpit panelini görünüme sığdıran ölçek (hem masaüstü görünür panel hem
  // immersive ekran-dışı isabet testi için doğal ~1364×800 kutu).
  useLayoutEffect(() => {
    const measure = () => {
      const w = 1364, h = 800
      const s = Math.min(1, (window.innerWidth - 40) / w, (window.innerHeight - 130) / h)
      setScale(s > 0 ? s : 1)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Immersive yol yakalaması: ilk kare + kalp atışı. Masaüstünde html-to-image HİÇ çalışmaz.
  useEffect(() => {
    if (!inSession) return
    const t = setTimeout(capture, 90)
    const hb = setInterval(capture, 1200)
    return () => { clearTimeout(t); clearInterval(hb) }
  }, [inSession, capture])

  // Immersive yolda faz/tema/durum değişince yeni kare al.
  useEffect(() => { if (inSession) bumpCapture() }, [cur, degraded, theme, inSession, bumpCapture])

  const enterVR = useCallback(async () => {
    try { await store.enterVR(); setNote('') }
    catch (e) { setNote('VR başlatılamadı: ' + (e?.message || e)) }
  }, [])

  const prevPhase = () => setCur(Math.max(0, cur - 1))
  const nextPhase = () => setCur(Math.min(PHASES.length - 1, cur + 1))

  // 3B buton satırı — immersive içinde (overlay görünmez) temel aksiyonlar.
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
      {/* MASAÜSTÜ: kokpit düz, merkezi, etkileşimli DOM paneli (backdrop üstünde). */}
      {!inSession && (
        <div className="vr-desktop-stage">
          <div className="vr-cockpit-fit" style={{ transform: `scale(${scale})` }}>
            <div className="app vr-screen-app" data-theme={theme}>
              <CockpitScreen cur={cur} setCur={setCur} theme={theme} degraded={degraded} />
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE: ekran-dışı yakalama kaynağı (görünmez), dokuya rasterize edilir. */}
      {inSession && (
        <div className="vr-capture-host" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} aria-hidden="true">
          <div ref={hostRef} className="app vr-screen-app" data-theme={theme}>
            <CockpitScreen cur={cur} setCur={setCur} theme={theme} degraded={degraded} />
          </div>
        </div>
      )}

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
            ? 'immersive-VR desteklenmiyor — masaüstü önizleme: panele/faz şeridine doğrudan tıkla, boşluğu sürükleyip ortama bak.'
            : (note || (inSession
              ? 'VR aktif — kumanda ışınıyla panele nişan al ve tetikle; faz şeridi çalışır.'
              : 'Panele doğrudan tıkla · boşluğu sürükleyip ortama bak · “VR’a Gir” ile Quest’e geç.'))}
        </div>
      </div>

      <Canvas
        className="vr-canvas"
        camera={{ position: [0, 1.5, 2.4], fov: 55 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#05070b']} />
        <fog attach="fog" args={['#05070b', 9, 30]} />

        <XR store={store}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 6, 3]} intensity={0.6} />
          <pointLight position={[0, 3, 1]} intensity={20} distance={16} color="#2dd4bf" />

          {/* Immersive'de gerçek 3B ekran + çerçeve + 3B butonlar; masaüstünde yalnız backdrop. */}
          {inSession && (
            <>
              <ScreenFrame />
              <ScreenMesh texture={texture} ready={ready} onSelect={onSelect} />
              <group position={[0, 0.3, -1.75]}>
                {buttons.map((b, i) => (
                  <VRButton key={b.label + i} position={[bX0 + i * bStep, 0, 0]} label={b.label} accent={b.accent} onClick={b.fn} />
                ))}
              </group>
            </>
          )}

          <Grid
            position={[0, 0, -1]} args={[40, 40]}
            cellSize={0.6} cellThickness={0.6} cellColor="#12303a"
            sectionSize={3} sectionThickness={1} sectionColor="#1c5a63"
            fadeDistance={30} fadeStrength={1.4} infiniteGrid
          />

          <XROrigin position={[0, 0, 0]} />
          <DesktopControls />
        </XR>
      </Canvas>
    </div>
  )
}
