'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Share2 } from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://butterflygov.com'

// Share intent URLs — zero API keys required
function buildShareLinks(shareUrl, title) {
  const encoded = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  return {
    x:        `https://x.com/intent/tweet?url=${encoded}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encoded}`,
    telegram: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
  }
}

/**
 * SharePanel — bottom sheet for social sharing.
 *
 * Props:
 *   open        {boolean}
 *   onClose     {() => void}
 *   analysisData {object}  — see lib/share.js createShare() signature
 *   getAccessToken {() => Promise<string>}
 */
export default function SharePanel({ open, onClose, analysisData, getAccessToken }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const title = analysisData?.type === 'debat'
    ? `J'ai comparé deux lois sur Butterfly.gov !`
    : `J'ai testé "${analysisData?.proposition?.slice(0, 50)}" sur Butterfly.gov — Score ${analysisData?.score_global}/100`

  const generateLink = async () => {
    if (shareUrl) return
    setLoading(true)
    setError(null)
    try {
      const token = getAccessToken ? await getAccessToken() : null
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(analysisData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création du lien')
      setShareUrl(data.shareUrl)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Open share panel → immediately generate the link
  const handleOpen = () => {
    if (!shareUrl && !loading) generateLink()
  }

  const copyLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const nativeShare = () => {
    if (!shareUrl || !navigator.share) return
    navigator.share({ title: '🦋 Butterfly.gov', text: title, url: shareUrl }).catch(() => {})
  }

  const links = shareUrl ? buildShareLinks(shareUrl, title) : null

  const SocialButton = ({ href, emoji, label, color }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${color} hover:opacity-90`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs text-white font-medium">{label}</span>
    </a>
  )

  return (
    <AnimatePresence onExitComplete={() => { setShareUrl(null); setError(null) }}>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-white/10 rounded-t-3xl p-6 pb-8 max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onAnimationComplete={handleOpen}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-blue-400" />Partager</h3>
              <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Title preview */}
            <p className="text-sm text-white/70 mb-5 leading-relaxed line-clamp-2">{title}</p>

            {loading && (
              <div className="text-center py-6 text-sm text-muted-foreground animate-pulse">Génération du lien…</div>
            )}

            {error && (
              <div className="text-center py-4 text-sm text-red-400">{error}</div>
            )}

            {shareUrl && (
              <>
                {/* Native share (mobile) */}
                {'share' in navigator && (
                  <button
                    onClick={nativeShare}
                    className="w-full mb-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    📤 Partager via…
                  </button>
                )}

                {/* Social buttons grid */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  <SocialButton href={links.x}        emoji="𝕏"  label="Twitter"   color="bg-black border border-white/20" />
                  <SocialButton href={links.facebook}  emoji="f"  label="Facebook"  color="bg-[#1877f2]" />
                  <SocialButton href={links.linkedin}  emoji="in" label="LinkedIn"  color="bg-[#0a66c2]" />
                  <SocialButton href={links.whatsapp}  emoji="💬" label="WhatsApp"  color="bg-[#25d366]" />
                  <SocialButton href={links.telegram}  emoji="✈️" label="Telegram"  color="bg-[#229ed9]" />
                </div>

                {/* Copy link */}
                <button
                  onClick={copyLink}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm"
                >
                  <span className="text-white/70 truncate mr-2">{shareUrl}</span>
                  {copied ? <Check className="w-4 h-4 text-green-400 shrink-0" /> : <Copy className="w-4 h-4 text-muted-foreground shrink-0" />}
                </button>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
