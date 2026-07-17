# AURA — Adaptive Unified Response Assistant

AURA, AI destekli bir kokpit karar-destek ekranı konseptidir. Mevcut uçuş aletlerinin yerine
geçmez; pilotun "şu an ne önemli, sıradaki aksiyon ne" sorularını 2 saniyede yanıtlamasını amaçlar.
Adı: **A**daptive **U**nified **R**esponse **A**ssistant.

## Öne çıkan: Dynamic Focus Mode
Layout sabit kalır, **bilgi hiyerarşisi uçuş fazına göre değişir**. Üstteki faz şeridinden
bir faz seçtiğinde ilgili paneller/çipler turkuazla öne çıkar, gerisi sönükleşir; AI'nin
"Next action" önerisi, radial gauge ve PFD değerleri otomatik güncellenir.

- Radial gauge fazına göre anlam değiştirir: cruise → `RANGE OK`, descent → `TOD NOW`,
  approach → `STABILIZED` skoru, landing → `ON G/S`.
- **Tıklanabilir flight plan**: waypoint'lere tıkla → mesafe, constraint, ETA, yakıt detayı.
  Aktif bacak vurgulu, geçilenler sönük, TOD ayrı işaretli.

## Çalıştırma
```bash
npm install
npm run dev      # http://localhost:5180
```
Build: `npm run build` → `dist/`

## Görünümler (sol ikon rayı)
Soldaki rayın tüm butonları çalışır:
- **Flight deck** — ana kokpit + Dynamic Focus + flight plan
- **Traffic** — TCAS trafik kapsamı ve yakın uçak listesi
- **Systems** — tüm uçak sistemleri sağlık özeti
- **Weather** — kalkış/varış METAR + enroute uyarıları
- **Advisories** — AI tavsiyeleri (alarm yerine bağlam: ne oldu / neden / aksiyon / güven)
- **Settings** — tema (light/dark), birimler, Focus hassasiyeti
- Avatar → **pilot profili**, güç düğmesi → secure & power down modalı

## Tema
Light + dark mode. Üç yerden değiştirilebilir: sol raydaki güneş/ay butonu, üst bardaki
hızlı toggle, veya Settings. Tüm renkler CSS değişkenleriyle (`.app[data-theme]`) tanımlı.

## Yapı
- `src/data/phases.js` — faz tanımları (focus listesi, next action, gauge, PFD değerleri) + flight plan
- `src/App.jsx` — kabuk: ikon rayı, üst bar, görünüm/tema state'i
- `src/components/Dashboard.jsx` — ana kokpit + Dynamic Focus mantığı
- `src/components/Views.jsx` — Traffic / Systems / Weather / Advisories / Settings / Profile
- `src/components/Widgets.jsx` — sentetik görüş, radial gauge, pusula, jog-dial
- `src/components/FlightPlan.jsx` — tıklanabilir uçuş planı
- `src/components/Glyph.jsx` — ikon seti
- `src/styles.css` — cam (glassmorphism) tema + light/dark değişkenleri

## Sonraki adımlar (henüz yok)
- Transient focus: olay tetikli geçici odak (örn. cruise'da rüzgâr uyarısı kartı öne fırlar)
- Gerçek zamanlı interpolasyonlu PFD animasyonu / otomatik faz ilerlemesi
- Waypoint tıklamada AI'ya soru sorma
