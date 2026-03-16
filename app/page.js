'use client'

import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Share2, RotateCcw, Sparkles, TrendingUp, Heart, Leaf, AlertTriangle, Trophy, Skull, History, Award, Swords, ChevronRight, X, Star, User, LogOut, Crown, Lock, Mail, Clock, MessageSquare, Send, Facebook, Instagram, Copy, Download, Check, Wrench, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import html2canvas from 'html2canvas'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { getDailyLaws } from '@/lib/daily-laws'
import SharePanel from '@/components/SharePanel'

// Auth Context
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  
  useEffect(() => {
    const supabase = createClient()
    
    if (!supabase) {
      setLoading(false)
      setSupabaseConfigured(false)
      return
    }
    
    setSupabaseConfigured(true)
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchProfile(session.user.id, supabase)
      } else {
        setLoading(false)
      }
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchProfile(session.user.id, supabase)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])
  
  const fetchProfile = async (userId, supabase) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
  }
  
  const signInWithGoogle = async () => {
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }
  
  const signInWithEmail = async (email) => {
    const supabase = createClient()
    if (!supabase) return { error: { message: 'Supabase non configuré' } }
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
    return { error }
  }
  
  const signOut = async () => {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }
  
  const getAccessToken = async () => {
    const supabase = createClient()
    if (!supabase) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }
  
  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signOut, getAccessToken, isPremium: profile?.is_premium || false, supabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  return useContext(AuthContext)
}

// Icons
function ButterflyIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 12V3" />
      <path d="M5.5 7c-.8-1.3-2.1-2-3.5-2 2.4 0 4.5 2 4.5 4.5 0 3-2.5 5.5-5.5 5.5 2.2 0 4.3-1.3 5.5-3.5" />
      <path d="M18.5 7c.8-1.3 2.1-2 3.5-2-2.4 0-4.5 2-4.5 4.5 0 3 2.5 5.5 5.5 5.5-2.2 0-4.3-1.3-5.5-3.5" />
      <path d="M12 12c-2 1.5-3 4-3 6" />
      <path d="M12 12c2 1.5 3 4 3 6" />
    </svg>
  )
}

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function triggerConfetti(score) {
  if (score >= 70) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#2563eb', '#ffffff', '#ef4444'] })
  }
}

// Loading states
const LOADING_MESSAGES = ["Analyse macro-économique en cours...", "Calcul des impacts sociaux...", "Évaluation écologique...", "Recherche de l'effet papillon...", "Compilation des résultats..."]

function AnalysisLoader() {
  const [messageIndex, setMessageIndex] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length), 2000)
    return () => clearInterval(interval)
  }, [])
  return (
    <motion.div className="flex flex-col items-center justify-center py-12 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
        <ButterflyIcon className="w-16 h-16 text-blue-400" />
      </motion.div>
      <motion.p key={messageIndex} className="text-lg text-muted-foreground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {LOADING_MESSAGES[messageIndex]}
      </motion.p>
    </motion.div>
  )
}

// Auth Modal
function AuthModal({ open, onClose }) {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const handleEmailSignIn = async () => {
    if (!email) return
    setLoading(true)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (!error) setSent(true)
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">Connexion à Butterfly.gov</DialogTitle>
          <DialogDescription>Connectez-vous pour sauvegarder vos lois et débloquer plus de tests</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!sent ? (
            <>
              <Button onClick={signInWithGoogle} className="w-full bg-white text-black hover:bg-gray-100">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Continuer avec Google
              </Button>
              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">ou</span></div></div>
              <div className="space-y-2">
                <Input type="email" placeholder="votre@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background" />
                <Button onClick={handleEmailSignIn} disabled={!email || loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Recevoir un lien magique
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <Mail className="w-12 h-12 mx-auto text-blue-400" />
              <p className="text-lg font-medium">Email envoyé !</p>
              <p className="text-sm text-muted-foreground">Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Soft Wall
function SoftWall({ userTier, resetAt, onSignIn, onUpgrade }) {
  const timeUntilReset = Math.max(0, Math.ceil((new Date(resetAt) - new Date()) / 60000))
  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className="max-w-md w-full bg-card rounded-2xl p-6 border border-white/10 space-y-6" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-2"><Clock className="w-8 h-8 text-red-400" /></div>
          <h2 className="text-2xl font-bold">Limite atteinte</h2>
          <p className="text-muted-foreground">{userTier === 'anonymous' ? "Vous avez épuisé vos 5 tests gratuits de l'heure." : "Vous avez atteint votre limite de 10 tests de l'heure."}</p>
        </div>
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Prochain reset dans</p>
          <p className="text-3xl font-bold text-blue-400">{timeUntilReset} min</p>
        </div>
        <div className="space-y-3">
          {userTier === 'anonymous' && <Button onClick={onSignIn} className="w-full bg-blue-600 hover:bg-blue-500"><User className="w-4 h-4 mr-2" />Créer un compte gratuit (+5 tests/h)</Button>}
          <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black"><Crown className="w-4 h-4 mr-2" />Passer Premium (2,99€/mois) - Illimité</Button>
          <p className="text-xs text-center text-muted-foreground">Premium = Tests illimités + Débat IA illimité (sans limite de 10/h)</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Premium Badge
function PremiumBadge() {
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold"><Crown className="w-3 h-3" />PREMIUM</span>
}

// User Menu
function UserMenu() {
  const { user, profile, signOut, isPremium, getAccessToken } = useAuth()
  const [open, setOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const handleUnsubscribe = async () => {
    if (!confirm('Êtes-vous sûr de vouloir résilier votre abonnement Premium ?')) return
    setCanceling(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Abonnement résilié. Votre accès Premium reste actif jusqu\'à la fin de la période.')
        setOpen(false)
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la résiliation')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setCanceling(false)
    }
  }

  if (!user) return null
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-white/10 hover:border-blue-500/50 transition-colors">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center text-white font-bold text-sm">{user.email?.[0]?.toUpperCase() || 'U'}</div>
        {isPremium && <PremiumBadge />}
      </button>
      {open && (
        <motion.div className="absolute right-0 top-12 w-64 bg-card rounded-lg border border-white/10 shadow-xl overflow-hidden z-50" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="p-4 border-b border-white/10"><p className="font-medium truncate">{user.email}</p><p className="text-sm text-muted-foreground">{isPremium ? 'Citoyen Premium' : 'Compte gratuit'}</p></div>
          <div className="p-2">
            {isPremium && (
              <button onClick={handleUnsubscribe} disabled={canceling} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-left text-sm text-red-400 disabled:opacity-50">
                <X className="w-4 h-4" />{canceling ? 'Résiliation...' : 'Se désabonner'}
              </button>
            )}
            <a href={`mailto:boutarin.paul@gmail.com?subject=Support Butterfly.gov&body=Bonjour,%0A%0AMon compte : ${user.email}%0A%0A`} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm text-muted-foreground hover:text-white transition-colors">
              <Mail className="w-4 h-4" />Support
            </a>
            <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm"><LogOut className="w-4 h-4" />Déconnexion</button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Share Buttons Component
function ShareButtons({ cardRef, lawText, result }) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
  
  const captureAndDownload = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#111111', scale: 2 })
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'butterfly-gov-score.png'
        a.click()
        URL.revokeObjectURL(url)
        resolve(blob)
      })
    })
  }
  
  const shareOnX = async () => {
    await captureAndDownload()
    const tweetText = encodeURIComponent(
      `🦋 J'ai passé la loi "${lawText.substring(0, 50)}${lawText.length > 50 ? '...' : ''}" sur Butterfly.gov\n\n` +
      `📊 Mon score présidentiel:\n💰 Économie: ${result.scores.economy}/100\n❤️ Social: ${result.scores.social}/100\n🌿 Écologie: ${result.scores.ecology}/100\n\nTentez de faire mieux ! 👇\n${appUrl}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
  }
  
  const shareOnFacebook = async () => {
    await captureAndDownload()
    const shareUrl = encodeURIComponent(appUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodeURIComponent(`J'ai testé ma loi "${lawText}" sur Butterfly.gov ! Score: ${result.scores.overall}/100`)}`, '_blank')
  }
  
  const shareOnInstagram = async () => {
    await captureAndDownload()
    alert('📸 Image téléchargée !\n\nOuvrez Instagram et partagez l\'image depuis votre galerie avec le hashtag #ButterflyGov')
  }
  
  const copyToClipboard = async () => {
    const text = `🦋 Ma loi sur Butterfly.gov: "${lawText}"\n\n📊 Scores:\n💰 Économie: ${result.scores.economy}/100\n❤️ Social: ${result.scores.social}/100\n🌿 Écologie: ${result.scores.ecology}/100\n⭐ Global: ${result.scores.overall}/100\n\n${appUrl}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button onClick={shareOnX} className="bg-black hover:bg-gray-900 border border-white/20"><XIcon className="w-4 h-4 mr-2" />X / Twitter</Button>
      <Button onClick={shareOnFacebook} className="bg-blue-600 hover:bg-blue-500"><Facebook className="w-4 h-4 mr-2" />Facebook</Button>
      <Button onClick={shareOnInstagram} className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90"><Instagram className="w-4 h-4 mr-2" />Instagram</Button>
      <Button onClick={captureAndDownload} variant="outline" className="border-white/20 hover:bg-white/10"><Download className="w-4 h-4 mr-2" />Télécharger</Button>
      <Button onClick={copyToClipboard} variant="outline" className="border-white/20 hover:bg-white/10">{copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}{copied ? 'Copié !' : 'Copier'}</Button>
    </div>
  )
}

// Debate Share Buttons Component
function DebateShareButtons({ cardRef, law1Text, law2Text, debateResult }) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')

  const captureAndDownload = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#111111', scale: 2 })
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'butterfly-gov-debat.png'
        a.click()
        URL.revokeObjectURL(url)
        resolve(blob)
      })
    })
  }

  const s1 = debateResult.law1.analysis.scores.overall
  const s2 = debateResult.law2.analysis.scores.overall
  const winner = s1 > s2 ? `LOI A (${s1}/100)` : s2 > s1 ? `LOI B (${s2}/100)` : 'ÉGALITÉ'

  const shareOnX = async () => {
    await captureAndDownload()
    const text = encodeURIComponent(
      `⚔️ J'ai comparé deux lois sur Butterfly.gov !\n\n` +
      `🔵 "${law1Text.substring(0, 40)}${law1Text.length > 40 ? '...' : ''}" → ${s1}/100\n` +
      `🔴 "${law2Text.substring(0, 40)}${law2Text.length > 40 ? '...' : ''}" → ${s2}/100\n\n` +
      `🏆 Gagnant : ${winner}\n\nFaites votre propre débat 👇\n${appUrl}`
    )
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
  }

  const shareOnFacebook = async () => {
    await captureAndDownload()
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`, '_blank')
  }

  const shareOnInstagram = async () => {
    await captureAndDownload()
    alert('📸 Image téléchargée !\n\nOuvrez Instagram et partagez l\'image depuis votre galerie avec le hashtag #ButterflyGov')
  }

  const copyToClipboard = async () => {
    const text = `⚔️ Débat Butterfly.gov\n\n🔵 LOI A: "${law1Text}"\n💰 ${debateResult.law1.analysis.scores.economy} | ❤️ ${debateResult.law1.analysis.scores.social} | 🌿 ${debateResult.law1.analysis.scores.ecology} | ⭐ ${s1}/100\n\n🔴 LOI B: "${law2Text}"\n💰 ${debateResult.law2.analysis.scores.economy} | ❤️ ${debateResult.law2.analysis.scores.social} | 🌿 ${debateResult.law2.analysis.scores.ecology} | ⭐ ${s2}/100\n\n🏆 ${winner}\n\n${appUrl}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button onClick={shareOnX} className="bg-black hover:bg-gray-900 border border-white/20"><XIcon className="w-4 h-4 mr-2" />X / Twitter</Button>
      <Button onClick={shareOnFacebook} className="bg-blue-600 hover:bg-blue-500"><Facebook className="w-4 h-4 mr-2" />Facebook</Button>
      <Button onClick={shareOnInstagram} className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90"><Instagram className="w-4 h-4 mr-2" />Instagram</Button>
      <Button onClick={captureAndDownload} variant="outline" className="border-white/20 hover:bg-white/10"><Download className="w-4 h-4 mr-2" />Télécharger</Button>
      <Button onClick={copyToClipboard} variant="outline" className="border-white/20 hover:bg-white/10">{copied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}{copied ? 'Copié !' : 'Copier'}</Button>
    </div>
  )
}

// Animated Counter
function AnimatedCounter({ value, color, label, icon: Icon, delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  useEffect(() => {
    setDisplayValue(0)
    setIsAnimating(true)
    const timeout = setTimeout(() => {
      let start = 0
      const end = value
      const increment = end / (1500 / 16)
      const timer = setInterval(() => {
        start += increment
        if (start >= end) { setDisplayValue(end); setIsAnimating(false); clearInterval(timer) }
        else { setDisplayValue(Math.floor(start)) }
      }, 16)
      return () => clearInterval(timer)
    }, delay)
    return () => clearTimeout(timeout)
  }, [value, delay])
  const getColorClass = () => value >= 60 ? 'text-green-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400'
  const getGlowClass = () => !isAnimating ? '' : value >= 60 ? 'shadow-[0_0_30px_rgba(74,222,128,0.5)]' : value >= 40 ? 'shadow-[0_0_30px_rgba(250,204,21,0.5)]' : 'shadow-[0_0_30px_rgba(248,113,113,0.5)]'
  return (
    <motion.div className={`flex flex-col items-center p-4 rounded-xl bg-black/30 border border-white/10 transition-shadow duration-500 ${getGlowClass()}`} initial={{ scale: 0.5, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: delay / 1000 }}>
      <motion.div animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}} transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0 }}><Icon className={`w-6 h-6 mb-2 ${color}`} /></motion.div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <motion.span className={`text-4xl font-bold tabular-nums ${getColorClass()}`} animate={isAnimating ? { scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.3, repeat: isAnimating ? Infinity : 0 }}>{displayValue}</motion.span>
      <span className="text-xs text-muted-foreground">/100</span>
    </motion.div>
  )
}

// Result Card
function ResultCard({ result, lawText, cardRef }) {
  useEffect(() => { if (result?.scores?.overall) triggerConfetti(result.scores.overall) }, [result])
  return (
    <motion.div ref={cardRef} className="w-full max-w-2xl mx-auto" initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, type: "spring" }}>
      <Card className="score-card-bg border-0 overflow-hidden shadow-2xl">
        <motion.div className="h-2 flex" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5 }}><div className="flex-1 bg-blue-600"></div><div className="flex-1 bg-white"></div><div className="flex-1 bg-red-500"></div></motion.div>
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <motion.div className="flex items-center justify-center gap-2 text-blue-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}><ButterflyIcon className="w-5 h-5" /><span className="text-sm font-medium uppercase tracking-widest">Butterfly.gov</span><ButterflyIcon className="w-5 h-5" /></motion.div>
            <motion.h2 className="text-xl font-bold text-white leading-tight" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>"{lawText}"</motion.h2>
            <p className="text-xs text-muted-foreground">Analyse d'impact présidentiel</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AnimatedCounter value={result.scores.economy} color="text-blue-400" label="Économie" icon={TrendingUp} delay={0} />
            <AnimatedCounter value={result.scores.social} color="text-white" label="Social" icon={Heart} delay={200} />
            <AnimatedCounter value={result.scores.ecology} color="text-green-400" label="Écologie" icon={Leaf} delay={400} />
            <AnimatedCounter value={result.scores.faisabilite ?? 50} color="text-orange-400" label="Faisabilité" icon={Wrench} delay={600} />
          </div>
          {result.scores.overall && (
            <motion.div className="flex justify-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.8, type: "spring" }}>
              <div className={`px-4 py-2 rounded-full border-2 ${result.scores.overall >= 60 ? 'border-green-500 bg-green-500/20 text-green-400' : result.scores.overall >= 40 ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-red-500 bg-red-500/20 text-red-400'}`}>
                <div className="flex items-center gap-2"><Star className="w-4 h-4" /><span className="font-bold">Score Global: {result.scores.overall}/100</span></div>
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <motion.div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30" initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, type: "spring" }}>
              <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-green-400" /><span className="text-xs font-semibold text-green-400 uppercase">Gagnants</span></div>
              <p className="text-sm text-green-100">{result.winners}</p>
            </motion.div>
            <motion.div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6, type: "spring" }}>
              <div className="flex items-center gap-2 mb-2"><Skull className="w-4 h-4 text-red-400" /><span className="text-xs font-semibold text-red-400 uppercase">Perdants</span></div>
              <p className="text-sm text-red-100">{result.losers}</p>
            </motion.div>
          </div>
          <motion.div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, type: "spring" }}>
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-purple-400" /><span className="text-xs font-semibold text-purple-400 uppercase">Effet Papillon (à 5 ans)</span></div>
            <p className="text-sm text-purple-100 italic">"{result.butterfly_effect}"</p>
          </motion.div>
          <div className="text-center pt-2 border-t border-white/10"><p className="text-xs text-muted-foreground">butterfly.gov • Simulateur politique propulsé par IA</p></div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Debate Summary Card
function DebateSummaryCard({ data, onClose, onCopy, copied }) {
  const getScoreColor = (s) => (s ?? 50) >= 60 ? 'text-green-400' : (s ?? 50) >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreKeys = [['💰','economy','Éco'],['❤️','social','Social'],['🌿','ecology','Écolo'],['⚙️','faisabilite','Faisab.']]
  return (
    <motion.div className="space-y-2 overflow-y-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between items-center">
        <p className="text-xs text-purple-400 uppercase font-semibold tracking-widest">📋 Résumé du débat</p>
        <div className="flex gap-2">
          <button onClick={onCopy} className="text-xs text-muted-foreground hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 transition-colors">{copied ? '✓ Copié' : 'Copier'}</button>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">Fermer ×</button>
        </div>
      </div>
      {data.laws?.map((l) => {
        const isA = l.label !== 'LOI B'
        return (
          <div key={l.label} className={`p-3 rounded-lg border ${isA ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-bold ${isA ? 'text-blue-400' : 'text-red-400'}`}>{l.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${l.viable ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>{l.viable ? '✓ Viable' : '✗ Non viable'}</span>
            </div>
            <p className="text-xs text-white/70 italic mb-1 line-clamp-1">"{l.text}"</p>
            <p className="text-xs text-white/60 mb-2">{l.reason}</p>
            <div className="grid grid-cols-4 gap-1">
              {scoreKeys.map(([emoji, key, label]) => (
                <div key={key} className="text-center bg-black/20 rounded py-1">
                  <div className="text-xs leading-none">{emoji}</div>
                  <div className={`text-sm font-bold ${getScoreColor(l.scores?.[key])}`}>{l.scores?.[key] ?? 50}</div>
                  <div className="text-[10px] text-muted-foreground leading-none">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {data.keyPoint && (
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">
          <p className="text-xs text-purple-400 font-semibold mb-0.5">🔑 Point clé du débat</p>
          <p className="text-xs text-white/80">{data.keyPoint}</p>
        </div>
      )}
      {data.conclusion && (
        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <p className="text-xs text-purple-200 italic">"{data.conclusion}"</p>
        </div>
      )}
    </motion.div>
  )
}

// Debate Chat Modal - "L'Opposant Féroce"
function DebateChatModal({ open, onClose, law, law1, law2, law1Scores, law2Scores, initialResult, getAccessToken, onUpgrade, onSignIn }) {
  const isDebateMode = !!(law1 && law2)

  const DEF = { economy: 50, social: 50, ecology: 50, faisabilite: 50, overall: 50 }
  const buildScores = (sel) => {
    if (!isDebateMode) return initialResult?.scores || DEF
    if (sel === 'law2') return law2Scores || DEF
    if (sel === 'both') {
      const avg = (k) => Math.round(((law1Scores?.[k] || 50) + (law2Scores?.[k] || 50)) / 2)
      return { economy: avg('economy'), social: avg('social'), ecology: avg('ecology'), faisabilite: avg('faisabilite'), overall: avg('overall') }
    }
    return law1Scores || DEF
  }

  const [selectedLaw, setSelectedLaw] = useState('law1')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [firstMsgLoading, setFirstMsgLoading] = useState(false)
  const [currentScores, setCurrentScores] = useState(() => buildScores('law1'))
  const [summaryData, setSummaryData] = useState(null)  // parsed JSON or null
  const [summaryMode, setSummaryMode] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef(null)

  const resetWithSel = async (sel) => {
    setSelectedLaw(sel)
    setCurrentScores(buildScores(sel))
    setMessages([])
    setSummaryData(null)
    setSummaryMode(false)
    setCopied(false)
    setFirstMsgLoading(true)
    try {
      const token = await getAccessToken()
      const lawForFirst = isDebateMode ? (sel === 'law2' ? law2 : sel === 'both' ? null : law1) : law
      const resp = await fetch('/api/debate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({ law: lawForFirst, law1: isDebateMode ? law1 : null, law2: isDebateMode ? law2 : null, selectedLaws: isDebateMode ? sel : 'law1', firstMessage: true })
      })
      const data = await resp.json()
      if (data.error === 'auth_required') {
        setMessages([{ role: 'system', type: 'auth_required' }])
      } else {
        setMessages([{ role: 'assistant', content: data.firstMessage || 'Alors, défendez votre proposition !' }])
      }
    } catch {
      setMessages([{ role: 'assistant', content: 'Alors, défendez votre proposition !' }])
    } finally {
      setFirstMsgLoading(false)
    }
  }

  useEffect(() => {
    if (open) resetWithSel('law1')
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeLaw = isDebateMode ? (selectedLaw === 'law2' ? law2 : selectedLaw === 'both' ? null : law1) : law

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/debate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          law: activeLaw,
          law1: isDebateMode ? law1 : null,
          law2: isDebateMode ? law2 : null,
          selectedLaws: isDebateMode ? selectedLaw : 'law1',
          messages: [...messages, userMessage],
          currentScores
        })
      })
      const data = await response.json()
      if (data.error === 'rate_limit_exceeded') {
        const resetMinutes = data.resetAt ? Math.max(1, Math.ceil((new Date(data.resetAt) - new Date()) / 60000)) : 60
        setMessages(prev => [...prev, { role: 'system', type: 'rate_limit', minutes: resetMinutes }])
      } else if (data.error === 'auth_required') {
        setMessages(prev => [...prev, { role: 'system', type: 'auth_required' }])
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Erreur: ${data.message || data.error}` }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        if (data.scoreAdjustment?.new_scores) {
          const clamp = (v, fb = 50) => Math.min(100, Math.max(0, Math.round(v ?? fb)))
          const ns = data.scoreAdjustment.new_scores
          const eco = clamp(ns.economy)
          const soc = clamp(ns.social)
          const ecl = clamp(ns.ecology)
          const fai = clamp(ns.faisabilite, currentScores.faisabilite)
          setCurrentScores({ economy: eco, social: soc, ecology: ecl, faisabilite: fai, overall: clamp((eco + soc + ecl + fai) / 4) })
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion. Réessayez.' }])
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async () => {
    if (messages.length < 3 || summaryLoading) return
    setSummaryLoading(true)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/debate-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          law: activeLaw,
          law1: isDebateMode ? law1 : null,
          law2: isDebateMode ? law2 : null,
          law1Scores: isDebateMode ? (selectedLaw === 'law1' ? currentScores : law1Scores) : null,
          law2Scores: isDebateMode ? (selectedLaw === 'law2' ? currentScores : law2Scores) : null,
          selectedLaws: isDebateMode ? selectedLaw : 'law1',
          messages,
          currentScores,
          summarize: true
        })
      })
      const data = await response.json()
      if (!data.error && data.summary) {
        // Try to parse as JSON (structured summary)
        try {
          const parsed = JSON.parse(data.summary)
          setSummaryData(parsed)
        } catch {
          // Fallback: wrap raw text in a compatible structure
          setSummaryData({ raw: data.summary })
        }
        setSummaryMode(true)
      }
    } catch (err) {
      console.error('Summary error:', err)
    } finally {
      setSummaryLoading(false)
    }
  }

  const formatSummaryText = (sd) => {
    if (!sd) return ''
    if (sd.raw) return sd.raw
    let t = '📋 Résumé du débat Butterfly.gov\n\n'
    sd.laws?.forEach(l => {
      t += `${l.label === 'LOI B' ? '🔴' : '🔵'} ${l.label}: "${l.text}"\n`
      t += `${l.viable ? '✓ Viable' : '✗ Non viable'} — ${l.reason}\n`
      t += `💰 ${l.scores?.economy ?? 50} | ❤️ ${l.scores?.social ?? 50} | 🌿 ${l.scores?.ecology ?? 50} | ⚙️ ${l.scores?.faisabilite ?? 50}\n\n`
    })
    if (sd.keyPoint) t += `🔑 ${sd.keyPoint}\n\n`
    if (sd.conclusion) t += `🏁 "${sd.conclusion}"`
    return t
  }

  const copySummary = () => {
    navigator.clipboard?.writeText(formatSummaryText(summaryData))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getScoreColor = (score) => score >= 60 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'

  const lawLabel = isDebateMode
    ? selectedLaw === 'both' ? `"${law1}" ⚔️ "${law2}"` : selectedLaw === 'law2' ? `"${law2}"` : `"${law1}"`
    : `"${law}"`

  const lawBorderClass = selectedLaw === 'law2' ? 'bg-red-500/10 border-red-500/30' : selectedLaw === 'both' ? 'bg-purple-500/10 border-purple-500/30' : 'bg-blue-500/10 border-blue-500/30'
  const lawTextClass = selectedLaw === 'law2' ? 'text-red-400' : selectedLaw === 'both' ? 'text-purple-400' : 'text-blue-400'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Mode Débat - L'Opposant Féroce
          </DialogTitle>
          <DialogDescription>Défendez votre loi face à un débatteur impitoyable</DialogDescription>
        </DialogHeader>

        {/* Law selector — debate mode only */}
        {isDebateMode && (
          <div className="flex gap-2 justify-center">
            <button onClick={() => resetWithSel('law1')} className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedLaw === 'law1' ? 'bg-blue-600 text-white' : 'bg-black/30 text-muted-foreground hover:bg-white/10 border border-white/10'}`}>🔵 LOI A</button>
            <button onClick={() => resetWithSel('both')} className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedLaw === 'both' ? 'bg-purple-600 text-white' : 'bg-black/30 text-muted-foreground hover:bg-white/10 border border-white/10'}`}>⚔️ Les deux</button>
            <button onClick={() => resetWithSel('law2')} className={`px-3 py-1.5 rounded-full text-xs transition-colors ${selectedLaw === 'law2' ? 'bg-red-600 text-white' : 'bg-black/30 text-muted-foreground hover:bg-white/10 border border-white/10'}`}>🔴 LOI B</button>
          </div>
        )}

        {/* Score display */}
        <div className="flex justify-center gap-3 py-2 border-b border-white/10">
          <div className="text-center"><span className="text-xs text-muted-foreground">💰 Éco</span><p className={`font-bold ${getScoreColor(currentScores.economy)}`}>{currentScores.economy}</p></div>
          <div className="text-center"><span className="text-xs text-muted-foreground">❤️ Social</span><p className={`font-bold ${getScoreColor(currentScores.social)}`}>{currentScores.social}</p></div>
          <div className="text-center"><span className="text-xs text-muted-foreground">🌿 Écolo</span><p className={`font-bold ${getScoreColor(currentScores.ecology)}`}>{currentScores.ecology}</p></div>
          <div className="text-center"><span className="text-xs text-muted-foreground">⚙️ Faisab.</span><p className={`font-bold ${getScoreColor(currentScores.faisabilite ?? 50)}`}>{currentScores.faisabilite ?? 50}</p></div>
          <div className="text-center border-l border-white/10 pl-3"><span className="text-xs text-muted-foreground">⭐ Global</span><p className={`font-bold ${getScoreColor(currentScores.overall)}`}>{currentScores.overall}</p></div>
        </div>

        {/* Law being debated */}
        <div className={`px-4 py-2 rounded-lg border ${lawBorderClass}`}>
          <p className={`text-xs uppercase font-semibold ${lawTextClass}`}>{isDebateMode && selectedLaw === 'both' ? 'Les deux lois' : isDebateMode && selectedLaw === 'law2' ? 'LOI B débattue' : 'LOI A débattue'}</p>
          <p className="text-sm text-white truncate">{lawLabel}</p>
        </div>

        {/* Main area: summary card OR chat messages */}
        <div className="flex-1 overflow-y-auto py-2">
          {summaryMode && summaryData ? (
            summaryData.raw
              ? <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"><div className="flex justify-between items-center mb-2"><p className="text-xs text-purple-400 uppercase font-semibold">📋 Résumé</p><div className="flex gap-2"><button onClick={copySummary} className="text-xs text-muted-foreground hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">{copied ? '✓ Copié' : 'Copier'}</button><button onClick={() => setSummaryMode(false)} className="text-xs text-muted-foreground hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">× Fermer</button></div></div><p className="text-sm text-white/90 whitespace-pre-wrap">{summaryData.raw}</p></div>
              : <DebateSummaryCard data={summaryData} onClose={() => setSummaryMode(false)} onCopy={copySummary} copied={copied} />
          ) : (
            <div className="space-y-4 py-2">
              {firstMsgLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <p className="text-xs text-purple-400">L'Opposant prépare son attaque...</p>
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {msg.role === 'system' && msg.type === 'rate_limit' ? (
                    <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-orange-500/20 border border-orange-500/40 text-center space-y-2">
                      <p className="text-sm font-semibold text-orange-300">⏳ Limite atteinte</p>
                      <p className="text-xs text-orange-200">10 messages/h pour les comptes gratuits. Réessayez dans {msg.minutes} min.</p>
                      {onUpgrade && <button onClick={onUpgrade} className="mt-1 px-4 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-full text-xs font-bold hover:from-yellow-400 hover:to-orange-400 transition-all">👑 Passer Premium – Illimité</button>}
                    </div>
                  ) : msg.role === 'system' && msg.type === 'auth_required' ? (
                    <div className="max-w-[90%] rounded-2xl px-4 py-3 bg-blue-500/20 border border-blue-500/40 text-center space-y-2">
                      <p className="text-sm font-semibold text-blue-300">🔒 Connexion requise</p>
                      <p className="text-xs text-blue-200">Connectez-vous pour débattre avec l'IA.</p>
                      {onSignIn && <button onClick={onSignIn} className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-bold transition-all">Se connecter</button>}
                    </div>
                  ) : (
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                      {msg.role === 'assistant' && <p className="text-xs text-purple-400 mb-1 font-semibold">🎭 L'Opposant Féroce</p>}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input + Summary/Chat toggle */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex justify-center gap-2">
            {messages.length >= 3 && !summaryMode && (
              <button onClick={generateSummary} disabled={summaryLoading} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors disabled:opacity-50">
                {summaryLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : '📋'} Résumé du débat
              </button>
            )}
            {summaryMode && (
              <button onClick={() => setSummaryMode(false)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 transition-colors">
                💬 Retour au débat
              </button>
            )}
          </div>
          {!summaryMode && (
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder={firstMsgLoading ? "L'Opposant prépare son attaque..." : "Défendez votre position..."} className="flex-1 bg-background" disabled={loading || firstMsgLoading} />
              <Button onClick={sendMessage} disabled={loading || firstMsgLoading || !input.trim()} className="bg-purple-600 hover:bg-purple-500"><Send className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Daily Law Card
const categoryConfig = {
  gauche: { dot: 'bg-rose-500', border: 'border-rose-500/20', hover: 'hover:border-rose-500/40' },
  droite: { dot: 'bg-blue-500', border: 'border-blue-500/20', hover: 'hover:border-blue-500/40' },
  fun: { dot: 'bg-yellow-400', border: 'border-yellow-400/20', hover: 'hover:border-yellow-400/40' },
}

function DailyLawCard({ law, onClick }) {
  const cfg = categoryConfig[law.category]
  return (
    <motion.button
      onClick={() => onClick(law.description)}
      className={`text-left p-3 rounded-xl bg-white/5 border ${cfg.border} ${cfg.hover} transition-colors w-full`}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className={`mt-1.5 shrink-0 w-2 h-2 rounded-full ${cfg.dot}`} />
        <span className="font-semibold text-sm text-white leading-tight">{law.title}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 pl-4">{law.description}</p>
      <div className="flex flex-wrap gap-1 mt-2 pl-4">
        {law.tags.map(tag => (
          <span key={tag} className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10">{tag}</span>
        ))}
      </div>
    </motion.button>
  )
}

// History Panel
function HistoryPanel({ onSelectLaw }) {
  const { getAccessToken } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchHistory = async () => {
      const token = await getAccessToken()
      const res = await fetch('/api/history', { headers: token ? { 'Authorization': `Bearer ${token}` } : {} })
      const data = await res.json()
      setHistory(data.history || [])
      setLoading(false)
    }
    fetchHistory()
  }, [])
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-400" /></div>
  if (history.length === 0) return <div className="text-center py-8 text-muted-foreground"><History className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Aucune loi analysée</p></div>
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {history.map((item, i) => (
        <motion.div key={item.id || i} className="p-3 rounded-lg bg-black/30 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => onSelectLaw(item.law_text)}>
          <div className="flex justify-between items-start gap-2"><p className="text-sm text-white line-clamp-1 flex-1">"{item.law_text}"</p><ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" /></div>
          <div className="mt-1 flex gap-2 text-xs"><span className="text-blue-400">💰{item.score_economy}</span><span className="text-white">❤️{item.score_social}</span><span className="text-green-400">🌿{item.score_ecology}</span></div>
        </motion.div>
      ))}
    </div>
  )
}

// Leaderboard Panel
function LeaderboardPanel({ onSelectLaw }) {
  const [leaderboard, setLeaderboard] = useState(null)
  const [flop, setFlop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('overall')
  useEffect(() => { fetch('/api/leaderboard').then(r => r.json()).then(data => { setLeaderboard(data.leaderboard); setFlop(data.flop); setLoading(false) }).catch(() => setLoading(false)) }, [])
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
  if (!leaderboard || Object.values(leaderboard).every(arr => arr.length === 0)) return <div className="text-center py-8 text-muted-foreground"><Award className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Pas encore de classement</p></div>
  const categories = [{ key: 'overall', label: '🏆 Global', color: 'text-yellow-400' }, { key: 'economy', label: '💰 Éco', color: 'text-blue-400' }, { key: 'social', label: '❤️ Social', color: 'text-pink-400' }, { key: 'ecology', label: '🌿 Écolo', color: 'text-green-400' }]
  const flopItems = flop?.[activeCategory] || []
  return (
    <div className="space-y-4">
      {onSelectLaw && <p className="text-xs text-muted-foreground text-center">Cliquez sur une loi pour la tester</p>}
      <div className="flex gap-2 flex-wrap">{categories.map(cat => (<button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`px-3 py-1 rounded-full text-xs transition-colors ${activeCategory === cat.key ? 'bg-white/20 text-white' : 'bg-black/30 text-muted-foreground hover:bg-white/10'}`}>{cat.label}</button>))}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-2"><Trophy className="w-4 h-4 text-yellow-400" /><span className="text-xs font-semibold text-yellow-400 uppercase">Top</span></div>
        {(leaderboard[activeCategory] || []).map((item, i) => (
          <motion.div key={i} className={`flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/10 transition-colors ${onSelectLaw ? 'cursor-pointer hover:border-yellow-500/50' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => onSelectLaw && onSelectLaw(item.law)}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'}`}>{i + 1}</div>
            <p className="text-sm text-white flex-1 line-clamp-1">"{item.law}"</p>
            <span className={`font-bold ${categories.find(c => c.key === activeCategory)?.color}`}>{item.score}</span>
          </motion.div>
        ))}
      </div>
      {flopItems.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2"><Skull className="w-4 h-4 text-red-400" /><span className="text-xs font-semibold text-red-400 uppercase">Flop</span></div>
          {flopItems.map((item, i) => (
            <motion.div key={i} className={`flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-red-900/30 transition-colors ${onSelectLaw ? 'cursor-pointer hover:border-red-500/50' : ''}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => onSelectLaw && onSelectLaw(item.law)}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-red-900/50 text-red-300">{i + 1}</div>
              <p className="text-sm text-white flex-1 line-clamp-1">"{item.law}"</p>
              <span className="font-bold text-red-400">{item.score}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Main App
function ButterflyApp() {
  const { user, profile, loading: authLoading, isPremium, getAccessToken } = useAuth()
  const [mode, setMode] = useState('single')
  const [lawText, setLawText] = useState('')
  const [law1Text, setLaw1Text] = useState('')
  const [law2Text, setLaw2Text] = useState('')
  const [result, setResult] = useState(null)
  const [debateResult, setDebateResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('history')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [rateLimitExceeded, setRateLimitExceeded] = useState(null)
  const [showDebateChat, setShowDebateChat] = useState(false)
  const [explainText, setExplainText] = useState('')
  const [explainResult, setExplainResult] = useState('')
  const [explainLoading, setExplainLoading] = useState(false)
  const [explainSourceCount, setExplainSourceCount] = useState(0)
  const [explainSearching, setExplainSearching] = useState('')
  const [sharePanel, setSharePanel] = useState(null)   // { shareId, proposition, scoreGlobal } | null
  const [shareCreating, setShareCreating] = useState(false)
  const cardRef = useRef(null)
  const debateCardRef = useRef(null)
  
  const analyzeLaw = async () => {
    if (!lawText.trim()) return
    setLoading(true); setError(null); setResult(null)
    try {
      const token = await getAccessToken()
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      const response = await fetch('/api/analyze', { method: 'POST', headers, body: JSON.stringify({ law: lawText.trim() }) })
      const data = await response.json()
      if (response.status === 429) { setRateLimitExceeded({ userTier: data.userTier, resetAt: data.resetAt }); return }
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse')
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  
  const analyzeDebate = async () => {
    if (!law1Text.trim() || !law2Text.trim()) return
    if (!isPremium) { setError('Le Mode Débat est réservé aux abonnés Premium'); return }
    setLoading(true); setError(null); setDebateResult(null)
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/debate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ law1: law1Text.trim(), law2: law2Text.trim() }) })
      const data = await response.json()
      if (data.error === 'premium_required') { setError(data.message); return }
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse')
      setDebateResult(data)
      triggerConfetti(Math.max(data.law1.analysis.scores.overall, data.law2.analysis.scores.overall))
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }
  
  const analyzeExplain = async () => {
    if (!explainText.trim()) return
    setExplainLoading(true); setExplainResult(''); setExplainSourceCount(0); setExplainSearching(''); setError(null)
    try {
      const token = await getAccessToken()
      const hdrs = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const response = await fetch('/api/explain', { method: 'POST', headers: hdrs, body: JSON.stringify({ query: explainText.trim() }) })
      if (!response.ok) throw new Error('Erreur lors de l\'explication')
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const evt = JSON.parse(line.slice(6))
            if (evt.type === 'text') { setExplainResult(prev => prev + evt.text); setExplainSearching('') }
            else if (evt.type === 'searching') setExplainSearching(evt.query)
            else if (evt.type === 'done') setExplainSourceCount(evt.sourceCount || 0)
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) { setError(err.message) }
    finally { setExplainLoading(false); setExplainSearching('') }
  }

  const openSharePanel = async (data) => {
    setShareCreating(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur création du lien')
      setSharePanel({ shareId: json.shareId, proposition: data.proposition || data.loi_a_titre || '', scoreGlobal: data.score_global || 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setShareCreating(false)
    }
  }

  const handleUpgrade = async () => {
    const token = await getAccessToken()
    if (!token) { setShowAuthModal(true); return }
    const response = await fetch('/api/stripe/create-checkout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
    const data = await response.json()
    if (data.url) window.location.href = data.url
  }
  
  const reset = () => { setLawText(''); setLaw1Text(''); setLaw2Text(''); setResult(null); setDebateResult(null); setExplainText(''); setExplainResult(''); setExplainSourceCount(0); setExplainSearching(''); setError(null); setRateLimitExceeded(null) }

  const hasResults = mode === 'single' ? result : mode === 'debate' ? debateResult : explainResult
  
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
  
  return (
    <main className="min-h-screen flex flex-col">
      {rateLimitExceeded && <SoftWall userTier={rateLimitExceeded.userTier} resetAt={rateLimitExceeded.resetAt} onSignIn={() => { setRateLimitExceeded(null); setShowAuthModal(true) }} onUpgrade={() => { setRateLimitExceeded(null); handleUpgrade() }} />}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {sharePanel && <SharePanel shareId={sharePanel.shareId} proposition={sharePanel.proposition} scoreGlobal={sharePanel.scoreGlobal} onClose={() => setSharePanel(null)} />}
      <DebateChatModal open={showDebateChat} onClose={() => setShowDebateChat(false)} law={mode === 'debate' ? null : lawText} law1={mode === 'debate' ? law1Text : null} law2={mode === 'debate' ? law2Text : null} law1Scores={debateResult?.law1?.analysis?.scores} law2Scores={debateResult?.law2?.analysis?.scores} initialResult={result} getAccessToken={getAccessToken} onUpgrade={handleUpgrade} onSignIn={() => { setShowDebateChat(false); setShowAuthModal(true) }} />
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <header className="relative z-20 flex justify-between items-center p-4">
        <div></div>
        <div className="flex items-center gap-2">
          {user ? <UserMenu /> : <Button onClick={() => setShowAuthModal(true)} variant="outline" size="sm"><User className="w-4 h-4 mr-2" />Connexion</Button>}
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 rounded-full bg-card border border-white/10 hover:border-blue-500/50 transition-colors">{showSidebar ? <X className="w-5 h-5" /> : <History className="w-5 h-5" />}</button>
        </div>
      </header>
      
      <AnimatePresence>
        {showSidebar && (
          <motion.div className="fixed top-0 right-0 h-full w-80 bg-card border-l border-white/10 z-40 p-4 overflow-y-auto" initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }} transition={{ type: "spring", damping: 20 }}>
            <div className="pt-16">
              <button onClick={() => setShowSidebar(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"><X className="w-4 h-4" /></button>
              <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
                <TabsList className="w-full mb-4"><TabsTrigger value="history" className="flex-1"><History className="w-4 h-4 mr-1" />Historique</TabsTrigger><TabsTrigger value="leaderboard" className="flex-1"><Award className="w-4 h-4 mr-1" />Top</TabsTrigger></TabsList>
                <TabsContent value="history"><HistoryPanel onSelectLaw={(law) => { setLawText(law); setMode('single'); setShowSidebar(false) }} /></TabsContent>
                <TabsContent value="leaderboard"><LeaderboardPanel onSelectLaw={(law) => { setLawText(law); setMode('single'); setShowSidebar(false) }} /></TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {(loading || (explainLoading && !explainResult)) ? <AnalysisLoader key="loader" /> : !hasResults ? (
            <motion.div key="input" className="w-full max-w-2xl space-y-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center space-y-4">
                <motion.div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-white/20 to-red-500 p-[2px]" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center"><ButterflyIcon className="w-10 h-10 text-white" /></div>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold"><span className="text-blue-400">Butterfly</span><span className="text-white">.gov</span></h1>
                <p className="text-muted-foreground text-lg">Le simulateur de conséquences politiques</p>
              </div>
              
              <div className="flex justify-center">
                <div className="inline-flex rounded-full bg-black/30 p-1 border border-white/10">
                  <button onClick={() => setMode('single')} className={`px-4 py-2 rounded-full text-sm transition-colors ${mode === 'single' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-white'}`}><Sparkles className="w-4 h-4 inline mr-1" />Analyser</button>
                  <button onClick={() => setMode('debate')} className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${mode === 'debate' ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-white'}`}>{!isPremium && <Lock className="w-3 h-3" />}<Swords className="w-4 h-4" />Débat</button>
                  <button onClick={() => setMode('explain')} className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${mode === 'explain' ? 'bg-green-700 text-white' : 'text-muted-foreground hover:text-white'}`}><BookOpen className="w-4 h-4" />Expliquer</button>
                </div>
              </div>
              
              {mode === 'single' ? (
                <div className="space-y-4">
                  <label className="block text-center text-xl text-white/80">Si vous étiez Président, quelle loi passeriez-vous ?</label>
                  <div className="relative">
                    <Input type="text" value={lawText} onChange={(e) => setLawText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyzeLaw()} placeholder="Ex: Interdire les SUV en centre-ville..." className="h-16 text-lg pl-6 pr-16 rounded-full bg-card border-2 border-white/10 focus:border-blue-500 transition-all pulse-glow" disabled={loading} />
                    <Button onClick={analyzeLaw} disabled={loading || !lawText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-500 hover:to-red-400"><Sparkles className="w-5 h-5" /></Button>
                  </div>
                </div>
              ) : mode === 'debate' ? (
                <div className="space-y-4">
                  {!isPremium && (
                    <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <Lock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                      <p className="text-sm text-yellow-200">Le Mode Débat est réservé aux abonnés Premium</p>
                      <Button onClick={handleUpgrade} className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black"><Crown className="w-4 h-4 mr-2" />Passer Premium - 2,99€/mois</Button>
                    </div>
                  )}
                  <label className="block text-center text-xl text-white/80">Comparez deux propositions de loi</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><span className="text-sm text-blue-400 font-medium">LOI A</span><Input value={law1Text} onChange={(e) => setLaw1Text(e.target.value)} placeholder="Première proposition..." className="bg-card border-2 border-blue-500/30 focus:border-blue-500" disabled={loading || !isPremium} /></div>
                    <div className="space-y-2"><span className="text-sm text-red-400 font-medium">LOI B</span><Input value={law2Text} onChange={(e) => setLaw2Text(e.target.value)} placeholder="Deuxième proposition..." className="bg-card border-2 border-red-500/30 focus:border-red-500" disabled={loading || !isPremium} /></div>
                  </div>
                  <div className="flex justify-center"><Button onClick={analyzeDebate} disabled={loading || !law1Text.trim() || !law2Text.trim() || !isPremium} className="px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 hover:from-blue-500 hover:via-purple-500 hover:to-red-400"><Swords className="w-5 h-5 mr-2" />Lancer le débat</Button></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-center text-xl text-white/80">Quelle loi ou réforme voulez-vous comprendre ?</label>
                  <div className="relative">
                    <Input type="text" value={explainText} onChange={(e) => setExplainText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyzeExplain()} placeholder="Ex: Loi travail 2016, Réforme des retraites..." className="h-16 text-lg pl-6 pr-16 rounded-full bg-card border-2 border-white/10 focus:border-green-600 transition-all" disabled={explainLoading} />
                    <Button onClick={analyzeExplain} disabled={explainLoading || !explainText.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-green-700 hover:bg-green-600"><BookOpen className="w-5 h-5" /></Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Explication factuelle, sans jugement de valeur · Sources primaires citées</p>
                </div>
              )}
              
              {error && <motion.p className="text-center text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
              
              {mode === 'single' && (
                <div className="space-y-3">
                  <p className="text-sm text-center text-muted-foreground">Propositions du jour</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getDailyLaws().map((law) => (
                      <DailyLawCard key={law.id} law={law} onClick={(text) => setLawText(text)} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="result" className="w-full space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {mode === 'single' && result ? (
                <>
                  <ResultCard result={result} lawText={lawText} cardRef={cardRef} />
                  <ShareButtons cardRef={cardRef} lawText={lawText} result={result} />
                  <div className="flex justify-center gap-4 flex-wrap">
                    {user ? (
                      <Button onClick={() => setShowDebateChat(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                        <MessageSquare className="w-4 h-4 mr-2" />Débattre avec l'IA{!isPremium && <span className="ml-1.5 text-xs opacity-70 font-normal">(10/h)</span>}
                      </Button>
                    ) : (
                      <Button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 opacity-80">
                        <Lock className="w-3 h-3 mr-1.5" /><MessageSquare className="w-4 h-4 mr-2" />Débattre avec l'IA
                      </Button>
                    )}
                    <Button onClick={() => openSharePanel({ type: 'analyse', proposition: lawText, score_global: result.scores.overall, scores: result.scores, gagnants: result.winners, perdants: result.losers, effet_papillon: result.butterfly_effect })} disabled={shareCreating} variant="outline" className="border-white/20 hover:bg-white/10">{shareCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}Partager</Button>
                    <Button onClick={reset} variant="outline" className="border-white/20 hover:bg-white/10"><RotateCcw className="w-4 h-4 mr-2" />Nouvelle loi</Button>
                  </div>
                </>
              ) : debateResult ? (
                <>
                  <div className="w-full max-w-5xl mx-auto" ref={debateCardRef}>
                    <div className="h-2 flex rounded-t-lg overflow-hidden"><div className="flex-1 bg-blue-600"></div><div className="flex-1 bg-white"></div><div className="flex-1 bg-red-500"></div></div>
                    <div className="bg-card rounded-b-lg p-6 border border-t-0 border-white/10">
                      <div className="text-center mb-6"><div className="flex items-center justify-center gap-2 text-purple-400 mb-2"><Swords className="w-5 h-5" /><span className="text-sm font-medium uppercase tracking-widest">Mode Débat</span></div></div>
                      <div className="grid grid-cols-2 gap-6">
                        {[{ data: debateResult.law1, color: 'blue', label: 'LOI A' }, { data: debateResult.law2, color: 'red', label: 'LOI B' }].map(({ data, color, label }) => (
                          <div key={label} className="space-y-4">
                            <div className={`p-4 rounded-lg bg-${color}-500/10 border border-${color}-500/30`}><h3 className={`font-bold text-${color}-400 mb-2`}>{label}</h3><p className="text-white">"{data.text}"</p></div>
                            <div className="grid grid-cols-2 gap-2">
                              {[['economy','💰'],['social','❤️'],['ecology','🌿'],['faisabilite','⚙️']].map(([key, emoji]) => (
                                <div key={key} className="p-2 rounded-lg bg-black/30 text-center">
                                  <div className="text-xs text-muted-foreground">{emoji}</div>
                                  <div className={`text-xl font-bold ${(data.analysis.scores[key]??50) >= 60 ? 'text-green-400' : (data.analysis.scores[key]??50) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>{data.analysis.scores[key] ?? 50}</div>
                                </div>
                              ))}
                            </div>
                            <div className="text-center"><span className={`text-lg font-bold ${data.analysis.scores.overall >= 60 ? 'text-green-400' : data.analysis.scores.overall >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>Score: {data.analysis.scores.overall}/100</span></div>
                          </div>
                        ))}
                      </div>
                      <motion.div className="mt-6 text-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}>
                        {debateResult.law1.analysis.scores.overall > debateResult.law2.analysis.scores.overall ? (
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400"><Trophy className="w-5 h-5" /><span className="font-bold">LOI A GAGNE !</span></div>
                        ) : debateResult.law2.analysis.scores.overall > debateResult.law1.analysis.scores.overall ? (
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/50 text-red-400"><Trophy className="w-5 h-5" /><span className="font-bold">LOI B GAGNE !</span></div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400"><span className="font-bold">ÉGALITÉ !</span></div>
                        )}
                      </motion.div>
{debateResult.verdict && (
  <motion.div 
    className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 max-w-2xl mx-auto"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.7 }}
  >
    <p className="text-sm text-purple-200 italic text-center">{debateResult.verdict}</p>
  </motion.div>
)}
<div className="flex justify-center gap-4 mt-4 flex-wrap">
  <Button
    onClick={() => setShowDebateChat(true)}
    className="bg-gradient-to-r from-purple-600 to-pink-600"
  >
    <MessageSquare className="w-4 h-4 mr-2" />Débattre avec l'IA
  </Button>
</div>
                    </div>
                  </div>
                  <DebateShareButtons cardRef={debateCardRef} law1Text={law1Text} law2Text={law2Text} debateResult={debateResult} />
                  <div className="flex justify-center gap-3 flex-wrap">
                    <Button onClick={() => openSharePanel({ type: 'debat', proposition: law1Text, loi_a_titre: law1Text, loi_b_titre: law2Text, loi_a_scores: debateResult.law1.analysis.scores, loi_b_scores: debateResult.law2.analysis.scores, verdict: debateResult.verdict })} disabled={shareCreating} variant="outline" className="border-white/20 hover:bg-white/10">{shareCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}Partager</Button>
                    <Button onClick={reset} variant="outline" className="border-white/20 hover:bg-white/10"><RotateCcw className="w-4 h-4 mr-2" />Nouveau débat</Button>
                  </div>
                </>
              ) : explainResult ? (
                <motion.div key="explain-result" className="w-full max-w-3xl space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-green-400">
                      <BookOpen className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-widest">Mode Explication</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {explainSearching ? (
                        <span className="animate-pulse text-blue-400">🔍 Recherche : {explainSearching.slice(0, 40)}{explainSearching.length > 40 ? '…' : ''}</span>
                      ) : explainSourceCount > 0 ? (
                        <span className="text-green-400/70">✓ {explainSourceCount} source{explainSourceCount > 1 ? 's' : ''} consultée{explainSourceCount > 1 ? 's' : ''}</span>
                      ) : explainLoading ? (
                        <span className="animate-pulse">Analyse en cours…</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="bg-card rounded-xl border border-white/10 p-6 text-sm text-white/85 leading-relaxed whitespace-pre-wrap">{explainResult}</div>
                  {!explainLoading && (
                    <div className="flex justify-center gap-3 flex-wrap">
                      <Button onClick={() => { setMode('single'); setLawText(explainText); setExplainResult('') }} variant="outline" className="border-green-500/30 hover:bg-green-500/10 text-green-400">
                        <Sparkles className="w-4 h-4 mr-2" />Analyser l'impact →
                      </Button>
                      <Button onClick={() => { setMode('debate'); setLaw1Text(explainText); setExplainResult('') }} variant="outline" className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400">
                        <Swords className="w-4 h-4 mr-2" />Débattre →
                      </Button>
                      <Button onClick={reset} variant="outline" className="border-white/20 hover:bg-white/10"><RotateCcw className="w-4 h-4 mr-2" />Nouvelle recherche</Button>
                    </div>
                  )}
                </motion.div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground space-y-2">
        <p>Propulsé par l'IA Claude • Les résultats sont fictifs et à but éducatif</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</a>
          <a href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</a>
          <a href="/cgu" className="hover:text-white transition-colors">CGU / CGV</a>
          <button onClick={() => window.dispatchEvent(new Event('showCookieConsent'))} className="hover:text-white transition-colors">Gérer les cookies</button>
        </div>
      </footer>
    </main>
  )
}

export default function Home() {
  return <AuthProvider><ButterflyApp /></AuthProvider>
}
