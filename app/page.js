'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Share2, RotateCcw, Sparkles, TrendingUp, Heart, Leaf, AlertTriangle, Trophy, Skull } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import html2canvas from 'html2canvas'

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

// Animated counter component
function AnimatedCounter({ value, color, label, icon: Icon }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    let start = 0
    const end = value
    const duration = 1500
    const increment = end / (duration / 16)
    
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)
    
    return () => clearInterval(timer)
  }, [value])
  
  const getColorClass = () => {
    if (value >= 60) return 'text-green-400'
    if (value >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }
  
  return (
    <motion.div 
      className="flex flex-col items-center p-4 rounded-xl bg-black/30 border border-white/10"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Icon className={`w-6 h-6 mb-2 ${color}`} />
      <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</span>
      <motion.span 
        className={`text-4xl font-bold tabular-nums ${getColorClass()}`}
        key={displayValue}
      >
        {displayValue}
      </motion.span>
      <span className="text-xs text-muted-foreground">/100</span>
    </motion.div>
  )
}

// Result Card Component
function ResultCard({ result, lawText, cardRef }) {
  return (
    <motion.div
      ref={cardRef}
      className="w-full max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="score-card-bg border-0 overflow-hidden shadow-2xl">
        {/* Tricolor top bar */}
        <div className="h-2 flex">
          <div className="flex-1 bg-blue-600"></div>
          <div className="flex-1 bg-white"></div>
          <div className="flex-1 bg-red-500"></div>
        </div>
        
        <CardContent className="p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <ButterflyIcon className="w-5 h-5" />
              <span className="text-sm font-medium uppercase tracking-widest">Butterfly.gov</span>
              <ButterflyIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white leading-tight">
              "{lawText}"
            </h2>
            <p className="text-xs text-muted-foreground">Analyse d'impact présidentiel</p>
          </div>
          
          {/* Scores */}
          <div className="grid grid-cols-3 gap-3">
            <AnimatedCounter 
              value={result.scores.economy} 
              color="text-blue-400" 
              label="Économie"
              icon={TrendingUp}
            />
            <AnimatedCounter 
              value={result.scores.social} 
              color="text-white" 
              label="Social"
              icon={Heart}
            />
            <AnimatedCounter 
              value={result.scores.ecology} 
              color="text-red-400" 
              label="Écologie"
              icon={Leaf}
            />
          </div>
          
          {/* Winners & Losers */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="p-4 rounded-xl bg-green-500/10 border border-green-500/30"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-green-400" />
                <span className="text-xs font-semibold text-green-400 uppercase">Gagnants</span>
              </div>
              <p className="text-sm text-green-100">{result.winners}</p>
            </motion.div>
            
            <motion.div 
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/30"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Skull className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase">Perdants</span>
              </div>
              <p className="text-sm text-red-100">{result.losers}</p>
            </motion.div>
          </div>
          
          {/* Butterfly Effect */}
          <motion.div 
            className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-400 uppercase">Effet Papillon (à 5 ans)</span>
            </div>
            <p className="text-sm text-purple-100 italic">"{result.butterfly_effect}"</p>
          </motion.div>
          
          {/* Footer */}
          <div className="text-center pt-2 border-t border-white/10">
            <p className="text-xs text-muted-foreground">butterfly.gov • Simulateur politique propulsé par IA</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function Home() {
  const [lawText, setLawText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const cardRef = useRef(null)
  
  const analyzeLaw = async () => {
    if (!lawText.trim()) return
    
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ law: lawText.trim() })
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }
      
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  const shareOnTwitter = async () => {
    if (!cardRef.current) return
    
    try {
      // Generate image
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#111111',
        scale: 2,
      })
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'butterfly-gov-score.png'
        a.click()
        URL.revokeObjectURL(url)
      })
      
      // Open Twitter share
      const tweetText = encodeURIComponent(
        `🦋 J'ai passé la loi "${lawText.substring(0, 50)}${lawText.length > 50 ? '...' : ''}" sur SimulVote\n\n` +
        `📊 Mon score présidentiel:\n` +
        `💰 Économie: ${result.scores.economy}/100\n` +
        `❤️ Social: ${result.scores.social}/100\n` +
        `🌿 Écologie: ${result.scores.ecology}/100\n\n` +
        `Tentez de faire mieux ! 👇`
      )
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    } catch (err) {
      console.error('Share error:', err)
    }
  }
  
  const reset = () => {
    setLawText('')
    setResult(null)
    setError(null)
  }
  
  return (
    <main className="min-h-screen flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {!result ? (
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
              
              {/* Search Input */}
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
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                
                {error && (
                  <motion.p 
                    className="text-center text-red-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}
              </div>
              
              {/* Examples */}
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
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              className="w-full space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultCard result={result} lawText={lawText} cardRef={cardRef} />
              
              {/* Action buttons */}
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
