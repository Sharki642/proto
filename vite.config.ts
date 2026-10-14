import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Jede Seite der Website braucht hier einen Eintrag, damit sie im Build (npm run build)
// mit ausgeliefert wird. Im Dev-Server (npm run dev) laufen alle HTML-Dateien auch so.
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        ueberProto: 'ueber-proto.html',
      },
    },
  },
})