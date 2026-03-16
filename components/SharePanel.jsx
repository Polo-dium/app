// components/SharePanel.jsx
// ─────────────────────────────────────────────────────────
// Composant de partage — RS buttons + Web Share API + Copy
// ─────────────────────────────────────────────────────────
//
// Usage:
//   <SharePanel
//     shareId="abc123"
//     proposition="Renationaliser les concessions autoroutières..."
//     scoreGlobal={45}
//     onClose={() => setShowShare(false)}
//   />

'use client';

import { useState, useEffect, useCallback } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://butterflygov.com';

// ── Configs des réseaux sociaux ─────────────────────────
const NETWORKS = [
  {
    id: 'twitter',
    label: '𝕏',
    color: '#E8E6E1',
    bg: '#1A1A2E',
    buildUrl: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
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
    id: 'linkedin',
    label: 'in',
    color: '#0A66C2',
    bg: '#0A1929',
    buildUrl: (url, text) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: 'whatsapp',
    label: 'W',
    color: '#25D366',
    bg: '#0A2916',
    buildUrl: (url, text) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`,
  },
  {
    id: 'telegram',
    label: '✈',
    color: '#26A5E4',
    bg: '#0A1F2E',
    buildUrl: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

export default function SharePanel({ shareId, proposition, scoreGlobal, onClose }) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const shareUrl = `${BASE_URL}/share/${shareId}`;
  const shareText = `"${proposition.slice(0, 100)}${proposition.length > 100 ? '…' : ''}" — Score ${scoreGlobal}/100 sur Butterfly.gov`;

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // ── Copy link ─────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  // ── Native share (mobile) ────────────────────────────
  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: 'Butterfly.gov — Analyse',
        text: shareText,
        url: shareUrl,
      });
    } catch (err) {
      // User cancelled — c'est normal
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [shareText, shareUrl]);

  // ── Open RS intent ────────────────────────────────────
  const handleShare = useCallback((network) => {
    const url = network.buildUrl(shareUrl, shareText);
    window.open(url, '_blank', 'width=600,height=400,noopener,noreferrer');
  }, [shareUrl, shareText]);

  // ── Close on escape ───────────────────────────────────
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 9998,
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.25s ease-out',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${isVisible ? '0' : '100%'})`,
          width: '100%',
          maxWidth: '480px',
          zIndex: 9999,
          background: '#111118',
          borderRadius: '20px 20px 0 0',
          padding: '28px 24px 36px',
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#333' }} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 600, color: '#E8E6E1' }}>
            Partager cette analyse
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Score {scoreGlobal}/100 — l'image sera générée automatiquement
          </p>
        </div>

        {/* ── Native share button (mobile) ─────────────── */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>📤</span>
            Partager…
          </button>
        )}

        {/* ── Social network buttons ────────────────────── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          {NETWORKS.map((network, i) => (
            <button
              key={network.id}
              onClick={() => handleShare(network)}
              title={`Partager sur ${network.id}`}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                border: `1px solid ${network.color}20`,
                background: network.bg,
                color: network.color,
                fontSize: network.id === 'telegram' ? '20px' : '18px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease-out',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                transitionDelay: `${i * 50 + 100}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${network.color}20`;
                e.currentTarget.style.borderColor = `${network.color}50`;
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = network.bg;
                e.currentTarget.style.borderColor = `${network.color}20`;
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {network.label}
            </button>
          ))}
        </div>

        {/* ── Copy link ──────────────────────────────────── */}
        <button
          onClick={handleCopy}
          style={{
            width: '100%',
            padding: '13px 16px',
            borderRadius: '12px',
            border: '1px solid #ffffff10',
            background: copied ? 'rgba(107,203,142,0.1)' : '#ffffff06',
            color: copied ? '#6BCB8E' : '#999',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            fontFamily: 'monospace',
          }}
        >
          <span style={{ fontSize: '15px' }}>{copied ? '✓' : '🔗'}</span>
          {copied ? 'Lien copié !' : shareUrl}
        </button>
      </div>
    </>
  );
}
