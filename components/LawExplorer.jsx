'use client';

// components/LawExplorer.jsx
// ─────────────────────────────────────────────────────────
// Carte radiale d'implications législatives — SVG responsive
// URL: /explorer?loi=<proposition>
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Palette des secteurs ───────────────────────────────
const SECTORS = {
  economie:      { label: 'Économie',      color: '#E8B931' },
  libertes:      { label: 'Libertés',      color: '#5B8DEF' },
  securite:      { label: 'Sécurité',      color: '#EF6B5B' },
  social:        { label: 'Social',        color: '#6BCB8E' },
  environnement: { label: 'Environnement', color: '#8B6BEF' },
  numerique:     { label: 'Numérique',     color: '#EFB85B' },
};

const RING_LABELS = ['Implications directes', 'Lois connexes', 'Conséquences 2ème ordre'];

// Fractions par niveau de profondeur — auto-zoom:
// depth=1 → anneau unique étalé large
// depth=2 → 2 anneaux qui remplissent bien la fenêtre
// depth=3 → 3 anneaux compacts pour tout afficher
const RING_FRACTIONS_BY_DEPTH = [
  [0.65, 0.65, 0.65],   // depth=1 : anneau 0 occupe 65 % de la demi-largeur
  [0.40, 0.82, 0.82],   // depth=2 : anneau 0 à 40 %, anneau 1 à 82 %
  [0.33, 0.60, 0.88],   // depth=3 : configuration d'origine compacte
];

// ── Input vide (pas de loi dans l'URL) ─────────────────
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
  const [depth, setDepth] = useState(2);
  const [hoveredId, setHoveredId] = useState(null);

  // Hover vs click panel system
  const [panelNode, setPanelNode] = useState(null);
  const [panelLocked, setPanelLocked] = useState(false);

  const [entered, setEntered] = useState(false);

  // Data state
  const [lawQuery, setLawQuery] = useState('');
  const [constellationData, setConstellationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── URL param & fetch ────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loi = params.get('loi');
    if (!loi) return;
    const decoded = decodeURIComponent(loi);
    setLawQuery(decoded);
    fetchConstellation(decoded);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchConstellation = useCallback(async (law) => {
    setLoading(true);
    setApiError(null);
    setConstellationData(null);
    setPanelNode(null);
    setPanelLocked(false);
    try {
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ law }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur API');
      setConstellationData(data);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Responsive — mobile : SVG quasi-carré ────────────
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 640;
      setIsMobile(mobile);
      const svgW = Math.max(Math.min(w - (mobile ? 8 : 20), 1500), 300);
      const svgH = mobile
        ? Math.max(Math.min(svgW, h - 200), 260)
        : Math.max(Math.min(h - 190, 900), 300);
      setDim({ w: svgW, h: svgH });
    };
    update();
    window.addEventListener('resize', update);
    setTimeout(() => setEntered(true), 80);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Node hover : panel flottant, click verrouille ─────
  const handleNodeEnter = useCallback((node) => {
    clearTimeout(hoverTimer.current);
    setHoveredId(node.id);
    if (!panelLocked) setPanelNode(node);
  }, [panelLocked]);

  const handleNodeLeave = useCallback(() => {
    setHoveredId(null);
    if (!panelLocked) {
      hoverTimer.current = setTimeout(() => setPanelNode(null), 350);
    }
  }, [panelLocked]);

  const handleNodeClick = useCallback((node) => {
    clearTimeout(hoverTimer.current);
    if (panelLocked && panelNode?.id === node.id) {
      setPanelLocked(false);
      setPanelNode(null);
    } else {
      setPanelNode(node);
      setPanelLocked(true);
    }
  }, [panelLocked, panelNode]);

  const handlePanelEnter = useCallback(() => clearTimeout(hoverTimer.current), []);
  const handlePanelLeave = useCallback(() => {
    if (!panelLocked) hoverTimer.current = setTimeout(() => setPanelNode(null), 350);
  }, [panelLocked]);

  // ── Guard states ──────────────────────────────────────
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
  if (!constellationData) return null;

  // ── Layout ─────────────────────────────────────────
  const cx = dim.w / 2;
  const cy = dim.h / 2;
  const marginX = 28;
  const marginY = 22;

  // Fractions courantes selon la profondeur (auto-zoom)
  const ringFracs = RING_FRACTIONS_BY_DEPTH[depth - 1];

  const getRingRadii = (frac) => ({
    rx: (dim.w / 2 - marginX) * frac,
    ry: (dim.h / 2 - marginY) * frac,
  });

  const baseSize = Math.min(dim.w, dim.h) / 55;
  const nodeR = (ring) => Math.max(7, baseSize * (ring === 0 ? 2.5 : ring === 1 ? 2.0 : 1.6));

  const fs = {
    tiny:   Math.max(9,  Math.min(12, dim.w / 120)),
    small:  Math.max(11, Math.min(14.5, dim.w / 95)),
    medium: Math.max(12, Math.min(17, dim.w / 80)),
    center: Math.max(13, Math.min(18, dim.w / 80)),
  };

  const sectorColor = (key) => SECTORS[key]?.color || '#888';
  const centerSector = sectorColor(constellationData.sector);

  // Positions sur orbites elliptiques — utilisent ringFracs[depth-1]
  const getPositions = (ringIdx) => {
    const nodes = constellationData.rings[ringIdx]?.nodes || [];
    const { rx, ry } = getRingRadii(ringFracs[ringIdx]);
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      return { ...node, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), ring: ringIdx };
    });
  };

  const visibleNodes = [];
  for (let i = 0; i < Math.min(depth, 3); i++) {
    visibleNodes.push(...getPositions(i));
  }

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#08080D',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#E8E6E1',
    }}>
      {/* CSS animations */}
      <style>{`
        @keyframes panelIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .depth-btn:hover { filter: brightness(1.2); }
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

        {/* Visual depth slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {[1, 2, 3].map((v, i) => {
                const active = depth >= v;
                const btnSize = isMobile ? 28 : 34;
                const svgSize = isMobile ? 18 : 22;
                return (
                  <span key={v} style={{ display: 'flex', alignItems: 'center' }}>
                    {i > 0 && (
                      <div style={{
                        width: isMobile ? 14 : 20, height: 2,
                        background: depth >= v ? centerSector : '#252530',
                        transition: 'background 0.3s ease', borderRadius: 1,
                      }} />
                    )}
                    <button
                      className="depth-btn"
                      onClick={() => { setDepth(v); setPanelNode(null); setPanelLocked(false); }}
                      title={RING_LABELS[v - 1]}
                      style={{
                        width: btnSize, height: btnSize, borderRadius: '50%',
                        border: 'none', cursor: 'pointer', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? `${centerSector}18` : '#0E0E18',
                        outline: `1.5px solid ${active ? centerSector + '55' : '#282832'}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <svg width={svgSize} height={svgSize} viewBox="0 0 22 22">
                        <circle cx={11} cy={11} r={1.5} fill={active ? centerSector : '#555'} />
                        <circle cx={11} cy={11} r={5} fill="none"
                          stroke={active ? centerSector : '#444'} strokeWidth={1.2} opacity={active ? 0.75 : 0.3} />
                        {v >= 2 && <circle cx={11} cy={11} r={8} fill="none"
                          stroke={depth >= 2 ? centerSector : '#333'} strokeWidth={0.9} opacity={depth >= 2 ? 0.55 : 0.2} />}
                        {v >= 3 && <circle cx={11} cy={11} r={10.5} fill="none"
                          stroke={depth >= 3 ? centerSector : '#282832'} strokeWidth={0.7} opacity={depth >= 3 ? 0.4 : 0.15} />}
                      </svg>
                    </button>
                  </span>
                );
              })}
            </div>
            <span style={{ fontSize: isMobile ? 7 : 8, color: '#555', fontFamily: 'monospace', letterSpacing: 0.3, maxWidth: 130, textAlign: 'center' }}>
              {RING_LABELS[depth - 1]}
            </span>
          </div>

          <a href="/explorer" style={{
            fontSize: 10, color: '#666', textDecoration: 'none', fontFamily: 'monospace',
            padding: '5px 10px', borderRadius: 6, border: '1px solid #1E1E28', whiteSpace: 'nowrap',
          }}>
            Changer ↩
          </a>
        </div>
      </div>

      {/* ── Sector legend ─────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: isMobile ? 8 : 18, flexWrap: 'wrap',
        padding: isMobile ? '0 10px 5px' : '0 20px 8px', flexShrink: 0,
        opacity: entered ? 1 : 0, transition: 'opacity 0.5s 0.2s',
      }}>
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

      {/* ── SVG Map ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 0 }}>
        <svg
          ref={svgRef}
          width={dim.w}
          height={dim.h}
          viewBox={`0 0 ${dim.w} ${dim.h}`}
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
          <defs>
            {/* Filtre halos de texte — remplace les rectangles opaques */}
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

          {/* Centre ambient glow */}
          <ellipse cx={cx} cy={cy}
            rx={(dim.w / 2 - marginX) * 0.16}
            ry={(dim.h / 2 - marginY) * 0.20}
            fill="url(#cGlow)" />

          {/* Orbites elliptiques — s'animent avec le changement de profondeur */}
          {ringFracs.map((frac, i) => {
            const { rx, ry } = getRingRadii(frac);
            const isActive = i < depth;
            return (
              <ellipse
                key={i} cx={cx} cy={cy} rx={rx} ry={ry}
                fill="none" stroke="#fff"
                strokeOpacity={isActive ? 0.07 : 0.02}
                strokeWidth={isActive ? 1.2 : 0.7}
                strokeDasharray="4 9"
                style={{
                  transition: 'rx 0.45s ease-in-out, ry 0.45s ease-in-out, stroke-opacity 0.5s',
                }}
              />
            );
          })}

          {/* Numéros des anneaux */}
          {ringFracs.map((frac, i) => {
            if (i >= depth) return null;
            const { rx, ry } = getRingRadii(frac);
            const angle = -Math.PI / 5;
            return (
              <text key={`ri-${i}`}
                x={cx + rx * Math.cos(angle) + 5}
                y={cy + ry * Math.sin(angle) - 4}
                fill={centerSector} fontSize={fs.tiny - 1}
                fontFamily="monospace" opacity={0.3}
                style={{ pointerEvents: 'none', transition: 'x 0.45s ease-in-out, y 0.45s ease-in-out' }}
              >
                {i + 1}
              </text>
            );
          })}

          {/* Lignes de connexion — coordonnées animées */}
          {visibleNodes.map((n) => {
            const active = hoveredId === n.id || panelNode?.id === n.id;
            const sc = sectorColor(n.sector);
            return (
              <line
                key={`l-${n.id}`}
                x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke={sc}
                strokeOpacity={active ? 0.28 : 0.07}
                strokeWidth={active ? 1.6 : 0.7}
                style={{
                  transition: 'x2 0.45s ease-in-out, y2 0.45s ease-in-out, stroke-opacity 0.25s',
                }}
              />
            );
          })}

          {/* ── Nodes — transform:translate pour l'animation ── */}
          {visibleNodes.map((n) => {
            const sc = sectorColor(n.sector);
            const r = nodeR(n.ring);
            const active = hoveredId === n.id || panelNode?.id === n.id;
            const locked = panelLocked && panelNode?.id === n.id;
            const showLabel = active || n.ring === 0;
            const shortTitle = n.title?.length > 24 ? n.title.slice(0, 22) + '…' : n.title;
            // Position du label relative au nœud (centre = 0,0)
            const labelOffsetY = n.y > cy ? r + fs.small + 5 : -(r + 7);

            return (
              <g
                key={n.id}
                // transform animé : les nœuds glissent lors du changement de profondeur
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: 'pointer', transition: 'transform 0.45s ease-in-out' }}
                onMouseEnter={() => handleNodeEnter(n)}
                onMouseLeave={() => handleNodeLeave()}
                onClick={() => handleNodeClick(n)}
              >
                {/* Glow */}
                <circle cx={0} cy={0} r={r * 4} fill={`url(#ng-${n.sector})`}
                  opacity={active ? 0.85 : 0}
                  style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }} />

                {/* Indicateur verrouillé */}
                {locked && (
                  <circle cx={0} cy={0} r={r * 1.9} fill="none"
                    stroke={sc} strokeOpacity={0.25} strokeWidth={1} strokeDasharray="3 4"
                    style={{ pointerEvents: 'none' }} />
                )}

                {/* Cercle principal */}
                <circle cx={0} cy={0}
                  r={active ? r * 1.4 : r}
                  fill={active ? sc + '1C' : '#0C0C14'}
                  stroke={sc}
                  strokeOpacity={active ? 0.95 : 0.42}
                  strokeWidth={active ? 2.2 : 1.5}
                  style={{ transition: 'all 0.2s ease-out' }} />

                {/* Point intérieur */}
                <circle cx={0} cy={0} r={r * 0.36} fill={sc}
                  opacity={active ? 1 : 0.65}
                  style={{ transition: 'opacity 0.2s' }} />

                {/* ── Label SANS fond opaque — filtre halo transparent ── */}
                {showLabel && (
                  <text
                    x={0}
                    y={labelOffsetY}
                    textAnchor="middle"
                    fill={active ? '#FFFFFF' : '#CCCCCC'}
                    fontSize={fs.small}
                    fontFamily="system-ui, sans-serif"
                    fontWeight={active ? 700 : 400}
                    filter="url(#lblHalo)"
                    style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                  >
                    {shortTitle}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Nœud central ──────────────────────────── */}
          <g>
            <ellipse cx={cx} cy={cy}
              rx={(dim.w / 2 - marginX) * 0.105}
              ry={(dim.h / 2 - marginY) * 0.135}
              fill={centerSector + '14'}
              stroke={centerSector} strokeOpacity={0.45} strokeWidth={1.6} />
            <text x={cx} y={cy - fs.center * 0.5} textAnchor="middle"
              fill="#E8E6E1" fontSize={fs.center} fontWeight={600}
              fontFamily="system-ui, sans-serif">
              {lawQuery.length > 28 ? lawQuery.slice(0, 26) + '…' : lawQuery}
            </text>
            <text x={cx} y={cy + fs.center * 1.15} textAnchor="middle"
              fill="#555" fontSize={fs.tiny} fontFamily="monospace" letterSpacing={1}>
              {(SECTORS[constellationData.sector]?.label || constellationData.sector).toUpperCase()}
            </text>
          </g>
        </svg>

        {/* ── Panel détail (hover + click) ──────────────── */}
        {panelNode && (() => {
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
                  <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>· {RING_LABELS[panelNode.ring]}</span>
                  {panelLocked && (
                    <span style={{ fontSize: 8, color: '#555', fontFamily: 'monospace', background: '#ffffff08', padding: '2px 6px', borderRadius: 4, border: '1px solid #ffffff10' }}>
                      ÉPINGLÉ
                    </span>
                  )}
                </div>
                <button onClick={() => { setPanelNode(null); setPanelLocked(false); }} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, marginLeft: 8, flexShrink: 0 }}>×</button>
              </div>

              <div style={{ fontSize: 17, fontWeight: 600, color: '#E8E6E1', marginBottom: 8, lineHeight: 1.35 }}>
                {panelNode.title}
              </div>
              <div style={{ fontSize: 13, color: '#8A8880', lineHeight: 1.65, marginBottom: 16 }}>
                {panelNode.summary}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { window.location.href = `/?loi=${encodeURIComponent(panelNode.title)}&mode=analyse`; }}
                  style={{ flex: 1, padding: '10px 14px', border: `1px solid ${sc}40`, borderRadius: 9, background: `${sc}14`, color: sc, fontSize: 12, fontFamily: 'monospace', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = `${sc}28`}
                  onMouseLeave={e => e.currentTarget.style.background = `${sc}14`}>
                  Analyser →
                </button>
                <button onClick={() => { window.location.href = `/?loi=${encodeURIComponent(panelNode.title)}&mode=debate`; }}
                  style={{ padding: '10px 14px', border: '1px solid #ffffff10', borderRadius: 9, background: '#ffffff06', color: '#888', fontSize: 12, fontFamily: 'monospace', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffffff14'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ffffff06'}>
                  Débattre ⚔
                </button>
                <button onClick={() => { window.location.href = `/explorer?loi=${encodeURIComponent(panelNode.title)}`; }}
                  style={{ padding: '10px 14px', border: '1px solid #8B6BEF28', borderRadius: 9, background: '#8B6BEF0A', color: '#8B6BEF', fontSize: 12, fontFamily: 'monospace', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#8B6BEF1C'}
                  onMouseLeave={e => e.currentTarget.style.background = '#8B6BEF0A'}>
                  ↻ Explorer
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
