# AURA — Component Dokümanı

Kısa referans: her dosyanın ne işe yaradığı, hangi prop/state'leri taşıdığı ve
diğer parçalarla nasıl konuştuğu. Detaylı ürün açıklaması için [README.md](README.md).

## Proje özeti

AURA, gerçek uçuş aletlerinin yerine geçmeyen, AI destekli bir kokpit karar-destek
ekranı konseptidir (Vite + React, `/Users/sabihayilmaz/planeCopilot`). Amaç: pilotun
"şu an ne önemli, sıradaki aksiyon ne" sorusunu 2 saniyede yanıtlamak. İmza özelliği
**Dynamic Focus Mode** — kokpit layout'u sabit 1320px genişlikte hiç değişmez, ama
uçuş fazına göre hangi panelin öne çıkacağı (turkuaz `focus`) ve hangisinin söneceği
(`dim`) değişir. Tek sayfa uygulama: route yok, her şey `App.jsx`'teki `view` ve `cur`
(aktif faz) state'iyle yönetiliyor. TR/EN iki dilli, light/dark tema, ve tarayıcı
tabanlı sesli komut desteği var.

## Kabuk

### `src/App.jsx`
Uygulamanın kökü. Global state'i tutar ve tüm görünümleri (view) buradan seçip render eder.
- **State**: `lang`, `theme`, `view` (aktif ekran), `cur` (aktif uçuş fazı index'i),
  `units`, `powerOff` (kapatma modalı), `auraOk` (AURA aktif/degraded), `voiceMsg` (toast).
- **`runCommand(text)`**: tanınan sesli cümleyi bir aksiyona eşleyen komut yönlendirici
  (bkz. [Sesli komut](#sesli-komut--srcvoicejsx)).
- Sol ikon rayı, üst bar (uçuş no, saat, mic butonu, AURA durumu, EMER) ve `powerOff`
  onay modalını da burada render eder.
- Görünüm arasında geçiş yalnızca `view` state'iyle olur — route/URL yok.

### `src/i18n.jsx`
Basit TR/EN sözlük altyapısı. `LangContext` ile dil global state olarak taşınır.
- `useLang()` → `{ lang, setLang, t, pick }`. `t('key')` sabit metinleri, `pick({tr,en})`
  iki dilli veri objelerini (örn. `phases.js` içindeki `why`) çözer.
- Havacılık terimleri (Flaps, Gear, V1, METAR, FMA modları) bilinçli olarak her iki dilde
  de İngilizce bırakılır.

### `src/voice.jsx` — Sesli komut
Tarayıcının Web Speech API'si (`SpeechRecognition`) üzerine ince bir hook.
- **`useVoice({ lang, onResult, onError })`**: mikrofonu sürekli dinler, `continuous: true`,
  `interimResults: true`. Final (kesinleşmiş) her cümleyi küçük harfe çevirip `onResult`'a verir.
  Döndürdüğü değerler: `listening`, `transcript` (canlı metin), `supported` (tarayıcı desteği),
  `start`, `stop`, `toggle`.
- **`pulseCard(cardId)`**: `data-card="..."` ile işaretli bir paneli geçici olarak turkuaz
  vurgulayıp (`.voice-hit` animasyonu) ekrana kaydırır — sesli komutun "tıkladığını" gösterir.
- Eşleştirme mantığı burada değil, `App.jsx → runCommand`'da yaşar; `voice.jsx` sadece
  ham metni sağlar. Desteklenen örnek komutlar: `"tekerler hazır"` (gear vurgusu), faz adları
  (`"kalkış"`, `"seyir"`, `"iniş"`…), navigasyon (`"senaryolar"`, `"trafik"`, `"ayarlar"`…),
  tema (`"koyu tema"`, `"açık tema"`). Tanınmayan cümlede uyarı tonlu toast gösterilir.
- UI tarafı: üst bardaki `Sesli komut` çipi (`App.jsx`), tıklanınca `voice.toggle()` çağırır;
  dinlerken canlı transcript'i gösterir ve nabız animasyonuyla yanar (`.chip.mic.live`).
  Tarayıcı desteklemiyorsa (`supported === false`) çip hiç render edilmez.
- Gerçek mikrofon erişimi gerektirdiği için `localhost`/HTTPS ve tarayıcı izni şart;
  headless/otomasyon ortamlarında test edilemez.

## Görünümler (`view` state'ine göre `App.jsx` içinden seçilir)

### `src/components/Dashboard.jsx`
Ana kokpit ekranı — **Dynamic Focus Mode**'un uygulandığı yer.
- Props: `cur`, `setCur` (aktif faz), `degraded` (AURA kapalıysa true).
- `PHASES[cur].focus` listesine göre panellere `focus`/`dim` class'ı verir; `degraded`
  modda hiçbir önceliklendirme yapılmaz, her şey eşit görünür.
- Önceki fazların `set` değerlerini `useMemo` ile birleştirir (her faz sadece değişeni tanımlar).
- İçerdiği alt-bileşenler: faz şeridi, `SyntheticVision`, status/gauge kartı, `FlightPlan`,
  metrikler, `JogDial`, `Compass`, konfigürasyon çipleri (`ConfigChip`).

### `src/components/Scenarios.jsx`
Adım adım oynatılan karar-destek senaryoları (`SCENARIOS` verisinden, bkz. `data/scenarios.js`).
- Local state: `sel` (seçili senaryo), `step`, `playing` (otomatik oynatma, 2.6 sn/adım).
- Sol liste + sağda `scn-stage` (ne oldu / neden önemli / aksiyon / AURA güveni) ve zaman
  çizelgesi. Play/pause/prev/next kontrolleri var.

### `src/components/Views.jsx`
Beş bağımsız, state'i basit görünüm burada tek dosyada toplanmış:
- `RadarView` — TCAS scope (SVG) + yakın trafik listesi, sabit `TRAFFIC` verisi.
- `SystemsView` — motor/elektrik/hidrolik/yakıt vb. sistem sağlığı kartları, sabit `SYS` verisi.
- `WeatherView` — kalkış/varış METAR kartları + enroute uyarılar.
- `AlertsView` — AURA tavsiyeleri (alarm değil bağlam), sabit `ALERTS` verisi.
- `SettingsView` — dil/tema/birim/focus hassasiyeti/sesli çağrı ayarları. Props: `theme`,
  `setTheme`, `units`, `setUnits` (dil kendi context'inden okur).
- `ProfileView` — pilot profili, statik.
- Ortak yardımcı: `ViewHead` (ikon + başlık + alt yazı).

## Alt-bileşenler

### `src/components/FlightPlan.jsx`
Tıklanabilir uçuş planı şeridi. Props: `phaseIndex`, `focused`, `degraded`.
- `PHASE_LEG[phaseIndex]`'e göre her waypoint `past`/`active`/`future` durumunda gösterilir.
- Bir waypoint'e tıklayınca detay paneli açılır: mesafe, irtifa kısıtı, hız, ETA, yakıt, durum.

### `src/components/Widgets.jsx`
Kokpitin SVG tabanlı küçük göstergeleri, hepsi prop'larla güncellenen "dumb" bileşenler:
- `SyntheticVision` — arka plan bulut fotoğrafı + faz adına göre pitch kaydırması, HUD
  overlay'leri (SYNTH VIS, LIVE, TERR/TFC/WX çipleri) ve AURA "sıradaki aksiyon" kartı.
- `RadialGauge` — tek değerli yarım daire gösterge (props: `{ val, cap, color }`), fazına
  göre anlamı değişir (RANGE OK, TOD NOW, STABILIZED…).
- `Compass` — heading ibresi, `hdg` prop'una göre döner.
- `JogDial` — otopilot mod halkası (VNAV/LNAV/APPR/A-THR), `appr` prop'una göre aktif modu değişir.

### `src/components/Glyph.jsx`
Tek noktadan ikon seti. `PATHS` sözlüğünde isim → SVG path stringi eşlemesi var;
`<Glyph name="..." size={20} className="..." />` şeklinde kullanılır. Yeni ikon eklemek
için sadece `PATHS`'e bir satır eklemek yeterli.

## Veri katmanı

### `src/data/phases.js`
**Dynamic Focus Mode**'un kalbi. 14 uçuş fazının (`Cold & Dark` → `Shutdown`) her biri için:
`focus` (öne çıkacak `data-card` id'leri), `action` + `why` (AURA önerisi), `gauge`
(radial gösterge değeri), `set` (o fazda değişen PFD/konfigürasyon değerleri, birikimli).

### `src/data/scenarios.js`
`SCENARIOS` — Scenarios ekranındaki 6 demo senaryonun adım adım verisi (severity, başlık,
metrikler, iki dilli metinler). Ayrıca `FLIGHTPLAN` (7 waypoint) ve `PHASE_LEG`
(her fazda aktif bacak index'i) burada tanımlı — `FlightPlan.jsx` ve `Dashboard.jsx` kullanır.

## Buton & akış haritası

### Sol ikon rayı (`App.jsx`, her ekranda sabit)
| Buton | Aksiyon |
|---|---|
| **AU** logosu | dekoratif, tıklanmaz |
| 7 nav ikonu (dashboard/senaryo/radar/sistem/hava/uyarı/ayar) | `setView(id)` → o ekrana geçer |
| Güneş/Ay | `setTheme(...)` → light/dark anında değişir |
| Avatar **SY** | `setView('profile')` → pilot profili |
| Güç ikonu | `setPowerOff(true)` → onay modalını açar |

### Üst bar (`App.jsx`, her ekranda sabit)
| Buton | Aksiyon |
|---|---|
| 🎙 **Sesli komut** çipi | `voice.toggle()` → mikrofonu aç/kapat; dinlerken canlı transcript + nabız animasyonu gösterir (tarayıcı desteklemezse çip hiç render olmaz) |
| **AURA AKTİF/DEVRE DIŞI** çipi | `setAuraOk(!auraOk)` → demo amaçlı degraded moda geçirir: Dashboard'daki tüm focus/dim önceliklendirmesi ve "sıradaki aksiyon" kartı devre dışı kalır, gauge `AURA OFF` gösterir |
| **EMER** | dekoratif, henüz bağlı bir aksiyonu yok |

### Dashboard (`Dashboard.jsx`)
| Buton | Aksiyon |
|---|---|
| Faz şeridi (14 buton: Cold & Dark → Shutdown) | `setCur(i)` → **Dynamic Focus Mode akışı**: faz değişir → `PHASES[cur]` yeniden okunur → ilgili panellere `focus` class'ı, geri kalanına `dim` → PFD değerleri, radial gauge, "sıradaki aksiyon" metni ve senkron olarak flight plan'daki aktif bacak güncellenir |
| Flight plan waypoint'leri (`FlightPlan.jsx`) | tıkla → detay paneli açılır (mesafe/kısıt/hız/ETA/yakıt/durum); tekrar tıkla veya **×** → kapanır |

### Scenarios (`Scenarios.jsx`)
| Buton | Aksiyon |
|---|---|
| Senaryo listesi (6 kart) | `choose(i)` → senaryo değişir, adım 0'a ve duraklatmaya döner |
| ‹ / play-pause-replay / › | adım geri/ileri, oynat/duraklat; sonuna gelince ▶ ikonu `replay`'e döner ve baştan başlatır |
| Zaman çizelgesi adımları | `go(i)` → doğrudan o adıma atlar, oynatmayı durdurur |

### Settings (`Views.jsx → SettingsView`)
| Buton | Aksiyon |
|---|---|
| Dil segmenti (TR/EN) | `setLang(...)` → tüm arayüz metinleri anında çevrilir |
| Tema segmenti | `setTheme(...)` — rail'deki toggle ile aynı state |
| Birim segmenti | `setUnits(...)` (şu an sadece state, ekranlara henüz yansımıyor) |
| Focus hassasiyeti slider'ı | görsel, henüz state'e bağlı değil |
| Sesli çağrı aç/kapa | görsel, henüz state'e bağlı değil |

### Kapatma modalı (`App.jsx`)
| Buton | Aksiyon |
|---|---|
| Vazgeç | modalı kapatır, hiçbir şey değişmez |
| Emniyete al & kapat | modalı kapatır, `view` → dashboard, `cur` → 0 (Cold & Dark) |

### Sesli komut akışı (uçtan uca)
Mikrofonu aç (üst bar) → cümleyi söyle → `voice.jsx` final metni küçük harfe çevirip
`App.jsx → runCommand`'a verir → anahtar kelime eşleşmesine göre: view değiştirir,
faz atlar, tema değiştirir veya `pulseCard('gear')` gibi bir paneli vurgular → sonucu
ekranın altında 3.2 saniyelik bir toast ile bildirir (`voiceMsg`). Eşleşme yoksa uyarı
tonlu "komut tanınmadı" toast'ı çıkar.

## Dosya haritası (özet)

```
src/
├── App.jsx              kabuk: state, nav, sesli komut yönlendirme, modal
├── i18n.jsx              TR/EN sözlük + context
├── voice.jsx              useVoice hook + pulseCard (sesli komut altyapısı)
├── components/
│   ├── Dashboard.jsx     ana kokpit + Dynamic Focus mantığı
│   ├── Scenarios.jsx      adım adım senaryo oynatıcı
│   ├── Views.jsx          Radar / Systems / Weather / Alerts / Settings / Profile
│   ├── FlightPlan.jsx      tıklanabilir uçuş planı
│   ├── Widgets.jsx         SyntheticVision, RadialGauge, Compass, JogDial
│   └── Glyph.jsx           ikon seti
└── data/
    ├── phases.js           14 uçuş fazı tanımı
    └── scenarios.js        senaryolar + flight plan + phase-leg eşlemesi
```
