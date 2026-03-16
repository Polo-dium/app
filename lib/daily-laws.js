import lawsData from './example-laws.json'

/**
 * Renvoie 3 propositions du jour (gauche, droite, fun).
 * @param {number} pageOffset - incrément pour "voir d'autres" (0 = aujourd'hui)
 */
export function getDailyLaws(pageOffset = 0) {
  const today = new Date()
  const dayIndex = (Math.floor(today.getTime() / (1000 * 60 * 60 * 24)) + pageOffset) % 10

  const gauche = lawsData.laws.filter(l => l.category === 'gauche')[dayIndex]
  const droite = lawsData.laws.filter(l => l.category === 'droite')[dayIndex]
  const fun    = lawsData.laws.filter(l => l.category === 'fun')[dayIndex]

  return [gauche, droite, fun]
}

/**
 * Renvoie 2 proposals gauche (pour LOI A) + 2 proposals droite (pour LOI B).
 * @param {number} pageOffset - incrément pour "voir d'autres"
 */
export function getDebateLaws(pageOffset = 0) {
  const today = new Date()
  const base = Math.floor(today.getTime() / (1000 * 60 * 60 * 24)) + pageOffset

  const gauchePool = lawsData.laws.filter(l => l.category === 'gauche')
  const droitePool = lawsData.laws.filter(l => l.category === 'droite')
  const half = Math.floor(gauchePool.length / 2)

  return {
    gauche: [
      gauchePool[base % gauchePool.length],
      gauchePool[(base + half) % gauchePool.length],
    ],
    droite: [
      droitePool[base % droitePool.length],
      droitePool[(base + half) % droitePool.length],
    ],
  }
}
