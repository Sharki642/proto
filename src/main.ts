import './style.css'
import { initAscii } from './ascii'

// ASCII-Ränder links und rechts, die beim Scrollen mitwandern
initAscii(document.querySelector<HTMLCanvasElement>('#ascii'))

// Jahreszahl im Footer automatisch setzen
const year = document.querySelector<HTMLElement>('#year')
if (year) {
  year.textContent = String(new Date().getFullYear())
}