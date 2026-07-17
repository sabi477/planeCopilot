import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Tek bir three kopyası kullan — @react-three/xr ve drei alt bağımlılıkları
  // farklı three sürümleri çekiyor ("Multiple instances of Three.js" uyarısı),
  // bu da r3f reconciler'ını ve texture bağlamayı bozuyor.
  resolve: { dedupe: ['three', '@react-three/fiber'] },
  server: { port: 5180, open: true }
})
