'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function getCookieConsent() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/cookie_consent=(\w+)/)
  return match ? match[1] : null
}

function setCookieConsent(value) {
  const maxAge = 13 * 30 * 24 * 60 * 60 // ~13 mois (max CNIL)
  document.cookie = `cookie_consent=${value};max-age=${maxAge};path=/;SameSite=Lax`
  document.cookie = `cookie_consent_date=${new Date().toISOString()};max-age=${maxAge};path=/;SameSite=Lax`
}

function loadAnalytics() {
  // Placeholder — sera activé lors de l'intégration d'un outil analytics
  console.log('Analytics consent granted — ready for integration')
}

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [customize, setCustomize] = useState(false)
  const [analytics, setAnalytics] = useState(true)

  useEffect(() => {
    if (!getCookieConsent()) setShow(true)

    const handler = () => { setShow(true); setCustomize(false) }
    window.addEventListener('showCookieConsent', handler)
    return () => window.removeEventListener('showCookieConsent', handler)
  }, [])

  const accept = () => {
    setCookieConsent('accepted')
    loadAnalytics()
    setShow(false)
  }

  const refuse = () => {
    setCookieConsent('refused')
    setShow(false)
  }

  const saveCustom = () => {
    setCookieConsent(analytics ? 'accepted' : 'custom')
    if (analytics) loadAnalytics()
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="max-w-2xl mx-auto bg-card/95 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-2xl">
            {!customize ? (
              <>
                <p className="text-sm text-white/80 mb-4 leading-relaxed">
                  Ce site utilise des cookies essentiels (authentification, session) et, avec votre accord, des cookies analytiques.{' '}
                  <a href="/confidentialite#cookies" className="underline text-blue-400 hover:text-blue-300 transition-colors">
                    En savoir plus
                  </a>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={refuse}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Refuser
                  </button>
                  <button
                    onClick={() => setCustomize(true)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Personnaliser
                  </button>
                  <button
                    onClick={accept}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-colors"
                  >
                    Accepter
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-white mb-4">Gestion des cookies</p>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">Cookies essentiels</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Authentification, session, préférence cookies</p>
                    </div>
                    <span className="text-xs text-green-400 font-medium shrink-0 ml-4">Toujours actifs</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-white">Cookies analytiques</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Mesure d'audience anonymisée</p>
                    </div>
                    <button
                      onClick={() => setAnalytics(!analytics)}
                      className={`relative shrink-0 ml-4 w-10 h-5 rounded-full transition-colors duration-200 ${analytics ? 'bg-blue-600' : 'bg-white/20'}`}
                      aria-label={analytics ? 'Désactiver les cookies analytiques' : 'Activer les cookies analytiques'}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                        style={{ transform: analytics ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => setCustomize(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-sm text-white/80 hover:bg-white/10 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={saveCustom}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-colors"
                  >
                    Enregistrer mes choix
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
