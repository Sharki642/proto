import './style.css'

// Elemente mit der Klasse "reveal" blenden beim Scrollen ein
const reveals = document.querySelectorAll<HTMLElement>('.reveal')

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      }
    }
  },
  { threshold: 0.15 },
)

reveals.forEach((el) => observer.observe(el))

// Jahreszahl im Footer automatisch setzen
const year = document.querySelector<HTMLElement>('#year')
if (year) {
  year.textContent = String(new Date().getFullYear())
}