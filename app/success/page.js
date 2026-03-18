'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, Crown, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return }

    fetch('/api/stripe/verify-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    })
      .then(r => r.json())
      .then(d => setStatus(d.ok ? 'success' : 'error'))
      .catch(() => setStatus('error'))
  }, [sessionId])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto" />
            <p className="text-white/70">Activation de votre abonnement...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto">
              <Crown className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white">Bienvenue en Premium !</h1>
            <div className="bg-card rounded-xl border border-yellow-500/20 p-6 text-left space-y-3">
              <p className="text-sm font-semibold text-yellow-400 uppercase tracking-widest">Vos avantages</p>
              {['Analyses illimitées', 'Explications illimitées', 'Carte d\'implications illimitée', 'Débat IA illimité', 'Accès prioritaire aux nouvelles fonctionnalités'].map(a => (
                <div key={a} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />{a}
                </div>
              ))}
            </div>
            <Button onClick={() => router.push('/')} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold">
              Commencer à explorer →
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-400 mx-auto" />
            <h1 className="text-xl font-bold text-white">Une erreur est survenue</h1>
            <p className="text-white/60 text-sm">Si vous avez été débité, contactez le support — votre accès sera activé manuellement.</p>
            <Button onClick={() => router.push('/')} variant="outline" className="w-full border-white/20">
              Retour à l'accueil
            </Button>
          </>
        )}
      </div>
    </main>
  )
}
