'use client'

import { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Share2, RotateCcw, Sparkles, TrendingUp, Heart, Leaf, AlertTriangle, Trophy, Skull, History, Award, ChevronRight, X, Star, User, LogOut, Crown, Lock, Mail, Clock, MessageSquare, Send, Wrench, BookOpen, Network, RefreshCw, ThumbsUp, ThumbsDown, HelpCircle, Edit3, ArrowUpRight, ArrowDownRight, Minus, Lightbulb, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { getDailyLaws } from '@/lib/daily-laws'
import { getDailyExplorerLaws } from '@/lib/explorer-laws'
import SharePanel from '@/components/SharePanel'

// ── Rotating Placeholders ──
const ANALYSIS_PLACEHOLDERS = [
  "Et si on interdisait les jets privés ?",
  "Semaine de 4 jours obligatoire",
  "Revenu universel à 1000€/mois",
  "Interdiction du démarchage téléphonique",
  "Suppression des niches fiscales immobilières",
  "Droit de vote dès 16 ans",
  "Nationalisation des autoroutes",
  "Fin du changement d'heure",
  "Quota de logements sociaux à 40%",
  "Rendre le train moins cher que l'avion",
  "Taxer les superprofits à 25%",
  "Repas bio obligatoires dans les cantines",
]

const EXPLAIN_PLACEHOLDERS = [
  "Loi travail 2016",
  "Réforme des retraites 2023",
  "Loi climat et résilience",
  "Loi immigration 2024",
  "Loi EGALIM sur l'alimentation",
  "Réforme du RSA",
  "Loi Pacte sur les entreprises",
  "Loi bioéthique 2021",
]

const EXPLORE_PLACEHOLDERS = [
  "Interdire les publicités alimentaires pour enfants",
  "Rendre l'école obligatoire jusqu'à 18 ans",
  "Interdire l'élevage intensif",
  "Légaliser l'euthanasie",
  "Supprimer le Sénat",
  "Instaurer un service civique de 6 mois",
  "Nationaliser EDF et Engie",
  "Taxer les transactions financières",
]

function useRotatingPlaceholder(placeholders, interval = 4000) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex(i => (i + 1) % placeholders.length)
        setVisible(true)
      }, 300)
    }, interval)
    return () => clearInterval(timer)
  }, [paused, placeholders.length, interval])

  return { placeholder: placeholders[index], visible, pause: () => setPaused(true), resume: () => setPaused(false) }
}

// ── (Speech Recognition removed) ──
function useSpeechRecognition() {
  return { isListening: false, supported: false, toggle: () => {}, stop: () => {} }
}

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

  const refreshProfile = async () => {
    const supabase = createClient()
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(data)
    }
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
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, signInWithEmail, signOut, getAccessToken, refreshProfile, isPremium: profile?.is_premium || false, isCanceled: profile?.stripe_cancel_at_period_end || false, supabaseConfigured }}>
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
    <img src="/logo.png" className={className} alt="Butterfly" style={{ objectFit: 'contain' }} />
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
          <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black"><Crown className="w-4 h-4 mr-2" />Passer Premium (7,99€/mois) - Illimité</Button>
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
  const { user, signOut, isPremium, isCanceled, getAccessToken, refreshProfile } = useAuth()
  const [open, setOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgradeMenu = async () => {
    setUpgrading(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/stripe/create-checkout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      } else {
        const err = await res.json().catch(() => ({}))
        alert('Erreur : ' + (err.error || res.status))
      }
    } catch (e) { alert('Erreur réseau : ' + e.message) } finally { setUpgrading(false) }
  }

  const handleUnsubscribe = async () => {
    if (!confirm('Êtes-vous sûr de vouloir résilier votre abonnement Premium ? Votre accès restera actif jusqu\'à la fin de la période en cours.')) return
    setCanceling(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        await refreshProfile()
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

  const handleResume = async () => {
    setResuming(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        window.location.href = data.url
      } else {
        alert('Impossible d\'ouvrir le portail de gestion')
      }
    } catch {
      alert('Erreur réseau')
    } finally {
      setResuming(false)
    }
  }

  if (!user) return null
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 p-1.5 rounded-full bg-card border border-white/10 hover:border-blue-500/50 transition-colors">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isPremium ? 'ring-2 ring-yellow-500 bg-gradient-to-br from-yellow-600 via-blue-600 to-red-500' : 'bg-gradient-to-br from-blue-600 to-red-500'}`}>{user.email?.[0]?.toUpperCase() || 'U'}</div>
      </button>
      {open && (
        <motion.div className="absolute right-0 top-12 w-64 bg-card rounded-lg border border-white/10 shadow-xl overflow-hidden z-50" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="p-4 border-b border-white/10">
            <p className="font-medium truncate">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              {isPremium && isCanceled ? 'Premium — résiliation planifiée' : isPremium ? 'Citoyen Premium' : 'Compte gratuit'}
            </p>
          </div>
          <div className="p-2">
            {!isPremium && (
              <button onClick={handleUpgradeMenu} disabled={upgrading} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 text-left text-sm text-yellow-400 font-medium disabled:opacity-50 mb-1">
                <Crown className="w-4 h-4" />{upgrading ? 'Chargement...' : 'Passer Premium — 7,99€/mois'}
              </button>
            )}
            {isPremium && !isCanceled && (
              <button onClick={handleUnsubscribe} disabled={canceling} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-left text-sm text-red-400 disabled:opacity-50">
                <X className="w-4 h-4" />{canceling ? 'Résiliation...' : 'Se désabonner'}
              </button>
            )}
            {isPremium && isCanceled && (
              <button onClick={handleResume} disabled={resuming} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-500/10 text-left text-sm text-green-400 disabled:opacity-50">
                <RefreshCw className="w-4 h-4" />{resuming ? 'Chargement...' : 'Reprendre l\'abonnement'}
              </button>
            )}
            <a href="/faq" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm text-muted-foreground hover:text-white transition-colors">
              <HelpCircle className="w-4 h-4" />FAQ
            </a>
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
function DebateSummaryCard({ data, onClose, onCopy, copied, onShare, shareCreating }) {
  const getScoreColor = (s) => (s ?? 50) >= 60 ? 'text-green-400' : (s ?? 50) >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreKeys = [['💰','economy','Éco'],['❤️','social','Social'],['🌿','ecology','Écolo'],['⚙️','faisabilite','Faisab.']]
  return (
    <motion.div className="space-y-2 overflow-y-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex justify-between items-center">
        <p className="text-xs text-purple-400 uppercase font-semibold tracking-widest">📋 Résumé du débat</p>
        <div className="flex gap-2">
          {onShare && <button onClick={onShare} disabled={shareCreating} className="text-xs text-white flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 transition-colors disabled:opacity-50">{shareCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Share2 className="w-3 h-3" />}Partager</button>}
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
function DebateChatModal({ open, onClose, law, law1, law2, law1Scores, law2Scores, initialResult, getAccessToken, onUpgrade, onSignIn, onShare, shareCreating, onSaveMessages }) {
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

  // Save messages to parent for "Adapter ma loi"
  useEffect(() => {
    if (onSaveMessages && messages.length > 0) onSaveMessages(messages)
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
    if (messages.length < 1 || summaryLoading) return
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
          {summaryMode && summaryData ? (() => {
            const sharePayload = isDebateMode ? {
              type: 'debat',
              proposition: law1,
              loi_a_titre: law1,
              loi_b_titre: law2,
              loi_a_scores: summaryData.laws?.[0]?.scores || currentScores,
              loi_b_scores: summaryData.laws?.[1]?.scores || law2Scores || currentScores,
              verdict: summaryData.conclusion || summaryData.keyPoint || '',
            } : {
              type: 'analyse',
              proposition: law,
              score_global: currentScores.overall,
              scores: currentScores,
              gagnants: initialResult?.winners || '',
              perdants: initialResult?.losers || '',
              effet_papillon: summaryData.conclusion || summaryData.keyPoint || initialResult?.butterfly_effect || '',
            }
            const handleShare = onShare ? () => onShare(sharePayload) : null
            return <div className="space-y-3">
              {summaryData.raw
                ? <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"><div className="flex justify-between items-center mb-2"><p className="text-xs text-purple-400 uppercase font-semibold">📋 Résumé</p><div className="flex gap-2">{handleShare && <button onClick={handleShare} disabled={shareCreating} className="text-xs text-white flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 disabled:opacity-50">{shareCreating ? <Loader2 className="w-3 h-3 animate-spin inline mr-1"/> : <Share2 className="w-3 h-3 inline mr-1"/>}Partager</button>}<button onClick={copySummary} className="text-xs text-muted-foreground hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">{copied ? '✓ Copié' : 'Copier'}</button><button onClick={() => setSummaryMode(false)} className="text-xs text-muted-foreground hover:text-white px-2 py-0.5 rounded bg-white/5 hover:bg-white/10">× Fermer</button></div></div><p className="text-sm text-white/90 whitespace-pre-wrap">{summaryData.raw}</p></div>
                : <DebateSummaryCard data={summaryData} onClose={() => setSummaryMode(false)} onCopy={copySummary} copied={copied} onShare={handleShare} shareCreating={shareCreating} />}
              {!isDebateMode && law && <VoteButtons law={law} />}
            </div>
          })() : (
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
            {messages.length >= 1 && !summaryMode && (
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

// ExplorerLawCard — textes législatifs réels cliquables
function ExplorerLawCard({ law, onClick }) {
  const statusColor = law.status === 'Promulguée' ? 'text-green-400' : law.status === 'En débat' || law.status === 'En discussion' ? 'text-yellow-400' : 'text-blue-400'
  return (
    <motion.button
      onClick={() => onClick(law.query)}
      className="text-left p-3 rounded-xl bg-white/5 border border-violet-500/20 hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors w-full"
      whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className="text-lg shrink-0 leading-none mt-0.5">{law.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-semibold text-sm text-white leading-tight truncate">{law.title}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{law.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <span className="text-xs text-white/30">{law.source}</span>
        <span className={`text-xs font-medium ${statusColor}`}>{law.status}</span>
      </div>
    </motion.button>
  )
}

// Voted Law Card (for Top/Flop preview on homepage)
function VotedLawCard({ law, type, onClick }) {
  const isTop = type === 'top'
  const borderColor = isTop ? 'border-green-500/20 hover:border-green-500/40' : 'border-red-500/20 hover:border-red-500/40'
  const bgHover = isTop ? 'hover:bg-green-500/5' : 'hover:bg-red-500/5'
  const dotColor = isTop ? 'bg-green-500' : 'bg-red-500'
  const label = isTop ? 'Top' : 'Flop'
  const total = law.votes_pour + law.votes_contre
  const pourPct = total > 0 ? Math.round((law.votes_pour / total) * 100) : 50

  return (
    <motion.button
      onClick={onClick}
      className={`text-left p-3 rounded-xl bg-white/5 border ${borderColor} ${bgHover} transition-colors w-full`}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`shrink-0 w-2 h-2 rounded-full ${dotColor}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${isTop ? 'text-green-400' : 'text-red-400'}`}>{label}</span>
      </div>
      <p className="font-semibold text-sm text-white leading-tight line-clamp-2 mb-2">{law.law_text}</p>
      <div className="space-y-1.5">
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden flex">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${pourPct}%` }} />
          <div className="h-full bg-red-500 transition-all" style={{ width: `${100 - pourPct}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-green-400 flex items-center gap-0.5"><ThumbsUp className="w-3 h-3" />{law.votes_pour}</span>
          <span className="text-muted-foreground">{law.votes_total} votes</span>
          <span className="text-red-400 flex items-center gap-0.5"><ThumbsDown className="w-3 h-3" />{law.votes_contre}</span>
        </div>
        {law.score_overall != null && (
          <div className="flex gap-1.5 mt-0.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${law.score_overall >= 60 ? 'border-green-500/30 text-green-400' : law.score_overall >= 40 ? 'border-yellow-500/30 text-yellow-400' : 'border-red-500/30 text-red-400'}`}>
              Score {law.score_overall}/100
            </span>
          </div>
        )}
      </div>
    </motion.button>
  )
}

// Top/Flop Preview (homepage section below daily laws)
function TopFlopPreview({ onOpenTops, onSelectLaw }) {
  const [topLaw, setTopLaw] = useState(null)
  const [flopLaw, setFlopLaw] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard-v2')
      .then(r => r.json())
      .then(data => {
        if (data.top?.length > 0) setTopLaw(data.top[0])
        if (data.flop?.length > 0) setFlopLaw(data.flop[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-4">
      <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
    </div>
  )
  if (!topLaw && !flopLaw) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <p className="text-sm text-muted-foreground">Les lois les plus votées par les utilisateurs</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topLaw && <VotedLawCard law={topLaw} type="top" onClick={() => onSelectLaw(topLaw)} />}
        {flopLaw && <VotedLawCard law={flopLaw} type="flop" onClick={() => onSelectLaw(flopLaw)} />}
      </div>
      <div className="flex justify-center">
        <button
          onClick={onOpenTops}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/10 border border-white/10"
        >
          <Award className="w-3.5 h-3.5" />Voir les autres lois votées
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
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
        <motion.div key={item.id || i} className="p-3 rounded-lg bg-black/30 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} onClick={() => onSelectLaw(item)}>
          <div className="flex justify-between items-start gap-2"><p className="text-sm text-white line-clamp-1 flex-1">"{item.law_text}"</p><ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" /></div>
          <div className="mt-1 flex gap-2 text-xs"><span className="text-blue-400">💰{item.score_economy}</span><span className="text-white">❤️{item.score_social}</span><span className="text-green-400">🌿{item.score_ecology}</span></div>
        </motion.div>
      ))}
    </div>
  )
}

// Leaderboard Panel
function VoteButtons({ law }) {
  const { getAccessToken } = useAuth()
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!law) return
    fetch(`/api/votes?law=${encodeURIComponent(law.trim())}`)
      .then(r => r.json())
      .then(d => { setUpvotes(d.upvotes ?? 0); setDownvotes(d.downvotes ?? 0); setUserVote(d.userVote ?? null) })
      .catch(() => {})
  }, [law])

  const vote = async (v) => {
    if (loading) return
    setLoading(true)
    try {
      const token = await getAccessToken()
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      const res = await fetch('/api/vote', { method: 'POST', headers, body: JSON.stringify({ law: law.trim(), vote: v }) })
      const d = await res.json()
      setUpvotes(d.upvotes ?? 0)
      setDownvotes(d.downvotes ?? 0)
      setUserVote(d.userVote ?? null)
    } catch { /* silence */ } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <p className="text-xs text-muted-foreground">Votre avis sur cette loi&nbsp;:</p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => vote(1)}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${userVote === 1 ? 'bg-green-600 border-green-500 text-white' : 'bg-black/30 border-white/10 text-muted-foreground hover:border-green-500/50 hover:text-green-400'}`}
        >
          <ThumbsUp className="w-4 h-4" />{upvotes > 0 && <span>{upvotes}</span>}
        </button>
        <button
          onClick={() => vote(-1)}
          disabled={loading}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${userVote === -1 ? 'bg-red-700 border-red-600 text-white' : 'bg-black/30 border-white/10 text-muted-foreground hover:border-red-500/50 hover:text-red-400'}`}
        >
          <ThumbsDown className="w-4 h-4" />{downvotes > 0 && <span>{downvotes}</span>}
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// VotePanel — Vote pour/contre basé sur lawId (UUID)
// ═══════════════════════════════════════════════════════════
function VotePanel({ lawId }) {
  const { user, getAccessToken } = useAuth()
  const [pour, setPour] = useState(0)
  const [contre, setContre] = useState(0)
  const [userVote, setUserVote] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!lawId) return
    const fetchVotes = async () => {
      try {
        const token = await getAccessToken?.()
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(`/api/vote-v2/${lawId}`, { headers })
        const d = await res.json()
        setPour(d.votes_pour ?? 0)
        setContre(d.votes_contre ?? 0)
        setUserVote(d.user_vote ?? null)
      } catch {}
    }
    fetchVotes()
  }, [lawId])

  const vote = async (v) => {
    if (loading || !user) return
    // Optimistic update
    const prevPour = pour, prevContre = contre, prevVote = userVote
    if (userVote === v) {
      // Toggle off
      setUserVote(null)
      if (v === 'pour') setPour(p => Math.max(0, p - 1))
      else setContre(p => Math.max(0, p - 1))
    } else {
      if (userVote) { // Switching vote
        if (userVote === 'pour') setPour(p => Math.max(0, p - 1))
        else setContre(p => Math.max(0, p - 1))
      }
      setUserVote(v)
      if (v === 'pour') setPour(p => p + 1)
      else setContre(p => p + 1)
    }

    setLoading(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/vote-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ law_id: lawId, vote: v })
      })
      const d = await res.json()
      setPour(d.votes_pour ?? 0)
      setContre(d.votes_contre ?? 0)
      setUserVote(d.user_vote ?? null)
    } catch {
      // Revert on error
      setPour(prevPour); setContre(prevContre); setUserVote(prevVote)
    } finally { setLoading(false) }
  }

  const total = pour + contre
  const pourPct = total > 0 ? Math.round((pour / total) * 100) : 50

  if (!lawId) return null

  return (
    <motion.div className="w-full max-w-2xl mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-xl border border-white/10 bg-card/50 p-4 space-y-3">
        <p className="text-center text-sm font-medium text-white/80">Voteriez-vous cette loi ?</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => vote('pour')}
            disabled={loading || !user}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all ${userVote === 'pour' ? 'bg-green-600 border-green-500 text-white scale-105' : 'bg-black/30 border-white/10 text-muted-foreground hover:border-green-500/50 hover:text-green-400'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsUp className="w-4 h-4" />Pour{pour > 0 && <span className="ml-1">{pour}</span>}
          </button>
          <button
            onClick={() => vote('contre')}
            disabled={loading || !user}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-semibold transition-all ${userVote === 'contre' ? 'bg-red-700 border-red-600 text-white scale-105' : 'bg-black/30 border-white/10 text-muted-foreground hover:border-red-500/50 hover:text-red-400'} ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ThumbsDown className="w-4 h-4" />Contre{contre > 0 && <span className="ml-1">{contre}</span>}
          </button>
        </div>
        {total > 0 && (
          <div className="space-y-1">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden flex">
              <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${pourPct}%` }} />
              <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${100 - pourPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="text-green-400">{pourPct}% pour</span>
              <span>{total} vote{total > 1 ? 's' : ''}</span>
              <span className="text-red-400">{100 - pourPct}% contre</span>
            </div>
          </div>
        )}
        {!user && <p className="text-center text-xs text-muted-foreground">Connectez-vous pour voter</p>}
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// ScoreDiff — Comparaison scores v1 vs v2
// ═══════════════════════════════════════════════════════════
function ScoreDiff({ currentScores, previousScores, currentVersion }) {
  if (!previousScores || !currentScores || !currentVersion || currentVersion <= 1) return null

  const items = [
    { key: 'economy', label: 'Économie', emoji: '💰' },
    { key: 'social', label: 'Social', emoji: '❤️' },
    { key: 'ecology', label: 'Écologie', emoji: '🌿' },
    { key: 'faisabilite', label: 'Faisabilité', emoji: '⚙️' },
    { key: 'overall', label: 'Global', emoji: '⭐' },
  ]

  return (
    <motion.div className="w-full max-w-2xl mx-auto" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 space-y-3">
        <div className="flex items-center gap-2 justify-center">
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest">Version {currentVersion} — Évolution des scores</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {items.map(({ key, label, emoji }) => {
            const prev = previousScores[key] ?? 50
            const curr = currentScores[key] ?? 50
            const diff = curr - prev
            return (
              <div key={key} className="text-center space-y-1">
                <div className="text-xs text-muted-foreground">{emoji} {label}</div>
                <div className="text-xs text-white/50">{prev}</div>
                <div className="flex items-center justify-center gap-0.5">
                  {diff > 0 ? <ArrowUpRight className="w-3 h-3 text-green-400" /> : diff < 0 ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
                  <span className={`text-lg font-bold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white'}`}>{curr}</span>
                </div>
                {diff !== 0 && <div className={`text-xs font-medium ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>{diff > 0 ? '+' : ''}{diff}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════
// AdaptLawModal — Modifier sa loi après débat
// ═══════════════════════════════════════════════════════════
function AdaptLawModal({ open, onClose, originalLaw, chatMessages, getAccessToken, onReAnalyze }) {
  const [editedLaw, setEditedLaw] = useState(originalLaw || '')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [appliedSuggestions, setAppliedSuggestions] = useState(new Set())

  useEffect(() => {
    if (open && originalLaw) {
      setEditedLaw(originalLaw)
      setSuggestions([])
      setAppliedSuggestions(new Set())
      fetchSuggestions()
    }
  }, [open])

  const fetchSuggestions = async () => {
    if (!originalLaw || !chatMessages?.length) return
    setLoadingSuggestions(true)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ law: originalLaw, messages: chatMessages })
      })
      const data = await res.json()
      if (data.suggestions) setSuggestions(data.suggestions)
    } catch (err) {
      console.error('Suggestions error:', err)
    } finally { setLoadingSuggestions(false) }
  }

  const applySuggestion = (idx, modification) => {
    setEditedLaw(prev => prev + ' ' + modification)
    setAppliedSuggestions(prev => new Set([...prev, idx]))
  }

  const handleReAnalyze = () => {
    if (!editedLaw.trim()) return
    onReAnalyze(editedLaw.trim())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-blue-400" />
            Adapter ma loi
          </DialogTitle>
          <DialogDescription>Modifiez votre proposition en tenant compte du débat</DialogDescription>
        </DialogHeader>

        {/* Suggestions */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
              <Loader2 className="w-4 h-4 animate-spin" />Analyse du débat en cours...
            </div>
          ) : suggestions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-400">
                <Lightbulb className="w-4 h-4" />Suggestions basées sur le débat
              </div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => !appliedSuggestions.has(i) && applySuggestion(i, s.modification)}
                  disabled={appliedSuggestions.has(i)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${appliedSuggestions.has(i) ? 'border-green-500/30 bg-green-500/10 opacity-70' : 'border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/5'}`}
                >
                  <div className="flex items-start gap-2">
                    {appliedSuggestions.has(i) ? <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> : <ChevronRight className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />}
                    <div>
                      <p className="text-sm text-white font-medium">{s.modification}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.raison}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Votre proposition modifiée</label>
            <textarea
              value={editedLaw}
              onChange={e => setEditedLaw(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-white resize-y focus:outline-none focus:border-blue-500/50"
              placeholder="Modifiez votre proposition de loi..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-3 border-t border-white/10">
          <Button onClick={handleReAnalyze} disabled={!editedLaw.trim() || editedLaw.trim() === originalLaw} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500">
            <Sparkles className="w-4 h-4 mr-2" />Re-analyser cette version
          </Button>
          <Button onClick={onClose} variant="outline" className="border-white/20">Annuler</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LeaderboardV2Panel({ onSelectLaw }) {
  const [top, setTop] = useState([])
  const [flop, setFlop] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard-v2')
      .then(r => r.json())
      .then(data => { setTop(data.top || []); setFlop(data.flop || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-yellow-400" /></div>
  if (top.length === 0 && flop.length === 0) return (
    <div className="text-center py-8 text-muted-foreground">
      <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
      <p>Pas encore de votes</p>
      <p className="text-xs mt-1">Analysez une loi et votez pour qu'elle apparaisse ici !</p>
    </div>
  )

  return (
    <div className="space-y-5">
      {onSelectLaw && <p className="text-xs text-muted-foreground text-center">Cliquez sur une loi pour la tester</p>}

      {top.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-4 h-4 text-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-widest">Top {top.length}</span>
          </div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
            {top.map((item, i) => {
              const total = item.votes_pour + item.votes_contre
              const pourPct = total > 0 ? Math.round((item.votes_pour / total) * 100) : 50
              return (
                <motion.div
                  key={item.law_id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/30 border border-white/10 hover:border-green-500/50 cursor-pointer transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelectLaw && onSelectLaw(item)}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    i === 0 ? 'bg-yellow-500 text-black' : i === 1 ? 'bg-gray-400 text-black' : i === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white'
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-1">{item.law_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden flex">
                        <div className="h-full bg-green-500" style={{ width: `${pourPct}%` }} />
                        <div className="h-full bg-red-500" style={{ width: `${100 - pourPct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.votes_total}v</span>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-green-400 flex items-center gap-0.5 shrink-0">
                    <ThumbsUp className="w-3 h-3" />{item.votes_pour}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {flop.length > 0 && (
        <div className="space-y-1.5 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsDown className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400 uppercase tracking-widest">Flop {flop.length}</span>
          </div>
          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
            {flop.map((item, i) => {
              const total = item.votes_pour + item.votes_contre
              const pourPct = total > 0 ? Math.round((item.votes_pour / total) * 100) : 50
              return (
                <motion.div
                  key={item.law_id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-black/30 border border-red-900/30 hover:border-red-500/50 cursor-pointer transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onSelectLaw && onSelectLaw(item)}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 bg-red-900/50 text-red-300">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white line-clamp-1">{item.law_text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden flex">
                        <div className="h-full bg-green-500" style={{ width: `${pourPct}%` }} />
                        <div className="h-full bg-red-500" style={{ width: `${100 - pourPct}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.votes_total}v</span>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-red-400 flex items-center gap-0.5 shrink-0">
                    <ThumbsDown className="w-3 h-3" />{item.votes_contre}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Law Preview Modal (shown when clicking a law from sidebar/top-flop)
function LawPreviewModal({ law, onClose, onAnalyze }) {
  if (!law) return null
  const scoreColor = (v) => v >= 60 ? 'text-green-400' : v >= 40 ? 'text-yellow-400' : 'text-red-400'
  const overallColor = law.score_overall >= 60 ? 'border-green-500 bg-green-500/20 text-green-400' : law.score_overall >= 40 ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' : 'border-red-500 bg-red-500/20 text-red-400'

  return (
    <Dialog open={!!law} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10 text-white max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold leading-tight pr-6">{law.law_text}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">Résumé de l'analyse</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {law.score_overall != null && (
            <div className="flex justify-center">
              <div className={`px-3 py-1.5 rounded-full border ${overallColor} text-sm font-bold flex items-center gap-1.5`}>
                <Star className="w-3.5 h-3.5" />Score Global : {law.score_overall}/100
              </div>
            </div>
          )}
          {(law.score_economy != null || law.score_social != null || law.score_ecology != null) && (
            <div className="grid grid-cols-3 gap-2">
              {law.score_economy != null && (
                <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                  <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-400" />
                  <p className={`text-lg font-bold tabular-nums ${scoreColor(law.score_economy)}`}>{law.score_economy}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Économie</p>
                </div>
              )}
              {law.score_social != null && (
                <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                  <Heart className="w-4 h-4 mx-auto mb-1 text-white" />
                  <p className={`text-lg font-bold tabular-nums ${scoreColor(law.score_social)}`}>{law.score_social}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Social</p>
                </div>
              )}
              {law.score_ecology != null && (
                <div className="text-center p-2 rounded-lg bg-white/5 border border-white/10">
                  <Leaf className="w-4 h-4 mx-auto mb-1 text-green-400" />
                  <p className={`text-lg font-bold tabular-nums ${scoreColor(law.score_ecology)}`}>{law.score_ecology}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Écologie</p>
                </div>
              )}
            </div>
          )}
          {law.winners && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-1.5 mb-1"><Trophy className="w-3.5 h-3.5 text-green-400" /><span className="text-[10px] font-semibold text-green-400 uppercase">Gagnants</span></div>
              <p className="text-sm text-green-100/80">{law.winners}</p>
            </div>
          )}
          {law.losers && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-1.5 mb-1"><Skull className="w-3.5 h-3.5 text-red-400" /><span className="text-[10px] font-semibold text-red-400 uppercase">Perdants</span></div>
              <p className="text-sm text-red-100/80">{law.losers}</p>
            </div>
          )}
          {law.butterfly_effect && (
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-1.5 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-purple-400" /><span className="text-[10px] font-semibold text-purple-400 uppercase">Effet Papillon</span></div>
              <p className="text-sm text-purple-100/80 italic">{law.butterfly_effect}</p>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button onClick={() => onAnalyze(law.law_text)} className="flex-1 bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-500 hover:to-red-400">
              <Sparkles className="w-4 h-4 mr-2" />Analyser cette loi
            </Button>
            <Button onClick={onClose} variant="outline" className="border-white/20 hover:bg-white/10">Fermer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main App
function ButterflyApp() {
  const { user, profile, loading: authLoading, isPremium, getAccessToken } = useAuth()
  const [mode, setMode] = useState('single')
  const [lawText, setLawText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showSidebar, setShowSidebar] = useState(false)
  const [sidebarTab, setSidebarTab] = useState('history')
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [rateLimitExceeded, setRateLimitExceeded] = useState(null)
  const [showDebateChat, setShowDebateChat] = useState(false)
  const [explainText, setExplainText] = useState('')
  const [explainResult, setExplainResult] = useState('')
  const [exploreText, setExploreText] = useState('')
  const [explainLoading, setExplainLoading] = useState(false)
  const [explainSourceCount, setExplainSourceCount] = useState(0)
  const [explainSearching, setExplainSearching] = useState('')
  const [sharePanel, setSharePanel] = useState(null)   // { shareId, proposition, scoreGlobal } | null
  const [shareCreating, setShareCreating] = useState(false)
  const [proposalSeed, setProposalSeed] = useState(0)
  // ── Versioning + Vote + Adapt ──
  const [lawId, setLawId] = useState(null)             // UUID from laws_history
  const [lawVersion, setLawVersion] = useState(1)
  const [parentId, setParentId] = useState(null)
  const [previousScores, setPreviousScores] = useState(null)
  const [showAdaptModal, setShowAdaptModal] = useState(false)
  const [debateMessages, setDebateMessages] = useState([]) // saved from debate for suggestions
  const [previewLaw, setPreviewLaw] = useState(null) // law preview modal data
  const [pdfLoading, setPdfLoading] = useState(false) // PDF export loading

  // ── Speech Recognition + Rotating Placeholders ──
  const speech = useSpeechRecognition()
  const analysisPlaceholder = useRotatingPlaceholder(ANALYSIS_PLACEHOLDERS)
  const explainPlaceholder = useRotatingPlaceholder(EXPLAIN_PLACEHOLDERS)
  const explorePlaceholder = useRotatingPlaceholder(EXPLORE_PLACEHOLDERS)

  // ── Lecture des URL params (ex: depuis l'Explorateur) ─
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const loi = params.get('loi')
    const modeParam = params.get('mode')
    if (loi) {
      if (modeParam === 'explain') {
        setMode('explain')
        setExplainText(decodeURIComponent(loi))
      } else {
        setMode('single')
        setLawText(decodeURIComponent(loi))
      }
      // Nettoyage de l'URL sans rechargement
      window.history.replaceState({}, '', '/')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const cardRef = useRef(null)

  const analyzeLaw = async (overrideLaw, { asRevision = false } = {}) => {
    const text = overrideLaw || lawText
    if (!text.trim()) return
    // If re-analyzing, save current scores as previous
    if (asRevision && result?.scores) {
      setPreviousScores({ ...result.scores })
    }
    if (overrideLaw) setLawText(overrideLaw)
    setLoading(true); setError(null); setResult(null)
    try {
      const token = await getAccessToken()
      const hdrs = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      const payload = { law: text.trim() }
      if (asRevision && lawId) {
        payload.parent_id = parentId || lawId  // chain to root
        payload.version = (lawVersion || 1) + 1
      }
      const response = await fetch('/api/analyze', { method: 'POST', headers: hdrs, body: JSON.stringify(payload) })
      const data = await response.json()
      if (response.status === 429) { setRateLimitExceeded({ userTier: data.userTier, resetAt: data.resetAt }); return }
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse')
      setResult(data)
      setLawId(data.lawId || null)
      setLawVersion(data.version || 1)
      if (data.parentId) setParentId(data.parentId)
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
      if (response.status === 429) {
        const data = await response.json()
        setRateLimitExceeded({ userTier: data.userTier, resetAt: data.resetAt })
        return
      }
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
    try {
      const response = await fetch('/api/stripe/create-checkout', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
      const data = await response.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Erreur lors de la création du lien de paiement')
    } catch {
      setError('Erreur réseau, veuillez réessayer.')
    }
  }
  
  const reset = () => { setLawText(''); setResult(null); setExplainText(''); setExplainResult(''); setExplainSourceCount(0); setExplainSearching(''); setError(null); setRateLimitExceeded(null); setLawId(null); setLawVersion(1); setParentId(null); setPreviousScores(null); setDebateMessages([]) }

  const hasResults = mode === 'single' ? result : mode === 'explain' ? explainResult : false
  
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>
  
  return (
    <main className="min-h-screen flex flex-col">
      {rateLimitExceeded && <SoftWall userTier={rateLimitExceeded.userTier} resetAt={rateLimitExceeded.resetAt} onSignIn={() => { setRateLimitExceeded(null); setShowAuthModal(true) }} onUpgrade={() => { setRateLimitExceeded(null); handleUpgrade() }} />}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {sharePanel && <SharePanel shareId={sharePanel.shareId} proposition={sharePanel.proposition} scoreGlobal={sharePanel.scoreGlobal} onClose={() => setSharePanel(null)} />}
      <DebateChatModal open={showDebateChat} onClose={() => setShowDebateChat(false)} law={lawText} initialResult={result} getAccessToken={getAccessToken} onUpgrade={handleUpgrade} onSignIn={() => { setShowDebateChat(false); setShowAuthModal(true) }} onShare={openSharePanel} shareCreating={shareCreating} onSaveMessages={(msgs) => setDebateMessages(msgs)} />
      <AdaptLawModal open={showAdaptModal} onClose={() => setShowAdaptModal(false)} originalLaw={lawText} chatMessages={debateMessages} getAccessToken={getAccessToken} onReAnalyze={(newLaw) => { analyzeLaw(newLaw, { asRevision: true }) }} />
      <LawPreviewModal law={previewLaw} onClose={() => setPreviewLaw(null)} onAnalyze={(text) => { setPreviewLaw(null); setShowSidebar(false); setLawText(text); setMode('single') }} />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      {!user && showBanner && (
        <motion.div className="relative z-20 mx-4 mt-3 mb-0 rounded-xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-red-900/40 border border-white/10 px-5 py-5 md:px-8 md:py-6 text-center" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => setShowBanner(false)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          <h2 className="text-lg md:text-xl font-bold text-white mb-2">Vous votez pour des lois. Vous devriez les comprendre.</h2>
          <p className="text-sm text-white/70 leading-relaxed mb-4 max-w-xl mx-auto">Analysez n'importe quelle proposition de loi en 30 secondes : qui y gagne, qui y perd, quels effets en chaîne. Testez vos convictions face aux faits, pas aux slogans.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setShowAuthModal(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-5">Créer un compte</Button>
            <button onClick={() => setShowBanner(false)} className="text-sm text-white/50 hover:text-white/80 transition-colors underline underline-offset-2">Essayer sans compte</button>
          </div>
        </motion.div>
      )}

      <header className="relative z-20 flex justify-between items-center p-4">
        <a href="/faq" className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-white/10 hover:border-blue-500/50 transition-colors text-sm text-muted-foreground hover:text-white">
          <HelpCircle className="w-4 h-4" /><span className="hidden sm:inline">FAQ</span>
        </a>
        <button onClick={() => { reset(); setShowSidebar(false) }} className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 hover:opacity-80 transition-opacity">
          <span className="text-sm font-bold"><span className="text-blue-400">Butterfly</span><span className="text-white">.gov</span></span>
        </button>
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
                <TabsList className="w-full mb-4"><TabsTrigger value="history" className="flex-1"><History className="w-4 h-4 mr-1" />Historique</TabsTrigger><TabsTrigger value="tops" className="flex-1"><Trophy className="w-4 h-4 mr-1" />Top/Flop</TabsTrigger></TabsList>
                <TabsContent value="history"><HistoryPanel onSelectLaw={(item) => setPreviewLaw(item)} /></TabsContent>
                <TabsContent value="tops"><LeaderboardV2Panel onSelectLaw={(item) => setPreviewLaw(item)} /></TabsContent>
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
                <motion.div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-blue-600 via-white/20 to-red-500 p-[2px]" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center"><ButterflyIcon className="w-40 h-40 text-white" /></div>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold"><span className="text-blue-400">Butterfly</span><span className="text-white">.gov</span></h1>
                <p className="text-muted-foreground text-lg">Le simulateur de conséquences politiques</p>
              </div>
              
              <div className="flex justify-center">
                <div className="inline-flex rounded-full bg-black/30 p-1 border border-white/10">
                  <button onClick={() => { setMode('single'); setProposalSeed(s => s + 1) }} className={`px-4 py-2 rounded-full text-sm transition-colors ${mode === 'single' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-white'}`}><Sparkles className="w-4 h-4 inline mr-1" />Analyser</button>
                  <button onClick={() => { setMode('explain'); setProposalSeed(s => s + 1) }} className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${mode === 'explain' ? 'bg-green-700 text-white' : 'text-muted-foreground hover:text-white'}`}><BookOpen className="w-4 h-4" />Expliquer</button>
                  <button onClick={() => { setMode('explore'); setProposalSeed(s => s + 1) }} className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${mode === 'explore' ? 'bg-violet-700 text-white' : 'text-muted-foreground hover:text-white'}`}><Network className="w-4 h-4" />Explorer</button>
                </div>
              </div>
              
              {mode === 'single' ? (
                <div className="space-y-4">
                  <label className="block text-center text-xl text-white/80">Si vous étiez Président, quelle loi passeriez-vous ?</label>
                  <div className="relative">
                    <Input type="text" value={lawText} onChange={(e) => setLawText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyzeLaw()} onFocus={() => { if (!lawText) setLawText(analysisPlaceholder.placeholder); analysisPlaceholder.pause() }} onBlur={() => { if (!lawText) analysisPlaceholder.resume() }} placeholder="" className="h-16 text-lg pl-6 pr-28 rounded-full bg-card border-2 border-white/10 focus:border-blue-500 transition-all pulse-glow" disabled={loading} />
                    {!lawText && <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg text-muted-foreground pointer-events-none transition-opacity duration-300 ${analysisPlaceholder.visible ? 'opacity-100' : 'opacity-0'}`}>{analysisPlaceholder.placeholder}</span>}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button onClick={() => analyzeLaw()} disabled={loading || !lawText.trim()} className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-500 hover:to-red-400"><Sparkles className="w-5 h-5" /></Button>
                    </div>
                  </div>
                </div>
              ) : mode === 'explain' ? (
                <div className="space-y-4">
                  <label className="block text-center text-xl text-white/80">Quelle loi ou réforme voulez-vous comprendre ?</label>
                  <div className="relative">
                    <Input type="text" value={explainText} onChange={(e) => setExplainText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyzeExplain()} onFocus={() => { if (!explainText) setExplainText(explainPlaceholder.placeholder); explainPlaceholder.pause() }} onBlur={() => { if (!explainText) explainPlaceholder.resume() }} placeholder="" className="h-16 text-lg pl-6 pr-28 rounded-full bg-card border-2 border-white/10 focus:border-green-600 transition-all" disabled={explainLoading} />
                    {!explainText && <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg text-muted-foreground pointer-events-none transition-opacity duration-300 ${explainPlaceholder.visible ? 'opacity-100' : 'opacity-0'}`}>{explainPlaceholder.placeholder}</span>}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button onClick={analyzeExplain} disabled={explainLoading || !explainText.trim()} className="h-12 w-12 rounded-full bg-green-700 hover:bg-green-600"><BookOpen className="w-5 h-5" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Explication factuelle, sans jugement de valeur · Sources primaires citées</p>
                </div>
              ) : mode === 'explore' ? (
                <div className="space-y-4">
                  <label className="block text-center text-xl text-white/80">Quelle loi voulez-vous explorer en constellation ?</label>
                  <div className="relative">
                    <Input type="text" value={exploreText} onChange={(e) => setExploreText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && exploreText.trim().length >= 5) window.location.href = `/explorer?loi=${encodeURIComponent(exploreText.trim())}` }} onFocus={() => { if (!exploreText) setExploreText(explorePlaceholder.placeholder); explorePlaceholder.pause() }} onBlur={() => { if (!exploreText) explorePlaceholder.resume() }} placeholder="" className="h-16 text-lg pl-6 pr-28 rounded-full bg-card border-2 border-white/10 focus:border-violet-600 transition-all" disabled={false} />
                    {!exploreText && <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg text-muted-foreground pointer-events-none transition-opacity duration-300 ${explorePlaceholder.visible ? 'opacity-100' : 'opacity-0'}`}>{explorePlaceholder.placeholder}</span>}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button onClick={() => { if (exploreText.trim().length >= 5) window.location.href = `/explorer?loi=${encodeURIComponent(exploreText.trim())}` }} disabled={exploreText.trim().length < 5} className="h-12 w-12 rounded-full bg-violet-700 hover:bg-violet-600"><Network className="w-5 h-5" /></Button>
                    </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">Carte radiale d'implications · 3 anneaux de profondeur · Cliquez les nœuds pour naviguer</p>
                </div>
              ) : null}

              {mode === 'explore' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Textes en cours — Assemblée & Sénat</p>
                    <button onClick={() => setProposalSeed(s => s + 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-white/10">
                      <RefreshCw className="w-3 h-3" />Voir d'autres
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getDailyExplorerLaws(proposalSeed).map((law) => (
                      <ExplorerLawCard key={law.id} law={law} onClick={(query) => setExploreText(query)} />
                    ))}
                  </div>
                </div>
              )}
              
              {error && <motion.p className="text-center text-red-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
              
              {mode === 'single' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Propositions du jour</p>
                    <button onClick={() => setProposalSeed(s => s + 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-white/10">
                      <RefreshCw className="w-3 h-3" />Voir d'autres
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getDailyLaws(proposalSeed).map((law) => (
                      <DailyLawCard key={law.id} law={law} onClick={(text) => setLawText(text)} />
                    ))}
                  </div>
                  <TopFlopPreview
                    onOpenTops={() => { setSidebarTab('tops'); setShowSidebar(true) }}
                    onSelectLaw={(item) => setPreviewLaw(item)}
                  />
                </div>
              )}

              {mode === 'explain' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Textes en cours — Assemblée & Sénat</p>
                    <button onClick={() => setProposalSeed(s => s + 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-white/10">
                      <RefreshCw className="w-3 h-3" />Voir d'autres
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getDailyExplorerLaws(proposalSeed).map((law) => (
                      <ExplorerLawCard key={law.id} law={law} onClick={(query) => setExplainText(query)} />
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
                  {lawVersion > 1 && previousScores && <ScoreDiff currentScores={result.scores} previousScores={previousScores} currentVersion={lawVersion} />}
                  {lawId && <VotePanel lawId={lawId} />}
                  {!lawId && <VoteButtons law={lawText} />}
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
                    {user && debateMessages.length > 0 && (
                      <Button onClick={() => setShowAdaptModal(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                        <Edit3 className="w-4 h-4 mr-2" />Adapter ma loi
                      </Button>
                    )}
                    <Button onClick={() => openSharePanel({ type: 'analyse', proposition: lawText, score_global: result.scores.overall, scores: result.scores, gagnants: result.winners, perdants: result.losers, effet_papillon: result.butterfly_effect })} disabled={shareCreating} variant="outline" className="border-white/20 hover:bg-white/10">{shareCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}Partager sur vos réseaux</Button>
                    <Button onClick={reset} variant="outline" className="border-white/20 hover:bg-white/10"><RotateCcw className="w-4 h-4 mr-2" />Nouvelle loi</Button>
                    <Button onClick={() => window.location.href = `/explorer?loi=${encodeURIComponent(lawText)}`} variant="outline" className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400"><Network className="w-4 h-4 mr-2" />Explorer les implications</Button>
                  </div>
                </>
              ) : explainResult ? (
                <motion.div key="explain-result" className="w-full max-w-3xl mx-auto space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    <>
                    <VoteButtons law={explainText} />
                    <div className="flex justify-center gap-3 flex-wrap">
                      <Button
                        onClick={async () => {
                          setPdfLoading(true)
                          try {
                            const res = await fetch('/api/export-pdf', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ title: explainText, content: explainResult }),
                            })
                            if (!res.ok) throw new Error('Erreur PDF')
                            const blob = await res.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `butterfly-explication-${explainText.slice(0, 40).replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæ ]/gi, '').trim().replace(/\s+/g, '-').toLowerCase()}.pdf`
                            a.click()
                            URL.revokeObjectURL(url)
                          } catch (err) { setError('Impossible de générer le PDF : ' + err.message) }
                          finally { setPdfLoading(false) }
                        }}
                        disabled={pdfLoading}
                        variant="outline"
                        className="border-green-500/30 hover:bg-green-500/10 text-green-400"
                      >
                        {pdfLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Télécharger en PDF
                      </Button>
                      <Button onClick={() => { setMode('single'); setLawText(explainText); setExplainResult('') }} variant="outline" className="border-green-500/30 hover:bg-green-500/10 text-green-400">
                        <Sparkles className="w-4 h-4 mr-2" />Analyser l'impact →
                      </Button>
                      <Button onClick={() => window.location.href = `/explorer?loi=${encodeURIComponent(explainText)}`} variant="outline" className="border-violet-500/30 hover:bg-violet-500/10 text-violet-400">
                        <Network className="w-4 h-4 mr-2" />Explorer la carte →
                      </Button>
                      <Button onClick={reset} variant="outline" className="border-white/20 hover:bg-white/10"><RotateCcw className="w-4 h-4 mr-2" />Nouvelle recherche</Button>
                    </div>
                    </>
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
          <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
          <button onClick={() => window.dispatchEvent(new Event('showCookieConsent'))} className="hover:text-white transition-colors">Gérer les cookies</button>
        </div>
      </footer>
    </main>
  )
}

export default function Home() {
  return <AuthProvider><ButterflyApp /></AuthProvider>
}
