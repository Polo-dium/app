// components/SharePanel.jsx
// ─────────────────────────────────────────────────────────
// Partage : Web Share API avec image, boutons RS + aperçu OG
// ─────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useCallback } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://butterflygov.com';

// ── Textes d'accroche par réseau ──────────────────────
const buildShareText = (proposition, score) => {
  const prop = proposition.length > 80 ? proposition.slice(0, 78) + '…' : proposition;
  return `🦋 "${prop}" — Score ${score}/100\n\nAnalysez n'importe quelle loi française en quelques secondes →`;
};

// ── Config des réseaux sociaux ─────────────────────────
const NETWORKS = [
  {
    id: 'twitter',
    label: '𝕏',
    color: '#E8E6E1',
    bg: '#1A1A2E',
    buildUrl: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    id: 'facebook',
    label: 'f',
    color: '#4267B2',
    bg: '#0E1A3A',
    buildUrl: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: 'instagram',
    label: null, // icône SVG
    color: '#E1306C',
    bg: '#2E0A1A',
    buildUrl: null, // géré séparément
    isInstagram: true,
  },
  {
    id: 'whatsapp',
    label: null, // icône SVG
    color: '#25D366',
    bg: '#0A2916',
    buildUrl: (url, text) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n\n' + url)}`,
  },
  {
    id: 'linkedin',
    label: 'in',
    color: '#0A66C2',
    bg: '#0A1929',
    buildUrl: (url, text) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
  },
];

// ── Icônes SVG inline ──────────────────────────────────
function IconInstagram({ color }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="0.8" fill={color} stroke="none" />
    </svg>
  );
}
function IconWhatsapp({ color }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill={color}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.556 4.122 1.528 5.855L0 24l6.335-1.511A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.37l-.36-.213-3.72.888.921-3.614-.234-.372A9.781 9.781 0 012.182 12c0-5.422 4.396-9.818 9.818-9.818 5.422 0 9.818 4.396 9.818 9.818 0 5.422-4.396 9.818-9.818 9.818z" />
    </svg>
  );
}

export default function SharePanel({ shareId, proposition, scoreGlobal, onClose }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [igStatus, setIgStatus] = useState(null); // null | 'downloading' | 'done'
  const [imgLoaded, setImgLoaded] = useState(false);

  const shareUrl = `${BASE_URL}/share/${shareId}`;
  const ogImageUrl = `/api/og/${shareId}`;
  const shareText = buildShareText(proposition, scoreGlobal);

  useEffect(() => {
    const mobile = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobile);
    setCanNativeShare(!!navigator.share);
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // ── Copier le lien ────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }, [shareUrl]);

  // ── Partage natif mobile — avec image si possible ─────
  const handleNativeShare = useCallback(async () => {
    try {
      // Essai : partager avec l'image OG en pièce jointe
      if (navigator.canShare) {
        const res = await fetch(ogImageUrl);
        const blob = await res.blob();
        const file = new File([blob], 'butterfly-analyse.png', { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Butterfly.gov — Analyse législative',
            text: shareText,
            url: shareUrl,
            files: [file],
          });
          return;
        }
      }
      // Fallback : partager l'URL seule (l'aperçu OG s'affiche côté réseau social)
      await navigator.share({
        title: 'Butterfly.gov — Analyse législative',
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') handleCopy();
    }
  }, [ogImageUrl, shareText, shareUrl, handleCopy]);

  // ── Instagram : image en pièce jointe (mobile) ou téléchargement (desktop) ──
  const handleInstagram = useCallback(async () => {
    if (isMobile && canNativeShare) {
      // Sur mobile : partage natif avec image → Instagram peut la recevoir
      await handleNativeShare();
    } else {
      // Sur desktop : télécharger l'image + copier la légende
      setIgStatus('downloading');
      try {
        const res = await fetch(ogImageUrl);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'butterfly-analyse.png';
        a.click();
        URL.revokeObjectURL(a.href);
        // Copier la légende dans le presse-papiers
        const caption = `${shareText}\n\n${shareUrl}`;
        await navigator.clipboard.writeText(caption).catch(() => {});
        setIgStatus('done');
        setTimeout(() => setIgStatus(null), 3500);
      } catch {
        setIgStatus(null);
      }
    }
  }, [isMobile, canNativeShare, handleNativeShare, ogImageUrl, shareText, shareUrl]);

  // ── Boutons RS desktop ────────────────────────────────
  const handleShare = useCallback((network) => {
    if (network.isInstagram) {
      handleInstagram();
      return;
    }
    const url = network.buildUrl(shareUrl, shareText);
    if (isMobile) {
      // Sur mobile : ouvrir dans un nouvel onglet (redirige vers l'app)
      window.open(url, '_blank');
    } else {
      window.open(url, '_blank', 'width=620,height=500,noopener,noreferrer');
    }
  }, [shareUrl, shareText, isMobile, handleInstagram]);

  // ── Fermer avec Escape ────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          zIndex: 9998,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.25s ease-out',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: `translateX(-50%) translateY(${isVisible ? '0' : '100%'})`,
        width: '100%', maxWidth: '500px', zIndex: 9999,
        background: '#111118',
        borderRadius: '20px 20px 0 0',
        padding: '24px 22px 36px',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2A2A38' }} />
        </div>

        {/* Titre */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 5px', fontSize: 17, fontWeight: 600, color: '#E8E6E1' }}>
            Partager cette analyse
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: '#555' }}>
            L'image ci-dessous sera partagée avec votre lien
          </p>
        </div>

        {/* ── Aperçu OG image ──────────────────────────── */}
        <div style={{
          width: '100%', borderRadius: 12, overflow: 'hidden',
          marginBottom: 18, background: '#0C0C14',
          border: '1px solid #ffffff0A',
          position: 'relative', aspectRatio: '1200 / 630',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!imgLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, opacity: 0.3 }}>🦋</span>
            </div>
          )}
          <img
            src={ogImageUrl}
            alt="Aperçu de l'analyse"
            onLoad={() => setImgLoaded(true)}
            style={{
              width: '100%', display: 'block',
              opacity: imgLoaded ? 1 : 0,
              transition: 'opacity 0.3s',
            }}
          />
        </div>

        {/* ── Bouton partage natif mobile ───────────────── */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
              color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
              marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 18 }}>📤</span>
            Partager avec image…
          </button>
        )}

        {/* ── Boutons réseaux sociaux ───────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          {NETWORKS.map((network, i) => {
            const isIg = network.isInstagram;
            const isIgDone = isIg && igStatus === 'done';
            const isIgLoading = isIg && igStatus === 'downloading';
            return (
              <button
                key={network.id}
                onClick={() => handleShare(network)}
                title={
                  isIg
                    ? isMobile ? 'Partager sur Instagram' : 'Télécharger pour Instagram'
                    : `Partager sur ${network.id}`
                }
                style={{
                  width: 54, height: 54, borderRadius: 14,
                  border: `1px solid ${network.color}22`,
                  background: isIgDone ? '#6BCB8E22' : network.bg,
                  color: isIgDone ? '#6BCB8E' : network.color,
                  fontSize: 18, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 2,
                  transition: 'all 0.2s ease-out',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.9)',
                  transitionDelay: `${i * 45 + 80}ms`,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${network.color}22`;
                  e.currentTarget.style.borderColor = `${network.color}50`;
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isIgDone ? '#6BCB8E22' : network.bg;
                  e.currentTarget.style.borderColor = `${network.color}22`;
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                }}
              >
                {isIg ? (
                  isIgDone ? '✓' :
                  isIgLoading ? '…' :
                  <IconInstagram color={network.color} />
                ) : network.id === 'whatsapp' ? (
                  <IconWhatsapp color={network.color} />
                ) : (
                  network.label
                )}
                {/* Tooltip pour Instagram desktop */}
                {isIg && !isMobile && (
                  <span style={{
                    position: 'absolute', bottom: -20, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 7, color: '#555', fontFamily: 'monospace', whiteSpace: 'nowrap',
                  }}>
                    {isIgDone ? 'Légende copiée !' : '↓ image'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Indication Instagram desktop */}
        {igStatus === 'done' && !isMobile && (
          <p style={{
            textAlign: 'center', fontSize: 12, color: '#6BCB8E',
            marginBottom: 12, margin: '0 0 12px',
          }}>
            ✓ Image téléchargée · Légende copiée dans le presse-papiers
          </p>
        )}

        {/* ── Copier le lien ─────────────────────────────── */}
        <button
          onClick={handleCopy}
          style={{
            width: '100%', padding: '13px 16px', borderRadius: 12,
            border: `1px solid ${copied ? '#6BCB8E30' : '#ffffff10'}`,
            background: copied ? 'rgba(107,203,142,0.08)' : '#ffffff05',
            color: copied ? '#6BCB8E' : '#777',
            fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.25s',
            fontFamily: 'monospace', letterSpacing: 0.3,
          }}
        >
          <span style={{ fontSize: 14 }}>{copied ? '✓' : '🔗'}</span>
          {copied ? 'Lien copié !' : shareUrl.replace('https://', '')}
        </button>
      </div>
    </>
  );
}
