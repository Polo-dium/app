// archive/debate/components/debate-ui.jsx
// ─────────────────────────────────────────────────────────
// Extrait de app/page.js — archivé le 16/03/2026
// Sections UI du mode Débat "Loi A vs Loi B" (Premium only)
// ─────────────────────────────────────────────────────────
//
// Pour réintégrer, voir les sections commentées ci-dessous
// dans ButterflyApp() de app/page.js
//
// IMPORTS à rajouter :
//   import { Swords } from 'lucide-react'
//   import { getDebateLaws } from '@/lib/daily-laws'
//
// STATES à rajouter :
//   const [law1Text, setLaw1Text] = useState('')
//   const [law2Text, setLaw2Text] = useState('')
//   const [debateResult, setDebateResult] = useState(null)
//   const debateCardRef = useRef(null)
//
// DANS reset() :
//   setLaw1Text(''); setLaw2Text(''); setDebateResult(null);
//
// DANS hasResults :
//   mode === 'debate' ? debateResult :
//
// DISPATCH MODE SELECTOR (dans le inline-flex des modes) :
//   <button onClick={() => setMode('debate')} className={`px-4 py-2 rounded-full text-sm transition-colors flex items-center gap-1 ${mode === 'debate' ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-white'}`}>
//     {!isPremium && <Lock className="w-3 h-3" />}<Swords className="w-4 h-4" />Débat
//   </button>

// ── URL PARAM HANDLING ─────────────────────────────────
// Dans le useEffect des URL params :
// if (modeParam === 'debate') {
//   setMode('debate')
//   setLaw1Text(decodeURIComponent(loi))
// }

// ── FONCTION analyzeDebate ──────────────────────────────
export async function analyzeDebate({ law1Text, law2Text, isPremium, setLoading, setError, setDebateResult, getAccessToken, triggerConfetti }) {
  if (!law1Text.trim() || !law2Text.trim()) return
  if (!isPremium) { setError('Le Mode Débat est réservé aux abonnés Premium'); return }
  setLoading(true); setError(null); setDebateResult(null)
  try {
    const token = await getAccessToken()
    const response = await fetch('/api/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ law1: law1Text.trim(), law2: law2Text.trim() })
    })
    const data = await response.json()
    if (data.error === 'premium_required') { setError(data.message); return }
    if (!response.ok) throw new Error(data.error || 'Erreur lors de l\'analyse')
    setDebateResult(data)
    triggerConfetti(Math.max(data.law1.analysis.scores.overall, data.law2.analysis.scores.overall))
  } catch (err) { setError(err.message) }
  finally { setLoading(false) }
}

// ── SECTION INPUT (mode === 'debate') ──────────────────
// À placer dans le bloc conditionnel des inputs :
//
// ) : mode === 'debate' ? (
//   <div className="space-y-4">
//     {!isPremium && (
//       <div className="text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
//         <Lock className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
//         <p className="text-sm text-yellow-200">Le Mode Débat est réservé aux abonnés Premium</p>
//         <Button onClick={handleUpgrade} className={`mt-2 ${stripeEnabled ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black' : 'bg-white/10 text-white/60 cursor-default'}`}>
//           <Crown className="w-4 h-4 mr-2" />{stripeEnabled ? 'Passer Premium - 2,99€/mois' : '✨ Premium — Bientôt disponible'}
//         </Button>
//       </div>
//     )}
//     <label className="block text-center text-xl text-white/80">Comparez deux propositions de loi</label>
//     <div className="grid grid-cols-2 gap-4">
//       <div className="space-y-2">
//         <span className="text-sm text-blue-400 font-medium">LOI A</span>
//         <Input value={law1Text} onChange={(e) => setLaw1Text(e.target.value)} placeholder="Première proposition..." className="bg-card border-2 border-blue-500/30 focus:border-blue-500" disabled={loading || !isPremium} />
//       </div>
//       <div className="space-y-2">
//         <span className="text-sm text-red-400 font-medium">LOI B</span>
//         <Input value={law2Text} onChange={(e) => setLaw2Text(e.target.value)} placeholder="Deuxième proposition..." className="bg-card border-2 border-red-500/30 focus:border-red-500" disabled={loading || !isPremium} />
//       </div>
//     </div>
//     <div className="flex justify-center">
//       <Button onClick={analyzeDebate} disabled={loading || !law1Text.trim() || !law2Text.trim() || !isPremium} className="px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-red-500 hover:from-blue-500 hover:via-purple-500 hover:to-red-400">
//         <Swords className="w-5 h-5 mr-2" />Lancer le débat
//       </Button>
//     </div>
//   </div>

// ── SECTION PROPOSALS (mode === 'debate') ──────────────
// {mode === 'debate' && (
//   <div className="space-y-3">
//     <div className="flex items-center justify-between">
//       <p className="text-sm text-muted-foreground">Idées de propositions</p>
//       <button onClick={() => setProposalSeed(s => s + 1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-white/10">
//         <RefreshCw className="w-3 h-3" />Voir d'autres
//       </button>
//     </div>
//     <div className="grid grid-cols-2 gap-3">
//       <div className="space-y-2">
//         <p className="text-xs text-blue-400 font-medium uppercase tracking-wide">Pour LOI A</p>
//         {getDebateLaws(proposalSeed).gauche.map((law) => (
//           <DailyLawCard key={law.id} law={law} onClick={(text) => setLaw1Text(text)} />
//         ))}
//       </div>
//       <div className="space-y-2">
//         <p className="text-xs text-red-400 font-medium uppercase tracking-wide">Pour LOI B</p>
//         {getDebateLaws(proposalSeed).droite.map((law) => (
//           <DailyLawCard key={law.id} law={law} onClick={(text) => setLaw2Text(text)} />
//         ))}
//       </div>
//     </div>
//   </div>
// )}

// ── SECTION RESULT (debateResult) ──────────────────────
// ) : debateResult ? (
//   <>
//     <div className="w-full max-w-5xl mx-auto" ref={debateCardRef}>
//       <div className="h-2 flex rounded-t-lg overflow-hidden">
//         <div className="flex-1 bg-blue-600"></div><div className="flex-1 bg-white"></div><div className="flex-1 bg-red-500"></div>
//       </div>
//       <div className="bg-card rounded-b-lg p-6 border border-t-0 border-white/10">
//         <div className="text-center mb-6">
//           <div className="flex items-center justify-center gap-2 text-purple-400 mb-2">
//             <Swords className="w-5 h-5" /><span className="text-sm font-medium uppercase tracking-widest">Mode Débat</span>
//           </div>
//         </div>
//         <div className="grid grid-cols-2 gap-6">
//           {[{ data: debateResult.law1, color: 'blue', label: 'LOI A' }, { data: debateResult.law2, color: 'red', label: 'LOI B' }].map(({ data, color, label }) => (
//             <div key={label} className="space-y-4">
//               <div className={`p-4 rounded-lg bg-${color}-500/10 border border-${color}-500/30`}>
//                 <h3 className={`font-bold text-${color}-400 mb-2`}>{label}</h3>
//                 <p className="text-white">"{data.text}"</p>
//               </div>
//               <div className="grid grid-cols-2 gap-2">
//                 {[['economy','💰'],['social','❤️'],['ecology','🌿'],['faisabilite','⚙️']].map(([key, emoji]) => (
//                   <div key={key} className="p-2 rounded-lg bg-black/30 text-center">
//                     <div className="text-xs text-muted-foreground">{emoji}</div>
//                     <div className={`text-xl font-bold ${(data.analysis.scores[key]??50) >= 60 ? 'text-green-400' : (data.analysis.scores[key]??50) >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
//                       {data.analysis.scores[key] ?? 50}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <div className="text-center">
//                 <span className={`text-lg font-bold ${data.analysis.scores.overall >= 60 ? 'text-green-400' : data.analysis.scores.overall >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
//                   Score: {data.analysis.scores.overall}/100
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//         <motion.div className="mt-6 text-center" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}>
//           {debateResult.law1.analysis.scores.overall > debateResult.law2.analysis.scores.overall ? (
//             <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400"><Trophy className="w-5 h-5" /><span className="font-bold">LOI A GAGNE !</span></div>
//           ) : debateResult.law2.analysis.scores.overall > debateResult.law1.analysis.scores.overall ? (
//             <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500/20 border border-red-500/50 text-red-400"><Trophy className="w-5 h-5" /><span className="font-bold">LOI B GAGNE !</span></div>
//           ) : (
//             <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400"><span className="font-bold">ÉGALITÉ !</span></div>
//           )}
//         </motion.div>
//         {debateResult.verdict && (
//           <motion.div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 max-w-2xl mx-auto" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
//             <p className="text-sm text-purple-200 italic text-center">{debateResult.verdict}</p>
//           </motion.div>
//         )}
//         <div className="flex justify-center gap-4 mt-4 flex-wrap">
//           <Button onClick={() => setShowDebateChat(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
//             <MessageSquare className="w-4 h-4 mr-2" />Débattre avec l'IA
//           </Button>
//         </div>
//       </div>
//     </div>
//     <div className="flex justify-center gap-3 flex-wrap">
//       <Button onClick={() => openSharePanel({ type: 'debat', proposition: law1Text, loi_a_titre: law1Text, loi_b_titre: law2Text, loi_a_scores: debateResult.law1.analysis.scores, loi_b_scores: debateResult.law2.analysis.scores, verdict: debateResult.verdict })} disabled={shareCreating} variant="outline" className="border-white/20 hover:bg-white/10">
//         {shareCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2" />}Partager sur vos réseaux
//       </Button>
//       <Button onClick={reset} variant="outline" className="border-white/20 hover:bg-white/10"><RotateCcw className="w-4 h-4 mr-2" />Nouveau débat</Button>
//       <Button onClick={() => window.location.href = `/explorer?loi=${encodeURIComponent(law1Text)}`} variant="outline" className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400">
//         <Network className="w-4 h-4 mr-2" />Explorer les implications
//       </Button>
//     </div>
//   </>

// ── BOUTON "Débattre →" dans l'onglet Expliquer ─────────
// <Button onClick={() => { setMode('debate'); setLaw1Text(explainText); setExplainResult('') }} variant="outline" className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400">
//   <Swords className="w-4 h-4 mr-2" />Débattre →
// </Button>

// ── DebateChatModal PROPS (mode débat) ──────────────────
// law1={mode === 'debate' ? law1Text : null}
// law2={mode === 'debate' ? law2Text : null}
// law1Scores={debateResult?.law1?.analysis?.scores}
// law2Scores={debateResult?.law2?.analysis?.scores}
