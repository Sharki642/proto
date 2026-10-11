// ASCII-Ränder: links und rechts neben dem Text laufen schwarze Zeichen-Wellen,
// ähnlich wie das Signal auf einem Oszilloskop. Die Wellen hängen direkt an deinem
// Scrollen: Sie wandern und verformen sich mit jedem Scroll-Schritt, werden dicker
// und unruhiger, je schneller du scrollst, und driften im Stillstand leicht weiter.

const RAMP = ' .:-=+*#%@' // dünn → dicht
const GLITCH = '01#*+=:' // Zeichen, die bei schnellem Scrollen aufblitzen
const CONTENT_WIDTH = 896 // muss zu max-w-4xl im HTML passen
const CONTENT_PADDING = 24 // px-6 im HTML
const GAP = 12 // Abstand zwischen Rand und Text in px
const MIN_COLS = 4 // schmalere Ränder (Handy, kleines Fenster) bleiben leer
const MAX_COLS = 28 // so viele Zeichen breit ist ein Rand höchstens
const FONT_SIZE = 15
const LINE_HEIGHT = 18
const PARALLAX = 0.6 // 1 = so schnell wie die Seite, kleiner = langsamer
const SCROLL_PHASE = 0.012 // wie stark Scrollen die Wellen verformt

interface Trace {
  amp: number // Ausschlag in Bruchteilen der Randbreite
  freq: number // Wellen pro Zeile
  speed: number // wie schnell sich die Welle beim Scrollen verschiebt (Vorzeichen = Richtung)
  offset: number
  width: number // Dicke der Spur
}

const TRACES: Trace[] = [
  { amp: 0.34, freq: 0.115, speed: 1.0, offset: 0.0, width: 1.0 },
  { amp: 0.24, freq: 0.19, speed: -1.6, offset: 2.1, width: 0.8 },
  { amp: 0.3, freq: 0.067, speed: 0.7, offset: 4.2, width: 1.2 },
]

// Stabiler Zufallswert pro Zelle (0 bis 1), damit nichts unkontrolliert flackert
function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function initAscii(canvas: HTMLCanvasElement | null): void {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const centers = new Float64Array(TRACES.length)

  let width = 0
  let height = 0
  let cellW = FONT_SIZE * 0.6
  let cols = 0
  let ink = '#000'
  let scrollY = window.scrollY
  let lastScrollY = scrollY
  let energy = 0 // 0 = Ruhe, 1 = schnelles Scrollen
  let lastDraw = 0
  let raf = 0
  let scrollQueued = false

  function draw(now: number): void {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    if (cols === 0) return

    // Bei "weniger Bewegung" gibt es kein Eigenleben und kein Aufblitzen,
    // die Wellen folgen aber weiterhin deinem Scrollen.
    const reduced = reduceMotion.matches
    const t = reduced ? 0 : now / 1000
    const phase = scrollY * SCROLL_PHASE + t * 0.25
    const frame = energy > 0.05 && !reduced ? Math.floor(now / 70) : 0

    const base = (scrollY * PARALLAX) / LINE_HEIGHT
    const baseRow = Math.floor(base)
    const frac = base - baseRow
    const rows = Math.ceil(height / LINE_HEIGHT) + 1
    const mid = (cols - 1) / 2
    const swing = cols * (1 + energy * 0.3)
    const sigmaBase = 0.7 + energy * 1.2
    const thin = Math.max(0.4, Math.min(1, cols / 14)) // schmale Ränder bekommen dünnere Spuren

    ctx.fillStyle = ink
    ctx.globalAlpha = 1

    for (let row = 0; row < rows; row++) {
      const rr = row + baseRow // Zeile im "Welt"-Raster, damit das Muster mitwandert
      const y = (row - frac) * LINE_HEIGHT

      for (let side = 0; side < 2; side++) {
        // Wo liegt jede Spur in dieser Zeile?
        for (let i = 0; i < TRACES.length; i++) {
          const tr = TRACES[i]
          centers[i] =
            mid + Math.sin(rr * tr.freq + phase * tr.speed + tr.offset + side * 1.9) * tr.amp * swing
        }

        for (let c = 0; c < cols; c++) {
          // c = 0 ist ganz außen am Fensterrand, zum Text hin wird es dünner
          const fall = Math.min(1, (1 - c / cols) * 2.2)

          let g = 0
          for (let i = 0; i < TRACES.length; i++) {
            const d = c - centers[i]
            const sigma = (sigmaBase + TRACES[i].width * 0.5) * thin
            const v = Math.exp(-(d * d) / (2 * sigma * sigma))
            if (v > g) g = v
          }
          g *= fall

          let ch = ''
          if (g > 0.12) {
            ch = RAMP.charAt(Math.round(g * (RAMP.length - 1)))
            // Beim Scrollen blitzen einzelne Zeichen der Spur auf
            if (frame > 0 && hash(c + side * 53, rr + frame) < energy * 0.45) {
              ch = GLITCH.charAt(Math.floor(hash(c * 7 + side, rr * 3 + frame) * GLITCH.length))
            }
          } else {
            // vereinzelte Bits abseits der Spuren als Elektronik-Gruß
            const h = hash(c + side * 101, rr)
            if (h > 0.965 && fall > 0.25) ch = h > 0.9825 ? '1' : '0'
          }

          if (ch === '') continue
          const px = side === 0 ? c * cellW : width - (c + 1) * cellW
          ctx.fillText(ch, px, y)
        }
      }
    }
  }

  function resize(): void {
    if (!ctx || !canvas) return
    const dpr = window.devicePixelRatio || 1
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    ctx.font = `700 ${FONT_SIZE}px ${getComputedStyle(document.body).fontFamily}`
    ctx.textBaseline = 'top'
    cellW = ctx.measureText('M').width || FONT_SIZE * 0.6
    ink = getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim() || '#000'

    // Platz links und rechts neben dem Text
    const textWidth = Math.min(width, CONTENT_WIDTH) - CONTENT_PADDING * 2
    const band = (width - textWidth) / 2 - GAP
    const fit = Math.floor(band / cellW)
    cols = fit >= MIN_COLS ? Math.min(MAX_COLS, fit) : 0
    draw(performance.now())
  }

  function tick(now: number): void {
    raf = requestAnimationFrame(tick)
    if (now - lastDraw < 1000 / 30) return // 30 Bilder pro Sekunde reichen
    lastDraw = now

    scrollY = window.scrollY
    const velocity = Math.abs(scrollY - lastScrollY)
    lastScrollY = scrollY
    energy += (Math.min(1, velocity / 20) - energy) * 0.15
    draw(now)
  }

  function onScroll(): void {
    if (scrollQueued) return
    scrollQueued = true
    requestAnimationFrame(() => {
      scrollQueued = false
      scrollY = window.scrollY
      draw(performance.now())
    })
  }

  function start(): void {
    cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll)
    energy = 0
    if (reduceMotion.matches) {
      // Weniger Bewegung gewünscht: nur zeichnen, wenn du scrollst
      window.addEventListener('scroll', onScroll, { passive: true })
      draw(performance.now())
    } else {
      raf = requestAnimationFrame(tick)
    }
  }

  window.addEventListener('resize', resize)
  reduceMotion.addEventListener('change', start)
  resize()
  start()
  // Nach dem Laden der Schrift neu messen, damit die Zeichenbreite stimmt
  void document.fonts.ready.then(resize)
}