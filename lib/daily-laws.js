import lawsData from './example-laws.json'

export function getDailyLaws() {
  const today = new Date()
  const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24)) % 10

  const gauche = lawsData.laws.filter(l => l.category === 'gauche')[dayIndex]
  const droite = lawsData.laws.filter(l => l.category === 'droite')[dayIndex]
  const fun = lawsData.laws.filter(l => l.category === 'fun')[dayIndex]

  return [gauche, droite, fun]
}
