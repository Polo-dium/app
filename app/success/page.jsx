'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [step, setStep] = useState('loading') // 'loading' | 'confirmed'

  useEffect(() => {
    // Laisser 3s pour que le webhook Stripe traite le paiement
    const t = setTimeout(() => setStep('confirmed'), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#08080D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#E8E6E1',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      {/* Butterfly logo / animation */}
      <div style={{ position: 'relative', width: 100, height: 100, marginBottom: 36 }}>
        {step === 'loading' ? (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute', inset: 0,
                border: `1.5px solid rgba(139,107,239,${0.5 - i * 0.12})`,
                borderRadius: '50%',
                transform: `scale(${1 + i * 0.33})`,
                animation: `pulse 2s ease-in-out ${i * 0.35}s infinite`,
              }} />
            ))}
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 0.9; }
              }
              @keyframes popIn {
                0% { transform: scale(0.5); opacity: 0; }
                70% { transform: scale(1.15); }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
            }}>
              🦋
            </div>
          </>
        ) : (
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(107,203,142,0.12)',
            border: '1.5px solid rgba(107,203,142,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40,
            animation: 'popIn 0.5s ease-out',
          }}>
            ✓
          </div>
        )}
      </div>

      {step === 'loading' ? (
        <>
          <p style={{ fontSize: 11, color: '#8B6BEF', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 16 }}>
            ACTIVATION EN COURS…
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#E8E6E1', marginBottom: 10 }}>
            Paiement confirmé
          </h1>
          <p style={{ fontSize: 14, color: '#666', maxWidth: 360, lineHeight: 1.6 }}>
            Votre abonnement est en cours d'activation. Cela prend quelques secondes.
          </p>
        </>
      ) : (
        <>
          <p style={{ fontSize: 11, color: '#6BCB8E', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 16 }}>
            PREMIUM ACTIVÉ
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#E8E6E1', marginBottom: 10 }}>
            Bienvenue en Premium ! 🎉
          </h1>
          <p style={{ fontSize: 14, color: '#888', maxWidth: 380, lineHeight: 1.7, marginBottom: 32 }}>
            Votre abonnement est actif. Vous avez maintenant accès à toutes les fonctionnalités
            — analyses illimitées, débats IA sans restriction, modèle Claude avancé.
          </p>

          {/* Features list */}
          <div style={{
            background: 'rgba(139,107,239,0.06)',
            border: '1px solid rgba(139,107,239,0.2)',
            borderRadius: 14, padding: '18px 24px',
            marginBottom: 32, maxWidth: 340, width: '100%', textAlign: 'left',
          }}>
            {[
              { icon: '⚡', label: 'Analyses illimitées' },
              { icon: '🤖', label: 'Débat IA sans limite horaire' },
              { icon: '🔬', label: 'Modèle Claude Sonnet (Premium)' },
              { icon: '📊', label: 'Historique complet de vos analyses' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 13, color: '#C8C6C1' }}>{label}</span>
              </div>
            ))}
          </div>

          <a href="/" style={{
            display: 'inline-block',
            padding: '14px 32px', borderRadius: 12, textDecoration: 'none',
            background: 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
            color: '#fff', fontSize: 15, fontWeight: 600,
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Commencer à analyser →
          </a>
        </>
      )}

      {sessionId && (
        <p style={{ marginTop: 28, fontSize: 11, color: '#333', fontFamily: 'monospace' }}>
          Session : {sessionId.slice(0, 20)}…
        </p>
      )}
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#08080D',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#E8E6E1', fontFamily: 'system-ui, sans-serif',
      }}>
        <span style={{ fontSize: 28 }}>🦋</span>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
