'use client';

// components/LawExplorer.jsx
// ─────────────────────────────────────────────────────────
// Carte radiale d'implications législatives — navigation par clic
// Clic sur une node → elle devient le centre, 3 sous-nodes apparaissent
// Clic sur le centre → retour au niveau précédent
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ── Palette des secteurs ───────────────────────────────
const SECTORS = {
  economie:      { label: 'Économie',      color: '#E8B931' },
  libertes:      { label: 'Libertés',      color: '#5B8DEF' },
  securite:      { label: 'Sécurité',      color: '#EF6B5B' },
  social:        { label: 'Social',        color: '#6BCB8E' },
  environnement: { label: 'Environnement', color: '#8B6BEF' },
  numerique:     { label: 'Numérique',     color: '#EFB85B' },
};

// ── Input vide ─────────────────────────────────────────
function EmptyState() {
  const [input, setInput] = useState('');
  const go = () => {
    if (input.trim().length < 5) return;
    window.location.href = `/explorer?loi=${encodeURIComponent(input.trim())}`;
  };
  return (
    <div style={{
      minHeight: '100vh', background: '#08080D', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#E8E6E1',
    }}>
      <a href="/" style={{ fontSize: 10, color: '#555', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none', marginBottom: 32 }}>
        ← Butterfly.gov
      </a>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: '#999', marginBottom: 8, textAlign: 'center' }}>
        Explorateur législatif
      </h1>
      <p style={{ fontSize: 14, color: '#555', marginBottom: 40, textAlign: 'center', maxWidth: 420 }}>
        Entrez une proposition de loi pour visualiser ses implications en constellation
      </p>
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && go()}
          placeholder="Ex : Rendre le vote obligatoire pour toutes les élections nationales..."
          rows={3}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14,
            border: '1.5px solid #ffffff15', background: '#111118',
            color: '#E8E6E1', fontSize: 15, resize: 'vertical',
            fontFamily: 'system-ui, sans-serif', outline: 'none',
            lineHeight: 1.5, boxSizing: 'border-box',
          }}
        />
        <button
          onClick={go}
          disabled={input.trim().length < 5}
          style={{
            padding: '14px', borderRadius: 12, border: 'none',
            background: input.trim().length >= 5
              ? 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)'
              : '#222',
            color: input.trim().length >= 5 ? '#fff' : '#555',
            fontSize: 15, fontWeight: 600, cursor: input.trim().length >= 5 ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          Explorer la constellation →
        </button>
      </div>
    </div>
  );
}

// ── Skeleton de chargement ─────────────────────────────
function LoadingState({ law }) {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      minHeight: '100vh', background: '#08080D', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: 'system-ui, sans-serif', color: '#E8E6E1',
      textAlign: 'center',
    }}>
      <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 40 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            border: `1.5px solid rgba(139,107,239,${0.4 - i * 0.1})`,
            borderRadius: '50%',
            transform: `scale(${1 + i * 0.35})`,
            animation: `pulse-ring 2s ease-in-out ${i * 0.35}s infinite`,
          }} />
        ))}
        <style>{`
          @keyframes pulse-ring {
            0%, 100% { opacity: 0.2; }
            50% { opacity: 0.8; }
          }
        `}</style>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 28,
        }}>
          🦋
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#8B6BEF', letterSpacing: 2, fontFamily: 'monospace', marginBottom: 12 }}>
        ANALYSE EN COURS{dots}
      </p>
      <p style={{ fontSize: 15, color: '#666', maxWidth: 420, lineHeight: 1.5 }}>
        Génération de la constellation pour<br />
        <em style={{ color: '#999' }}>"{law.length > 70 ? law.slice(0, 70) + '…' : law}"</em>
      </p>
    </div>
  );
}

// ── Composant principal ────────────────────────────────
export default function LawExplorer() {
  const svgRef = useRef(null);
  const hoverTimer = useRef(null);

  const [dim, setDim] = useState({ w: 800, h: 600 });
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [entered, setEntered] = useState(false);

  // Hover panel (non-locking on hover, info only)
  const [panelNode, setPanelNode] = useState(null);

  // Data state
  const [lawQuery, setLawQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanding, setExpanding] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [rateLimitError, setRateLimitError] = useState(null); // { message, userTier, resetAt }

  // Auth helper — récupère le token pour rate limiting par user
  const getAuthHeaders = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) return {};
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) return { 'Authorization': `Bearer ${session.access_token}` };
    } catch { /* silence */ }
    return {};
  }, []);

  // ── Navigation stack ───────────────────────────────────
  // Chaque niveau : { title, sector, nodes: [...], parentLaw }
  const [navStack, setNavStack] = useState([]);

  // Vue courante = dernier élément du stack
  const currentView = navStack[navStack.length - 1] || null;
  const navDepth = navStack.length;

  // ── URL param & fetch initial ──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loi = params.get('loi');
    if (!loi) return;
    setLawQuery(loi);
    fetchConstellation(loi);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConstellation = useCallback(async (law) => {
    setLoading(true);
    setApiError(null);
    setRateLimitError(null);
    setNavStack([]);
    setPanelNode(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ law }),
      });
      if (res.status === 429) {
        const rl = await res.json();
        setRateLimitError({ message: rl.message, userTier: rl.userTier, resetAt: rl.resetAt });
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur API');
      // Premier niveau : ring 0 (implications directes)
      const allNodes = [
        ...(data.rings[0]?.nodes || []),
        ...(data.rings[1]?.nodes || []).slice(0, 2),
      ].slice(0, 6);
      setNavStack([{
        title: law,
        sector: data.sector,
        nodes: allNodes,
        parentLaw: law,
      }]);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  // ── Clic sur une node → elle devient le nouveau centre ──
  const drillInto = useCallback(async (node) => {
    if (expanding) return;
    setExpanding(true);
    setPanelNode(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/explore/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          law: lawQuery,
          nodeTitle: node.title,
          nodeSummary: node.summary,
        }),
      });
      if (res.status === 429) {
        const rl = await res.json();
        setRateLimitError({ message: rl.message, userTier: rl.userTier, resetAt: rl.resetAt });
        setExpanding(false);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.children?.length) throw new Error(data.error || 'Erreur');
      setNavStack(prev => [...prev, {
        title: node.title,
        sector: node.sector,
        nodes: data.children,
        parentLaw: lawQuery,
      }]);
    } catch {
      // En cas d'erreur, ne rien faire
    } finally {
      setExpanding(false);
    }
  }, [expanding, lawQuery, getAuthHeaders]);

  // ── Clic sur le centre → retour au niveau précédent ──
  const goBack = useCallback(() => {
    if (navStack.length <= 1) return;
    setPanelNode(null);
    setHoveredId(null);
    setNavStack(prev => prev.slice(0, -1));
  }, [navStack.length]);

  // ── Switcher vers un nœud frère (barre précédente) ────
  const switchToSibling = useCallback(async (siblingNode) => {
    if (expanding) return;
    setExpanding(true);
    setPanelNode(null);
    setHoveredId(null);
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/explore/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          law: lawQuery,
          nodeTitle: siblingNode.title,
          nodeSummary: siblingNode.summary,
        }),
      });
      if (res.status === 429) {
        const rl = await res.json();
        setRateLimitError({ message: rl.message, userTier: rl.userTier, resetAt: rl.resetAt });
        setExpanding(false);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.children?.length) throw new Error(data.error || 'Erreur');
      // Remplace le dernier niveau (même profondeur, nœud frère différent)
      setNavStack(prev => [...prev.slice(0, -1), {
        title: siblingNode.title,
        sector: siblingNode.sector,
        nodes: data.children,
        parentLaw: lawQuery,
      }]);
    } catch {
      // Silence
    } finally {
      setExpanding(false);
    }
  }, [expanding, lawQuery, getAuthHeaders]);

  // ── Responsive ─────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 640;
      setIsMobile(mobile);
      const svgW = Math.max(Math.min(w - (mobile ? 8 : 20), 1500), 300);
      const svgH = mobile
        ? Math.max(Math.min(svgW, h - 120), 260)
        : Math.max(Math.min(h - 160, 900), 300);
      setDim({ w: svgW, h: svgH });
    };
    update();
    window.addEventListener('resize', update);
    setTimeout(() => setEntered(true), 80);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Hover handlers ─────────────────────────────────────
  const handleNodeEnter = useCallback((node) => {
    clearTimeout(hoverTimer.current);
    setHoveredId(node.id);
    setPanelNode(node);
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredId(null);
    hoverTimer.current = setTimeout(() => setPanelNode(null), 400);
  }, []);

  const handlePanelEnter = useCallback(() => clearTimeout(hoverTimer.current), []);
  const handlePanelLeave = useCallback(() => {
    hoverTimer.current = setTimeout(() => setPanelNode(null), 400);
  }, []);

  // ── Guard states ───────────────────────────────────────
  if (!lawQuery && !loading) return <EmptyState />;
  if (loading) return <LoadingState law={lawQuery} />;
  if (apiError) return (
    <div style={{
      minHeight: '100vh', background: '#08080D', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 40,
      fontFamily: 'system-ui, sans-serif', color: '#E8E6E1', textAlign: 'center',
    }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>⚠️</p>
      <p style={{ color: '#EF6B5B', marginBottom: 8 }}>Erreur de génération</p>
      <p style={{ color: '#666', marginBottom: 28, fontSize: 14 }}>{apiError}</p>
      <button onClick={() => fetchConstellation(lawQuery)} style={{
        padding: '12px 28px', borderRadius: 10, border: 'none',
        background: 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
        color: '#fff', fontSize: 14, cursor: 'pointer',
      }}>Réessayer</button>
    </div>
  );

  // ── Rate limit atteint (explore ou expand) ───────────
  if (rateLimitError && !currentView) return (
    <div style={{
      minHeight: '100vh', background: '#08080D', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: 40,
      fontFamily: 'system-ui, sans-serif', color: '#E8E6E1', textAlign: 'center',
    }}>
      <p style={{ fontSize: 40, marginBottom: 16 }}>⏳</p>
      <p style={{ color: '#EFB85B', marginBottom: 8, fontSize: 18, fontWeight: 600 }}>Limite atteinte</p>
      <p style={{ color: '#888', marginBottom: 24, fontSize: 14, maxWidth: 440, lineHeight: 1.6 }}>{rateLimitError.message}</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {rateLimitError.userTier === 'anonymous' && (
          <a href="/" style={{
            padding: '12px 24px', borderRadius: 10, border: '1px solid #5B8DEF40',
            background: '#5B8DEF18', color: '#5B8DEF', fontSize: 14,
            textDecoration: 'none', fontWeight: 500,
          }}>Créer un compte gratuit</a>
        )}
        <a href="/" style={{
          padding: '12px 24px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #EFB85B 0%, #EF6B5B 100%)',
          color: '#000', fontSize: 14, textDecoration: 'none', fontWeight: 600,
        }}>Premium — 7,99€/mois</a>
        <a href="/" style={{
          padding: '12px 24px', borderRadius: 10, border: '1px solid #ffffff15',
          background: 'transparent', color: '#666', fontSize: 14, textDecoration: 'none',
        }}>← Retour</a>
      </div>
    </div>
  );
  if (!currentView) return null;

  // ── Layout ─────────────────────────────────────────────
  const cx = dim.w / 2;
  const cy = dim.h / 2;
  const marginX = 28;
  const marginY = 22;

  const orbitFrac = 0.62;
  const orbitRx = (dim.w / 2 - marginX) * orbitFrac;
  const orbitRy = (dim.h / 2 - marginY) * orbitFrac;

  const baseSize = Math.min(dim.w, dim.h) / 55;
  const nR = Math.max(7, baseSize * 2.2);

  const fs = {
    tiny:   Math.max(9,  Math.min(12, dim.w / 120)),
    small:  Math.max(13, Math.min(17, dim.w / 78)),
    center: Math.max(15, Math.min(21, dim.w / 68)),
  };

  const sectorColor = (key) => SECTORS[key]?.color || '#888';
  const centerSector = sectorColor(currentView.sector);
  const canGoBack = navStack.length > 1;
  const prevLevelNodes = navStack.length > 1 ? navStack[navStack.length - 2].nodes : [];

  // ── Split titre en 2 lignes max ────────────────────────
  const splitTitle = (title = '', maxPerLine = 14) => {
    if (!title || title.length <= maxPerLine) return [title || '', null];
    const words = title.split(' ');
    if (words.length === 1) return [title.slice(0, maxPerLine) + '…', null];
    let l1 = '', i = 0;
    while (i < words.length) {
      const test = l1 ? l1 + ' ' + words[i] : words[i];
      if (test.length > maxPerLine && l1) break;
      l1 = test; i++;
    }
    let l2 = words.slice(i).join(' ');
    if (l2.length > maxPerLine + 3) l2 = l2.slice(0, maxPerLine + 2) + '…';
    return [l1, l2 || null];
  };

  // ── Positions des nodes sur l'orbite ───────────────────
  const nodes = currentView.nodes.map((node, i) => {
    const count = currentView.nodes.length;
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return {
      ...node,
      x: cx + orbitRx * Math.cos(angle),
      y: cy + orbitRy * Math.sin(angle),
    };
  });

  // ── Breadcrumb (fil d'ariane) ──────────────────────────
  const breadcrumb = navStack.map((v, i) => ({
    title: v.title,
    index: i,
    sector: v.sector,
  }));

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#08080D',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#E8E6E1',
    }}>
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Top bar ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '8px 12px' : '10px 20px', flexShrink: 0,
        opacity: entered ? 1 : 0, transition: 'opacity 0.4s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
          <a href="/" style={{ fontSize: 11, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none', flexShrink: 0 }}>
            ← Accueil
          </a>
          {!isMobile && (
            <>
              <span style={{ color: '#1E1E28' }}>|</span>
              <span style={{ fontSize: 12, color: '#666', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {lawQuery.length > 55 ? lawQuery.slice(0, 53) + '…' : lawQuery}
              </span>
            </>
          )}
        </div>
        <a href="/explorer" style={{
          fontSize: 10, color: '#666', textDecoration: 'none', fontFamily: 'monospace',
          padding: '5px 10px', borderRadius: 6, border: '1px solid #1E1E28', whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Changer ↩
        </a>
      </div>

      {/* ── Titre + légende + breadcrumb ────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 4 : 6,
        padding: isMobile ? '0 12px 4px' : '0 20px 6px', flexShrink: 0,
        opacity: entered ? 1 : 0, transition: 'opacity 0.5s 0.2s',
      }}>
        {/* Titre de la loi d'origine */}
        <p style={{
          margin: 0, textAlign: 'center',
          fontSize: isMobile ? 12 : 15, fontWeight: 700, color: '#E8E6E1',
          lineHeight: 1.35, maxWidth: 680,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {lawQuery}
        </p>

        {/* Légende des secteurs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 8 : 18, flexWrap: 'wrap' }}>
          {Object.entries(SECTORS).map(([k, s]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: isMobile ? 7 : 9, height: isMobile ? 7 : 9,
                borderRadius: '50%', background: s.color,
                boxShadow: `0 0 7px ${s.color}70`, flexShrink: 0,
              }} />
              <span style={{ fontSize: isMobile ? 9 : fs.tiny + 0.5, color: '#888', fontFamily: 'monospace', letterSpacing: 0.3 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Breadcrumb — fil d'ariane de navigation */}
        {breadcrumb.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {breadcrumb.map((b, i) => {
              const sc = sectorColor(b.sector);
              const isLast = i === breadcrumb.length - 1;
              return (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {i > 0 && <span style={{ color: '#333', fontSize: 10 }}>›</span>}
                  <span
                    onClick={() => {
                      if (!isLast) {
                        setPanelNode(null);
                        setNavStack(prev => prev.slice(0, i + 1));
                      }
                    }}
                    style={{
                      fontSize: isMobile ? 9 : 10,
                      color: isLast ? sc : '#666',
                      fontFamily: 'monospace',
                      cursor: isLast ? 'default' : 'pointer',
                      textDecoration: isLast ? 'none' : 'underline',
                      textDecorationColor: '#333',
                      maxWidth: isMobile ? 100 : 150,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}
                  >
                    {i === 0 ? '🏠 Origine' : b.title}
                  </span>
                </span>
              );
            })}
            <span style={{ fontSize: isMobile ? 8 : 9, color: '#444', fontFamily: 'monospace', marginLeft: 4 }}>
              (niveau {navDepth})
            </span>
          </div>
        )}

        {/* Instruction contextuelle */}
        <p style={{
          margin: 0, fontSize: isMobile ? 8 : 9, color: '#555',
          fontFamily: 'monospace', letterSpacing: 0.5, textAlign: 'center',
        }}>
          {expanding ? '⏳ Chargement des implications…' :
            isMobile
              ? (canGoBack ? 'Tapez une node · Tapez le centre pour revenir' : 'Tapez une node pour voir ses détails')
              : (canGoBack ? 'Cliquez une node pour explorer · Cliquez le centre pour revenir' : 'Cliquez une node pour explorer ses implications')}
        </p>
      </div>

      {/* ── Barre nœuds précédents (siblings) ────────────── */}
      {prevLevelNodes.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: isMobile ? 4 : 6, padding: isMobile ? '4px 8px' : '5px 16px',
          flexWrap: 'wrap', flexShrink: 0,
          opacity: entered ? 1 : 0, transition: 'opacity 0.4s 0.3s',
        }}>
          {prevLevelNodes.map((sn, i) => {
            const sc = sectorColor(sn.sector);
            const isActive = sn.title === currentView.title;
            const maxLen = isMobile ? 12 : 18;
            const label = sn.title.length > maxLen ? sn.title.slice(0, maxLen - 1) + '…' : sn.title;
            return (
              <button
                key={sn.id || i}
                onClick={() => { if (!isActive) switchToSibling(sn); }}
                disabled={expanding || isActive}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 3 : 4,
                  padding: isMobile ? '3px 7px' : '4px 10px',
                  borderRadius: 20,
                  border: `1px solid ${isActive ? sc + '60' : '#ffffff12'}`,
                  background: isActive ? sc + '18' : 'transparent',
                  color: isActive ? sc : '#777',
                  fontSize: isMobile ? 8 : 9,
                  fontFamily: 'monospace',
                  cursor: expanding || isActive ? 'default' : 'pointer',
                  opacity: expanding ? 0.4 : 1,
                  transition: 'all 0.25s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <span style={{
                  width: isMobile ? 5 : 6, height: isMobile ? 5 : 6,
                  borderRadius: '50%', background: sc,
                  boxShadow: isActive ? `0 0 6px ${sc}80` : 'none',
                  flexShrink: 0,
                }} />
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── SVG Map ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0, overflow: 'hidden' }}>
        <svg
          ref={svgRef}
          width={dim.w}
          height={dim.h}
          viewBox={`0 0 ${dim.w} ${dim.h}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          <defs>
            <filter id="lblHalo" x="-20%" y="-40%" width="140%" height="180%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
              <feFlood floodColor="#08080D" floodOpacity="0.92" result="fill" />
              <feComposite in="fill" in2="blur" operator="in" result="halo" />
              <feMerge>
                <feMergeNode in="halo" />
                <feMergeNode in="halo" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="cGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={centerSector} stopOpacity="0.18" />
              <stop offset="100%" stopColor={centerSector} stopOpacity="0" />
            </radialGradient>
            {Object.entries(SECTORS).map(([k, s]) => (
              <radialGradient key={k} id={`ng-${k}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.45" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Ambient glow */}
          <ellipse cx={cx} cy={cy}
            rx={(dim.w / 2 - marginX) * 0.16}
            ry={(dim.h / 2 - marginY) * 0.20}
            fill="url(#cGlow)" />

          {/* Orbite unique */}
          <ellipse cx={cx} cy={cy} rx={orbitRx} ry={orbitRy}
            fill="none" stroke="#fff" strokeOpacity={0.07}
            strokeWidth={1.2} strokeDasharray="4 9" />

          {/* Lignes centre → nodes */}
          {nodes.map((n) => {
            const active = hoveredId === n.id;
            const sc = sectorColor(n.sector);
            return (
              <line key={`l-${n.id}`}
                x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke={sc}
                strokeOpacity={active ? 0.28 : 0.07}
                strokeWidth={active ? 1.6 : 0.7}
                style={{ transition: 'stroke-opacity 0.25s' }}
              />
            );
          })}

          {/* ── Nodes ──────────────────────────────────── */}
          {nodes.map((n) => {
            const sc = sectorColor(n.sector);
            const active = hoveredId === n.id;
            const [l1, l2] = splitTitle(n.title);
            const lineH = fs.small + 3;
            const labelOffsetY = n.y > cy
              ? nR + fs.small + 4
              : -(nR + 7 + (l2 ? lineH : 0));

            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: expanding ? 'wait' : 'pointer', transition: 'transform 0.4s ease-in-out' }}
                onMouseEnter={() => { if (!isMobile) handleNodeEnter(n); }}
                onMouseLeave={() => { if (!isMobile) handleNodeLeave(); }}
                onClick={() => {
                  if (expanding) return;
                  if (isMobile) {
                    // Mobile : afficher le panel info, pas de drill-in direct
                    setPanelNode(n);
                    setHoveredId(n.id);
                  } else {
                    // PC : drill-in direct au clic
                    drillInto(n);
                  }
                }}
              >
                {/* Glow */}
                <circle cx={0} cy={0} r={nR * 4} fill={`url(#ng-${n.sector})`}
                  opacity={active ? 0.85 : 0}
                  style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }} />

                {/* Cercle principal */}
                <circle cx={0} cy={0}
                  r={active ? nR * 1.4 : nR}
                  fill={active ? sc + '1C' : '#0C0C14'}
                  stroke={sc}
                  strokeOpacity={active ? 0.95 : 0.42}
                  strokeWidth={active ? 2.2 : 1.5}
                  style={{ transition: 'all 0.2s ease-out' }} />

                {/* Point intérieur */}
                <circle cx={0} cy={0} r={nR * 0.36} fill={sc}
                  opacity={active ? 1 : 0.65}
                  style={{ transition: 'opacity 0.2s' }} />

                {/* Label */}
                <text
                  x={0} y={labelOffsetY}
                  textAnchor="middle"
                  fill={active ? '#FFFFFF' : '#CCCCCC'}
                  fontSize={fs.small}
                  fontFamily="system-ui, sans-serif"
                  fontWeight={active ? 700 : 500}
                  filter="url(#lblHalo)"
                  style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                >
                  <tspan x={0}>{l1}</tspan>
                  {l2 && <tspan x={0} dy={lineH}>{l2}</tspan>}
                </text>
              </g>
            );
          })}

          {/* ── Loader en cours d'expansion ────────────── */}
          {expanding && (
            <circle cx={cx} cy={cy} r={nR * 3.5}
              fill="none" stroke={centerSector} strokeOpacity={0.3}
              strokeWidth={1.5} strokeDasharray="6 4"
              style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'spin 2s linear infinite' }} />
          )}

          {/* ── Nœud central ──────────────────────────── */}
          <g style={{ cursor: canGoBack ? 'pointer' : 'default' }}
            onClick={() => { if (canGoBack) goBack(); }}
          >
            <ellipse cx={cx} cy={cy}
              rx={(dim.w / 2 - marginX) * 0.11}
              ry={(dim.h / 2 - marginY) * 0.14}
              fill={centerSector + '14'}
              stroke={centerSector} strokeOpacity={canGoBack ? 0.6 : 0.45} strokeWidth={1.6} />

            {/* Flèche retour si navigable */}
            {canGoBack && (
              <text x={cx} y={cy - fs.center * 1.4} textAnchor="middle"
                fill={centerSector} fontSize={fs.tiny} fontFamily="monospace"
                opacity={0.6} style={{ pointerEvents: 'none' }}>
                ← retour
              </text>
            )}

            <text x={cx} y={cy - (canGoBack ? fs.center * 0.15 : fs.center * 0.5)} textAnchor="middle"
              fill="#E8E6E1" fontSize={fs.center} fontWeight={600}
              fontFamily="system-ui, sans-serif" style={{ pointerEvents: 'none' }}>
              {currentView.title.length > 28 ? currentView.title.slice(0, 26) + '…' : currentView.title}
            </text>
            <text x={cx} y={cy + fs.center * (canGoBack ? 0.9 : 1.15)} textAnchor="middle"
              fill="#555" fontSize={fs.tiny} fontFamily="monospace" letterSpacing={1}
              style={{ pointerEvents: 'none' }}>
              {(SECTORS[currentView.sector]?.label || currentView.sector).toUpperCase()}
            </text>
          </g>
        </svg>

        {/* ── Panel détail DESKTOP ──────────────────────── */}
        {!isMobile && panelNode && (() => {
          const sc = sectorColor(panelNode.sector);
          const secLabel = SECTORS[panelNode.sector]?.label || panelNode.sector;
          return (
            <div
              onMouseEnter={handlePanelEnter}
              onMouseLeave={handlePanelLeave}
              style={{
                position: 'absolute', bottom: 16, left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(8,8,13,0.97)',
                border: `1px solid ${sc}38`,
                borderRadius: 16, padding: '18px 22px',
                maxWidth: 440, width: 'calc(100% - 32px)',
                backdropFilter: 'blur(20px)',
                boxShadow: `0 16px 48px rgba(0,0,0,0.75), 0 0 32px ${sc}0C`,
                animation: 'panelIn 0.22s ease-out',
                zIndex: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: sc, boxShadow: `0 0 8px ${sc}90`, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, color: sc, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>{secLabel}</span>
                  <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>· Niveau {navDepth}</span>
                </div>
                <button onClick={() => setPanelNode(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, marginLeft: 8, flexShrink: 0 }}>×</button>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#E8E6E1', marginBottom: 8, lineHeight: 1.35 }}>{panelNode.title}</div>
              <div style={{ fontSize: 13, color: '#8A8880', lineHeight: 1.65, marginBottom: 16 }}>{panelNode.summary}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { window.location.href = `/?loi=${encodeURIComponent(`Externalités et besoins législatifs de "${panelNode.title}", conséquence de la loi "${lawQuery}"`)}&mode=explain`; }}
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #6BCB8E28', borderRadius: 9, background: '#6BCB8E0A', color: '#6BCB8E', fontSize: 12, fontFamily: 'monospace', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#6BCB8E1C'}
                  onMouseLeave={e => e.currentTarget.style.background = '#6BCB8E0A'}>
                  📖 Expliquer cette implication
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── Rate limit overlay (sur la carte) ──────────── */}
        {rateLimitError && currentView && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(8,8,13,0.92)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            zIndex: 20, backdropFilter: 'blur(8px)',
            padding: 24,
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⏳</p>
            <p style={{ color: '#EFB85B', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Limite d'exploration atteinte</p>
            <p style={{ color: '#888', fontSize: 13, textAlign: 'center', maxWidth: 380, lineHeight: 1.6, marginBottom: 20 }}>
              {rateLimitError.message}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {rateLimitError.userTier === 'anonymous' && (
                <a href="/" style={{
                  padding: '10px 18px', borderRadius: 8, border: '1px solid #5B8DEF40',
                  background: '#5B8DEF18', color: '#5B8DEF', fontSize: 12,
                  textDecoration: 'none', fontWeight: 500,
                }}>Créer un compte</a>
              )}
              <a href="/" style={{
                padding: '10px 18px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #EFB85B 0%, #EF6B5B 100%)',
                color: '#000', fontSize: 12, textDecoration: 'none', fontWeight: 600,
              }}>Premium 7,99€/mois</a>
              <button onClick={() => setRateLimitError(null)} style={{
                padding: '10px 18px', borderRadius: 8, border: '1px solid #ffffff15',
                background: 'transparent', color: '#666', fontSize: 12, cursor: 'pointer',
              }}>Fermer</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Panel détail MOBILE ──────────────────────────── */}
      {isMobile && panelNode && (() => {
        const sc = sectorColor(panelNode.sector);
        const secLabel = SECTORS[panelNode.sector]?.label || panelNode.sector;
        return (
          <div style={{
            flexShrink: 0,
            background: 'rgba(8,8,13,0.98)',
            border: `1px solid ${sc}38`,
            borderTop: `1.5px solid ${sc}55`,
            padding: '12px 16px',
            backdropFilter: 'blur(20px)',
            boxShadow: `0 -8px 32px rgba(0,0,0,0.6)`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc, boxShadow: `0 0 6px ${sc}90`, flexShrink: 0 }} />
                <span style={{ fontSize: 9, color: sc, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>{secLabel}</span>
                <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>· Niveau {navDepth}</span>
              </div>
              <button onClick={() => setPanelNode(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#E8E6E1', marginBottom: 5, lineHeight: 1.3 }}>{panelNode.title}</div>
            <div style={{ fontSize: 12, color: '#8A8880', lineHeight: 1.55, marginBottom: 10 }}>{panelNode.summary}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => { if (!expanding) drillInto(panelNode); }}
                disabled={expanding}
                style={{ flex: 1, padding: '8px 10px', border: `1px solid ${sc}40`, borderRadius: 8, background: `${sc}14`, color: sc, fontSize: 11, fontFamily: 'monospace', cursor: expanding ? 'wait' : 'pointer', opacity: expanding ? 0.5 : 1 }}>
                🔍 Explorer
              </button>
              <button onClick={() => { window.location.href = `/?loi=${encodeURIComponent(`Externalités et besoins législatifs de "${panelNode.title}", conséquence de la loi "${lawQuery}"`)}&mode=explain`; }}
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #6BCB8E28', borderRadius: 8, background: '#6BCB8E0A', color: '#6BCB8E', fontSize: 11, fontFamily: 'monospace', cursor: 'pointer' }}>
                📖 Expliquer
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
