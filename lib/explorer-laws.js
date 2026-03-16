// lib/explorer-laws.js
// ─────────────────────────────────────────────────────────
// Sélection quotidienne de vrais textes législatifs
// pour l'onglet Explorer (rotation différente chaque jour)
// ─────────────────────────────────────────────────────────

import lawsData from './explorer-laws.json'

/**
 * Renvoie 3 lois réelles tirées du pool, différentes chaque jour.
 * Utilise un décalage (offset) pour éviter les répétitions avec getDailyLaws().
 * @returns {Array} 3 lois du pool
 */
/**
 * @param {number} pageOffset - incrément pour "voir d'autres" (0 = aujourd'hui)
 */
export function getDailyExplorerLaws(pageOffset = 0) {
  const laws = lawsData.laws
  const dayIndex = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) + pageOffset

  const total = laws.length
  const step = Math.floor(total / 3)

  const i0 = dayIndex % total
  const i1 = (dayIndex + step) % total
  const i2 = (dayIndex + step * 2) % total

  return [laws[i0], laws[i1], laws[i2]]
}
