// archive/debate/prompts/debate-laws.js
// ─────────────────────────────────────────────────────────
// Extrait de lib/daily-laws.js — archivé le 16/03/2026
// Fonction getDebateLaws pour le mode Débat "Loi A vs Loi B"
// ─────────────────────────────────────────────────────────

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

// Note: lawsData venait de `import lawsData from './example-laws.json'`
// dans lib/daily-laws.js — même source que getDailyLaws
