// Alles, was jede Seite der Website braucht: Styles, ASCII-Ränder, Jahreszahl im Footer.
import './style.css'
import { initAscii } from './ascii'

export function initPage(): void {
  // ASCII-Ränder links und rechts, die beim Scrollen mitwandern
  initAscii(document.querySelector<HTMLCanvasElement>('#ascii'))

  // Jahreszahl im Footer automatisch setzen
  const year = document.querySelector<HTMLElement>('#year')
  if (year) {
    year.textContent = String(new Date().getFullYear())
  }
}