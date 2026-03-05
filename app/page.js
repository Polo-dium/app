'use client'

import { useState, useRef, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Share2, RotateCcw, Sparkles, TrendingUp, Heart, Leaf, AlertTriangle, Trophy, Skull, History, Award, Swords, ChevronRight, X, Star, User, LogOut, Crown, Lock, Mail, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import html2canvas from 'html2canvas'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'

// Auth Context
const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  
  useEffect(() => {
    const supabase = createClient()
    
    // If Supabase is not configured, run in demo mode
    if (!supabase) {
      setLoading(false)
      setSupabaseConfigured(false)
      return
    }
    
    setSupabaseConfigured(true)
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      if (session?.user) {
        fetchProfile(session.user.id, supabase)
      } else {
        setLoading(false)
      }
    })
    
    // Listen for auth changes
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }
  
  const signInWithGoogle = async () => {
    const supabase = createClient()
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }
  
  const signInWithEmail = async (email) => {
    const supabase = createClient()
    if (!supabase) return { error: { message: 'Supabase non configuré' } }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    return { error }
  }
  
  const signOut = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
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
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithEmail, 
      signOut,
      getAccessToken,
      isPremium: profile?.is_premium || false,
      supabaseConfigured
    }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  return useContext(AuthContext)
}

// Butterfly icon component
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

// Trigger confetti
function triggerConfetti(score) {
  if (score >= 70) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#ffffff', '#ef4444']
    })
  }
}

// Loading states messages
const LOADING_MESSAGES = [
  "Analyse macro-économique en cours...",
  "Calcul des impacts sociaux...",
  "Évaluation écologique...",
  "Recherche de l'effet papillon...",
  "Compilation des résultats..."
]

// Loading component with dynamic messages
function AnalysisLoader() {
  const [messageIndex, setMessageIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-12 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <ButterflyIcon className="w-16 h-16 text-blue-400" />
      </motion.div>
      <motion.p 
        key={messageIndex}
        className="text-lg text-muted-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {LOADING_MESSAGES[messageIndex]}
      </motion.p>
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
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
    if (!error) {
      setSent(true)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="text-xl">Connexion à Butterfly.gov</DialogTitle>
          <DialogDescription>
            Connectez-vous pour sauvegarder vos lois et débloquer plus de tests
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!sent ? (
            <>
              <Button 
                onClick={signInWithGoogle}
                className="w-full bg-white text-black hover:bg-gray-100"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuer avec Google
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
                <Button 
                  onClick={handleEmailSignIn}
                  disabled={!email || loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Recevoir un lien magique
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-2">
              <Mail className="w-12 h-12 mx-auto text-blue-400" />
              <p className="text-lg font-medium">Email envoyé !</p>
              <p className="text-sm text-muted-foreground">
                Vérifiez votre boîte mail et cliquez sur le lien pour vous connecter.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Soft Wall - Rate Limit Exceeded
function SoftWall({ userTier, resetAt, onSignIn, onUpgrade }) {
  const timeUntilReset = Math.max(0, Math.ceil((new Date(resetAt) - new Date()) / 60000))
  
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="max-w-md w-full bg-card rounded-2xl p-6 border border-white/10 space-y-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-2">
            <Clock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold">Limite atteinte</h2>
          <p className="text-muted-foreground">
            {userTier === 'anonymous' 
              ? "Vous avez épuisé vos 5 tests gratuits de l'heure."
              : "Vous avez atteint votre limite de 10 tests de l'heure."}
          </p>
        </div>
        
        <div className="bg-black/30 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">Prochain reset dans</p>
          <p className="text-3xl font-bold text-blue-400">{timeUntilReset} min</p>
        </div>
        
        <div className="space-y-3">
          {userTier === 'anonymous' && (
            <Button onClick={onSignIn} className="w-full bg-blue-600 hover:bg-blue-500">
              <User className="w-4 h-4 mr-2" />
              Créer un compte gratuit (+5 tests/h)
            </Button>
          )}
          
          <Button onClick={onUpgrade} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black">
            <Crown className="w-4 h-4 mr-2" />
            Passer Premium (2,99€/mois) - Illimité
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Premium = Tests illimités + Mode Débat exclusif
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Premium Badge
function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-xs font-bold">
      <Crown className="w-3 h-3" />
      PREMIUM
    </span>
  )
}

// User Menu
function UserMenu() {
  const { user, profile, signOut, isPremium } = useAuth()
  const [open, setOpen] = useState(false)
  
  if (!user) return null
  
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-white/10 hover:border-blue-500/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center text-white font-bold text-sm">
          {user.email?.[0]?.toUpperCase() || 'U'}
        </div>
        {isPremium && <PremiumBadge />}
      </button>
      
      {open && (
        <motion.div
          className="absolute right-0 top-12 w-64 bg-card rounded-lg border border-white/10 shadow-xl overflow-hidden z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-4 border-b border-white/10">
            <p className="font-medium truncate">{user.email}</p>
            <p className="text-sm text-muted-foreground">
              {isPremium ? 'Citoyen Premium' : 'Compte gratuit'}
            </p>
          </div>
          <div className="p-2">
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// Animated counter component
function AnimatedCounter({ value, color, label, icon: Icon, delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)
  
  useEffect(() => {
    setDisplayValue(0)
    setIsAnimating(true)
    
    const timeout = setTimeout(() => {
      let start = 0
      const end = value
      const duration = 1500
      const increment = end / (duration / 16)
      
      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setDisplayValue(end)
          setIsAnimating(false)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(start))
        }
      }, 16)
      
      return () => clearInterval(timer)
    }, delay)
    
    return () => clearTimeout(timeout)
  }, [value, delay])
  
  const getColorClass = () => {
    if (value >= 60) return 'text-green-400'
    if (value >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getGlowClass = () => {
    if (!isAnimating) return ''
    if (value >= 60) return 'shadow-[0_0_30px_rgba(74,222,128,0.5)]'
    if (value >= 40) return 'shadow-[0_0_30px_rgba(250,204,21,0.5)]'
    return 'shadow-[0_0_30px_rgba(248,113,113,0.5)]'
  }
  
  return (
    <motion.div 
      className={`flex flex-col items-center p-4 rounded-xl bg-black/30 border border-white/10 transition-shadow duration-500 ${getGlowClass()}`}
      initial={{ scale: 0.5, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      <motion.div
        animate={isAnimating ? { rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 0.5, repeat: isAnimating ? Infinity : 0 }}
      >
        <Icon className={`w-6 h-6 mb-2 ${color}`} />
      </motion.div>
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <motion.span 
        className={`text-4xl font-bold tabular-nums ${getColorClass()}`}
        animate={isAnimating ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3, repeat: isAnimating ? Infinity : 0 }}
      >
        {displayValue}
      </motion.span>
      <span className="text-xs text-muted-foreground">/100</span>
    </motion.div>
  )
}

// Result Card Component
function ResultCard({ result, lawText, cardRef }) {
  useEffect(() => {
    if (result?.scores?.overall) {
      triggerConfetti(result.scores.overall)
    }
  }, [result])
  
  return (
    <motion.div
      ref={cardRef}
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, type: "spring" }}
    >
      <Card className="score-card-bg border-0 overflow-hidden shadow-2xl">
        <motion.div 
          className="h-2 flex"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex-1 bg-blue-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-500"></div>
        </motion.div>
        
        <CardContent className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <motion.div 
              className="flex items-center justify-center gap-2 text-blue-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ButterflyIcon className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-widest">Butterfly.gov</span>
              <ButterflyIcon className="w-5 h-5" />
            </motion.div>
            <motion.h2 
              className="text-xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              "{lawText}"
            </motion.h2>
            <p className="text-xs text-muted-foreground">Analyse d'impact présidentiel</p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <AnimatedCounter value={result.scores.economy} color="text-blue-400" label="Économie" icon={TrendingUp} delay={0} />
            <AnimatedCounter value={result.scores.social} color="text-white" label="Social" icon={Heart} delay={200} />
            <AnimatedCounter value={result.scores.ecology} color="text-green-400" label="Écologie" icon={Leaf} delay={400} />
          </div>
          
          {result.scores.overall && (
            <motion.div 
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring" }}
            >
              <div className={`px-4 py-2 rounded-full border-2 ${
                result.scores.overall >= 60 ? 'border-green-500 bg-green-500/20 text-green-400' :
                result.scores.overall >= 40 ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400' :
                'border-red-500 bg-red-500/20 text-red-400'
              }`}>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="font-bold">Score Global: {result.scores.overall}/100</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/30"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-400 uppercase">Gagnants</span>
              </div>
              <p className="text-sm text-green-100">{result.winners}</p>
            </motion.div>
            
            <motion.div 
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Skull className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase">Perdants</span>
              </div>
              <p className="text-sm text-red-100">{result.losers}</p>
            </motion.div>
          </div>
          
          <motion.div 
            className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, type: "spring" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase">Effet Papillon (à 5 ans)</span>
            </div>
            <p className="text-sm text-purple-100 italic">"{result.butterfly_effect}"</p>
          </motion.div>
          
          <div className="text-center pt-2 border-t border-white/10">
            <p className="text-xs text-muted-foreground">butterfly.gov • Simulateur politique propulsé par IA</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Debate Card
function DebateCard({ law1Data, law2Data }) {
  const getScoreColor = (score) => {
    if (score >= 60) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  const getWinner = (score1, score2) => {
    if (score1 > score2) return 'left'
    if (score2 > score1) return 'right'
    return 'tie'
  }
  
  return (
    <motion.div 
      className="w-full max-w-5xl mx-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="h-2 flex rounded-t-lg overflow-hidden">
        <div className="flex-1 bg-blue-600"></div>
        <div className="flex-1 bg-white"></div>
        <div className="flex-1 bg-red-500"></div>
      </div>
      
      <div className="bg-card rounded-b-lg p-6 border border-t-0 border-white/10">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
            <Swords className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-widest">Mode Débat</span>
            <PremiumBadge />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <motion.div className="space-y-4" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <h3 className="font-bold text-blue-400 mb-2">LOI A</h3>
              <p className="text-white">"{law1Data.text}"</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['economy', 'social', 'ecology'].map((key) => (
                <div key={key} className={`p-3 rounded-lg bg-black/30 text-center ${
                  getWinner(law1Data.analysis.scores[key], law2Data.analysis.scores[key]) === 'left' ? 'ring-2 ring-green-500' : ''
                }`}>
                  <div className="text-xs text-muted-foreground uppercase">
                    {key === 'economy' ? '💰' : key === 'social' ? '❤️' : '🌿'}
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(law1Data.analysis.scores[key])}`}>
                    {law1Data.analysis.scores[key]}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className={`text-lg font-bold ${getScoreColor(law1Data.analysis.scores.overall)}`}>
                Score: {law1Data.analysis.scores.overall}/100
              </span>
            </div>
          </motion.div>
          
          <motion.div className="space-y-4" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <h3 className="font-bold text-red-400 mb-2">LOI B</h3>
              <p className="text-white">"{law2Data.text}"</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['economy', 'social', 'ecology'].map((key) => (
                <div key={key} className={`p-3 rounded-lg bg-black/30 text-center ${
                  getWinner(law1Data.analysis.scores[key], law2Data.analysis.scores[key]) === 'right' ? 'ring-2 ring-green-500' : ''
                }`}>
                  <div className="text-xs text-muted-foreground uppercase">
                    {key === 'economy' ? '💰' : key === 'social' ? '❤️' : '🌿'}
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(law2Data.analysis.scores[key])}`}>
                    {law2Data.analysis.scores[key]}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <span className={`text-lg font-bold ${getScoreColor(law2Data.analysis.scores.overall)}`}>
                Score: {law2Data.analysis.scores.overall}/100
              </span>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="mt-6 text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {law1Data.analysis.scores.overall > law2Data.analysis.scores.overall ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">LOI A GAGNE !</span>
            </div>
          ) : law2Data.analysis.scores.overall > law1Data.analysis.scores.overall ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/50 text-red-400">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">LOI B GAGNE !</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400">
              <span className="font-bold">ÉGALITÉ !</span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
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
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      
      const res = await fetch('/api/history', { headers })
      const data = await res.json()
      setHistory(data.history || [])
      setLoading(false)
    }
    fetchHistory()
  }, [])
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    )
  }
  
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Aucune loi analysée pour l'instant</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {history.map((item, i) => (
        <motion.div
          key={item.id || i}
          className="p-3 rounded-lg bg-black/30 border border-white/10 hover:border-blue-500/50 cursor-pointer transition-colors"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectLaw(item.law_text)}
        >
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm text-white line-clamp-1 flex-1">"{item.law_text}"</p>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <div className="mt-1 flex gap-2 text-xs">
            <span className="text-blue-400">💰{item.score_economy}</span>
            <span className="text-white">❤️{item.score_social}</span>
            <span className="text-green-400">🌿{item.score_ecology}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Leaderboard Panel
function LeaderboardPanel() {
  const [leaderboard, setLeaderboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('overall')
  
  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setLeaderboard(data.leaderboard)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
      </div>
    )
  }
  
  if (!leaderboard || Object.values(leaderboard).every(arr => arr.length === 0)) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Pas encore de classement</p>
      </div>
    )
  }
  
  const categories = [
    { key: 'overall', label: '🏆 Global', color: 'text-yellow-400' },
    { key: 'economy', label: '💰 Éco', color: 'text-blue-400' },
    { key: 'social', label: '❤️ Social', color: 'text-pink-400' },
    { key: 'ecology', label: '🌿 Écolo', color: 'text-green-400' },
  ]
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${
              activeCategory === cat.key
                ? 'bg-white/20 text-white'
                : 'bg-black/30 text-muted-foreground hover:bg-white/10'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      
      <div className="space-y-2">
        {(leaderboard[activeCategory] || []).map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg bg-black/30 border border-white/10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              i === 0 ? 'bg-yellow-500 text-black' :
              i === 1 ? 'bg-gray-400 text-black' :
              i === 2 ? 'bg-amber-700 text-white' :
              'bg-white/10 text-white'
            }`}>
              {i + 1}
            </div>
            <p className="text-sm text-white flex-1 line-clamp-1">"{item.law}"</p>
            <span className={`font-bold ${categories.find(c => c.key === activeCategory)?.color}`}>
              {item.score}
            </span>
          </motion.div>
        ))}
      </div>
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
  const cardRef = useRef(null)
  
  const analyzeLaw = async () => {
    if (!lawText.trim()) return
    
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const token = await getAccessToken()
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ law: lawText.trim() })
      })
      
      const data = await response.json()
      
      if (response.status === 429) {
        setRateLimitExceeded({
          userTier: data.userTier,
          resetAt: data.resetAt
        })
        return
      }
      
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse')
      
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const analyzeDebate = async () => {
    if (!law1Text.trim() || !law2Text.trim()) return
    
    if (!isPremium) {
      setError('Le Mode Débat est réservé aux abonnés Premium')
      return
    }
    
    setLoading(true)
    setError(null)
    setDebateResult(null)
    
    try {
      const token = await getAccessToken()
      const response = await fetch('/api/debate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ law1: law1Text.trim(), law2: law2Text.trim() })
      })
      
      const data = await response.json()
      
      if (data.error === 'premium_required') {
        setError(data.message)
        return
      }
      
      if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse')
      
      setDebateResult(data)
      const winnerScore = Math.max(data.law1.analysis.scores.overall, data.law2.analysis.scores.overall)
      triggerConfetti(winnerScore)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpgrade = async () => {
    const token = await getAccessToken()
    if (!token) {
      setShowAuthModal(true)
      return
    }
    
    const response = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()
    if (data.url) {
      window.location.href = data.url
    }
  }
  
  const shareOnTwitter = async () => {
    if (!cardRef.current) return
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#111111',
        scale: 2,
      })
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'butterfly-gov-score.png'
        a.click()
        URL.revokeObjectURL(url)
      })
      
      const appUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const tweetText = encodeURIComponent(
        `🦋 J'ai passé la loi "${lawText.substring(0, 50)}${lawText.length > 50 ? '...' : ''}" sur Butterfly.gov\n\n` +
        `📊 Mon score présidentiel:\n` +
        `💰 Économie: ${result.scores.economy}/100\n` +
        `❤️ Social: ${result.scores.social}/100\n` +
        `🌿 Écologie: ${result.scores.ecology}/100\n\n` +
        `Tentez de faire mieux ! 👇\n${appUrl}`
      )
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    } catch (err) {
      console.error('Share error:', err)
    }
  }
  
  const reset = () => {
    setLawText('')
    setLaw1Text('')
    setLaw2Text('')
    setResult(null)
    setDebateResult(null)
    setError(null)
    setRateLimitExceeded(null)
  }
  
  const hasResults = mode === 'single' ? result : debateResult
  
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    )
  }
  
  return (
    <main className="min-h-screen flex flex-col">
      {/* Rate Limit Soft Wall */}
      {rateLimitExceeded && (
        <SoftWall
          userTier={rateLimitExceeded.userTier}
          resetAt={rateLimitExceeded.resetAt}
          onSignIn={() => { setRateLimitExceeded(null); setShowAuthModal(true) }}
          onUpgrade={() => { setRateLimitExceeded(null); handleUpgrade() }}
        />
      )}
      
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-20 flex justify-between items-center p-4">
        <div></div>
        <div className="flex items-center gap-2">
          {user ? (
            <UserMenu />
          ) : (
            <Button onClick={() => setShowAuthModal(true)} variant="outline" size="sm">
              <User className="w-4 h-4 mr-2" />
              Connexion
            </Button>
          )}
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 rounded-full bg-card border border-white/10 hover:border-blue-500/50 transition-colors"
          >
            {showSidebar ? <X className="w-5 h-5" /> : <History className="w-5 h-5" />}
          </button>
        </div>
      </header>
      
      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            className="fixed top-0 right-0 h-full w-80 bg-card border-l border-white/10 z-40 p-4 overflow-y-auto"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="pt-16">
              <Tabs value={sidebarTab} onValueChange={setSidebarTab}>
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="history" className="flex-1">
                    <History className="w-4 h-4 mr-1" /> Historique
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="flex-1">
                    <Award className="w-4 h-4 mr-1" /> Top
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="history">
                  <HistoryPanel onSelectLaw={(law) => {
                    setLawText(law)
                    setMode('single')
                    setShowSidebar(false)
                  }} />
                </TabsContent>
                <TabsContent value="leaderboard">
                  <LeaderboardPanel />
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {loading ? (
            <AnalysisLoader key="loader" />
          ) : !hasResults ? (
            <motion.div 
              key="input"
              className="w-full max-w-2xl space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Logo */}
              <div className="text-center space-y-4">
                <motion.div 
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 via-white/20 to-red-500 p-[2px]"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                    <ButterflyIcon className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold">
                  <span className="text-blue-400">Butterfly</span>
                  <span className="text-white">.gov</span>
                </h1>
                <p className="text-muted-foreground text-lg">Le simulateur de conséquences politiques</p>
              </div>
              
              {/* Mode Toggle */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-full bg-black/30 p-1 border border-white/10">
                  <button
                    onClick={() => setMode('single')}
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${
                      mode === 'single' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 inline mr-1" /> Loi unique
                  </button>
                  <button
                    onClick={() => setMode('debate')}
                    className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${
                      mode === 'debate' ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-white'
                    }`}
                  >
                    {!isPremium && <Lock className="w-3 h-3" />}
                    <Swords className="w-4 h-4" /> Débat
                    {isPremium && <PremiumBadge />}
                  </button>
                </div>
              </div>
              
              {/* Input Area */}
              {mode === 'single' ? (
                <div className="space-y-4">
                  <label className="block text-center text-xl text-white/80">
                    Si vous étiez Président, quelle loi passeriez-vous ?
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={lawText}
                      onChange={(e) => setLawText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && analyzeLaw()}
                      placeholder="Ex: Interdire les SUV en centre-ville..."
                      className="h-16 text-lg pl-6 pr-16 rounded-full bg-card border-2 border-white/10 focus:border-blue-500 transition-all pulse-glow"
                      disabled={loading}
                    />
                    <Button
                      onClick={analyzeLaw}
                      disabled={loading || !lawText.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-500 hover:to-red-400"
                    >
                      <Sparkles className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {!isPremium && (
                    <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <Lock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                      <p className="text-sm text-yellow-200">
                        Le Mode Débat est réservé aux abonnés Premium
                      </p>
                      <Button onClick={handleUpgrade} className="mt-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
                        <Crown className="w-4 h-4 mr-2" />
                        Passer Premium - 2,99€/mois
                      </Button>
                    </div>
                  )}
                  <label className="block text-center text-xl text-white/80">
                    Comparez deux propositions de loi
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm text-blue-400 font-medium">LOI A</span>
                      <Input
                        value={law1Text}
                        onChange={(e) => setLaw1Text(e.target.value)}
                        placeholder="Première proposition..."
                        className="bg-card border-2 border-blue-500/30 focus:border-blue-500"
                        disabled={loading || !isPremium}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm text-red-400 font-medium">LOI B</span>
                      <Input
                        value={law2Text}
                        onChange={(e) => setLaw2Text(e.target.value)}
                        placeholder="Deuxième proposition..."
                        className="bg-card border-2 border-red-500/30 focus:border-red-500"
                        disabled={loading || !isPremium}
                      />
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={analyzeDebate}
                      disabled={loading || !law1Text.trim() || !law2Text.trim() || !isPremium}
                      className="px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 hover:from-blue-500 hover:via-purple-500 hover:to-red-400"
                    >
                      <Swords className="w-5 h-5 mr-2" />
                      Lancer le débat
                    </Button>
                  </div>
                </div>
              )}
              
              {error && (
                <motion.p 
                  className="text-center text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.p>
              )}
              
              {/* Examples */}
              {mode === 'single' && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Exemples de lois à tester :</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      'Semaine de 4 jours obligatoire',
                      'Revenu universel de 1000€',
                      'Interdire les jets privés'
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setLawText(example)}
                        className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              className="w-full space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {mode === 'single' && result ? (
                <>
                  <ResultCard result={result} lawText={lawText} cardRef={cardRef} />
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={shareOnTwitter}
                      className="bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager sur X
                    </Button>
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="border-white/20 hover:bg-white/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Nouvelle loi
                    </Button>
                  </div>
                </>
              ) : debateResult ? (
                <>
                  <DebateCard law1Data={debateResult.law1} law2Data={debateResult.law2} />
                  <div className="flex justify-center">
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="border-white/20 hover:bg-white/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Nouveau débat
                    </Button>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <footer className="relative z-10 text-center py-4 text-xs text-muted-foreground">
        Propulsé par l'IA Claude • Les résultats sont fictifs et à but éducatif
      </footer>
    </main>
  )
}

// Export with AuthProvider
export default function Home() {
  return (
    <AuthProvider>
      <ButterflyApp />
    </AuthProvider>
  )
}
