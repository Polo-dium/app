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
