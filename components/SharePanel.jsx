// components/SharePanel.jsx
// ─────────────────────────────────────────────────────────
// Partage simplifié : Partager sur vos réseaux + Télécharger
// ─────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useCallback } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://butterflygov.com';

export default function SharePanel({ shareId, proposition, scoreGlobal, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);   // null | 'shared' | 'copied'
  const [dlStatus, setDlStatus] = useState(null);         // null | 'loading' | 'done'

  const shareUrl  = `${BASE_URL}/share/${shareId}`;
  const ogImageUrl = `/api/og/${shareId}`;
  const prop       = proposition.length > 80 ? proposition.slice(0, 78) + '…' : proposition;
  const shareText  = `🦋 "${prop}" — Score ${scoreGlobal}/100\n\nAnalysez n'importe quelle loi française → ${shareUrl}`;

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // ── Fermer avec Escape ────────────────────────────────
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // ── Partager sur vos réseaux ──────────────────────────
  const handleShare = useCallback(async () => {
    // 1. Essai partage natif avec image jointe
    if (navigator.share) {
      try {
        if (navigator.canShare) {
          const res   = await fetch(ogImageUrl);
          const blob  = await res.blob();
          const file  = new File([blob], 'butterfly-analyse.png', { type: blob.type });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title : 'Butterfly.gov — Analyse législative',
              text  : shareText,
              url   : shareUrl,
              files : [file],
            });
            setShareStatus('shared');
            setTimeout(() => setShareStatus(null), 2500);
            return;
          }
        }
        // Fallback : URL seule (la card OG apparaît côté réseau social)
        await navigator.share({
          title : 'Butterfly.gov — Analyse législative',
          text  : shareText,
          url   : shareUrl,
        });
        setShareStatus('shared');
        setTimeout(() => setShareStatus(null), 2500);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // Annulé par l'utilisateur
      }
    }
    // 2. Fallback navigateur sans Web Share API : copier le lien
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
    setShareStatus('copied');
    setTimeout(() => setShareStatus(null), 2500);
  }, [ogImageUrl, shareText, shareUrl]);

  // ── Télécharger l'image ───────────────────────────────
  const handleDownload = useCallback(async () => {
    setDlStatus('loading');
    try {
      const res  = await fetch(ogImageUrl);
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = URL.createObjectURL(blob);
      a.download = `butterfly-${shareId}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setDlStatus('done');
      setTimeout(() => setDlStatus(null), 2500);
    } catch {
      setDlStatus(null);
    }
  }, [ogImageUrl, shareId]);

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
        padding: '24px 22px 40px',
        transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2A2A38' }} />
        </div>

        {/* ── Aperçu OG image ──────────────────────────── */}
        <div style={{
          width: '100%', borderRadius: 14, overflow: 'hidden',
          marginBottom: 22, background: '#0C0C14',
          border: '1px solid #ffffff0A',
          position: 'relative', aspectRatio: '1200 / 630',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {!imgLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 28, opacity: 0.25 }}>🦋</span>
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

        {/* ── Bouton principal : Partager sur vos réseaux ── */}
        <button
          onClick={handleShare}
          style={{
            width: '100%', padding: '17px 20px',
            borderRadius: 16, border: 'none',
            background: shareStatus === 'shared'
              ? 'linear-gradient(135deg, #6BCB8E 0%, #5BA87A 100%)'
              : shareStatus === 'copied'
              ? 'linear-gradient(135deg, #E8B931 0%, #BF9520 100%)'
              : 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
            color: '#fff',
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            marginBottom: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'background 0.3s, transform 0.15s',
            boxShadow: '0 4px 24px rgba(139,107,239,0.25)',
          }}
          onMouseDown={e  => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={e    => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span style={{ fontSize: 20 }}>
            {shareStatus === 'shared' ? '✓' : shareStatus === 'copied' ? '🔗' : '📤'}
          </span>
          <span>
            {shareStatus === 'shared'
              ? 'Partagé !'
              : shareStatus === 'copied'
              ? 'Lien copié — partagez-le !'
              : 'Partager sur vos réseaux'}
          </span>
        </button>

        {/* ── Bouton secondaire : Télécharger l'image ────── */}
        <button
          onClick={handleDownload}
          disabled={dlStatus === 'loading'}
          style={{
            width: '100%', padding: '14px 20px',
            borderRadius: 14, border: '1px solid #ffffff12',
            background: dlStatus === 'done' ? 'rgba(107,203,142,0.08)' : '#ffffff06',
            color: dlStatus === 'done' ? '#6BCB8E' : '#999',
            fontSize: 14, fontWeight: 500, cursor: dlStatus === 'loading' ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.25s',
            fontFamily: 'system-ui, sans-serif',
          }}
          onMouseEnter={e => { if (dlStatus !== 'loading') e.currentTarget.style.background = '#ffffff0E'; }}
          onMouseLeave={e => { e.currentTarget.style.background = dlStatus === 'done' ? 'rgba(107,203,142,0.08)' : '#ffffff06'; }}
        >
          <span style={{ fontSize: 16 }}>
            {dlStatus === 'loading' ? '⏳' : dlStatus === 'done' ? '✓' : '⬇'}
          </span>
          {dlStatus === 'loading'
            ? 'Téléchargement…'
            : dlStatus === 'done'
            ? 'Image téléchargée !'
            : 'Télécharger l\'image'}
        </button>
      </div>
    </>
  );
}
