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

// Fractions des dimensions pour chaque anneau (orbites elliptiques)
const RING_FRACTIONS = [0.28, 0.52, 0.80];

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
      {/* Pulsing rings */}
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
            0%, 100% { opacity: 0.2; transform: scale(${1}); }
            50% { opacity: 0.8; transform: scale(${1.05}); }
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
  const [dim, setDim] = useState({ w: 800, h: 600 });
  const [depth, setDepth] = useState(2);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [entered, setEntered] = useState(false);

  // Data state
  const [lawQuery, setLawQuery] = useState('');
  const [constellationData, setConstellationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ── Read URL param & fetch data ──────────────────────
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

  // ── Responsive dimensions (rectangular, fills screen) ─
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Desktop: wide rectangle. Mobile: ~square
      const svgW = Math.max(Math.min(w - 20, 1500), 300);
      const svgH = Math.max(Math.min(h - 185, 900), 300);
      setDim({ w: svgW, h: svgH });
    };
    update();
    window.addEventListener('resize', update);
    setTimeout(() => setEntered(true), 80);
    return () => window.removeEventListener('resize', update);
  }, []);

  // ── Show states before main render ──────────────────
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

  // ── Layout calculations ──────────────────────────────
  const cx = dim.w / 2;
  const cy = dim.h / 2;

  // Elliptical radii for each ring (fills the rectangular canvas)
  const marginX = 60;
  const marginY = 45;
  const getRingRadii = (frac) => ({
    rx: (dim.w / 2 - marginX) * frac,
    ry: (dim.h / 2 - marginY) * frac,
  });

  // Node visual size scaled with canvas
  const baseSize = Math.min(dim.w, dim.h) / 75;
  const nodeR = (ring) => Math.max(5, baseSize * (ring === 0 ? 2.2 : ring === 1 ? 1.8 : 1.4));

  // Font sizes scaled with canvas
  const fs = {
    tiny:   Math.max(9,  Math.min(12, dim.w / 130)),
    small:  Math.max(10, Math.min(13.5, dim.w / 110)),
    medium: Math.max(12, Math.min(16, dim.w / 90)),
    large:  Math.max(14, Math.min(19, dim.w / 75)),
    center: Math.max(13, Math.min(17, dim.w / 85)),
  };

  const sectorColor = (key) => SECTORS[key]?.color || '#888';
  const centerSector = sectorColor(constellationData.sector);

  // Get node positions using elliptical orbits
  const getPositions = (ringIdx) => {
    const nodes = constellationData.rings[ringIdx]?.nodes || [];
    const { rx, ry } = getRingRadii(RING_FRACTIONS[ringIdx]);
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      return { ...node, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), ring: ringIdx };
    });
  };

  const visibleNodes = [];
  for (let i = 0; i < Math.min(depth, 3); i++) {
    visibleNodes.push(...getPositions(i));
  }

  const showLabelAlways = (node) => node.ring === 0;

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#08080D',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif', color: '#E8E6E1',
    }}>
      {/* ── Top bar ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', flexShrink: 0,
        opacity: entered ? 1 : 0, transition: 'opacity 0.4s',
      }}>
        {/* Left: back + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ fontSize: 11, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none' }}>
            ← Accueil
          </a>
          <span style={{ color: '#222' }}>|</span>
          <span style={{ fontSize: 12, color: '#888', maxWidth: 280, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {lawQuery.length > 60 ? lawQuery.slice(0, 58) + '…' : lawQuery}
          </span>
        </div>

        {/* Right: depth + sector legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Sector dots legend */}
          <div style={{ display: 'none', gap: 10, alignItems: 'center' }} className="legend-desktop">
            {Object.entries(SECTORS).map(([k, s]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 9, color: '#555', fontFamily: 'monospace' }}>{s.label}</span>
              </div>
            ))}
          </div>
          {/* Depth control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>Profondeur</span>
            <div style={{ display: 'flex', background: '#111118', borderRadius: 8, padding: 3, gap: 2 }}>
              {[1, 2, 3].map((v) => (
                <button key={v} onClick={() => { setDepth(v); setSelectedNode(null); }} style={{
                  padding: '5px 12px', border: 'none', borderRadius: 5, cursor: 'pointer',
                  fontSize: 11, fontFamily: 'monospace',
                  background: depth >= v ? `${centerSector}25` : 'transparent',
                  color: depth >= v ? centerSector : '#444',
                  transition: 'all 0.2s',
                }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          {/* Change law */}
          <a href="/explorer" style={{
            fontSize: 10, color: '#666', textDecoration: 'none', fontFamily: 'monospace',
            padding: '5px 10px', borderRadius: 6, border: '1px solid #222',
            transition: 'color 0.2s, border-color 0.2s',
          }}>
            Changer ↩
          </a>
        </div>
      </div>

      {/* ── Sector legend (visible on desktop) ─────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap',
        padding: '0 20px 8px', flexShrink: 0,
        opacity: entered ? 0.8 : 0, transition: 'opacity 0.5s 0.2s',
      }}>
        {Object.entries(SECTORS).map(([k, s]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: fs.tiny, color: '#666', fontFamily: 'monospace' }}>{s.label}</span>
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
            <radialGradient id="cGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={centerSector} stopOpacity="0.15" />
              <stop offset="100%" stopColor={centerSector} stopOpacity="0" />
            </radialGradient>
            {Object.entries(SECTORS).map(([k, s]) => (
              <radialGradient key={k} id={`ng-${k}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Center ambient glow */}
          <ellipse
            cx={cx} cy={cy}
            rx={(dim.w / 2 - marginX) * 0.18}
            ry={(dim.h / 2 - marginY) * 0.22}
            fill="url(#cGlow)"
          />

          {/* Orbit ellipses */}
          {RING_FRACTIONS.map((frac, i) => {
            const { rx, ry } = getRingRadii(frac);
            return (
              <ellipse
                key={i} cx={cx} cy={cy} rx={rx} ry={ry}
                fill="none"
                stroke="#fff"
                strokeOpacity={i < depth ? 0.055 : 0.018}
                strokeWidth={1}
                strokeDasharray="3 8"
                style={{ transition: 'stroke-opacity 0.5s' }}
              />
            );
          })}

          {/* Connection lines */}
          {visibleNodes.map((n) => {
            const active = hoveredId === n.id || selectedNode?.id === n.id;
            const sc = sectorColor(n.sector);
            return (
              <line
                key={`l-${n.id}`}
                x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke={sc}
                strokeOpacity={active ? 0.22 : 0.05}
                strokeWidth={active ? 1.5 : 0.6}
                style={{ transition: 'all 0.25s' }}
              />
            );
          })}

          {/* ── Nodes ──────────────────────────────────── */}
          {visibleNodes.map((n) => {
            const sc = sectorColor(n.sector);
            const r = nodeR(n.ring);
            const active = hoveredId === n.id || selectedNode?.id === n.id;
            const showLabel = active || showLabelAlways(n);
            const shortTitle = n.title?.length > 22 ? n.title.slice(0, 20) + '…' : n.title;
            const labelY = n.y > cy ? n.y + r + fs.small + 3 : n.y - r - 5;
            const labelAnchor = 'middle';

            return (
              <g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedNode(selectedNode?.id === n.id ? null : n)}
              >
                {/* Hover glow */}
                <circle
                  cx={n.x} cy={n.y} r={r * 3.5}
                  fill={`url(#ng-${n.sector})`}
                  opacity={active ? 0.75 : 0}
                  style={{ transition: 'opacity 0.2s', pointerEvents: 'none' }}
                />
                {/* Circle */}
                <circle
                  cx={n.x} cy={n.y}
                  r={active ? r * 1.35 : r}
                  fill={active ? sc + '1A' : '#0C0C14'}
                  stroke={sc}
                  strokeOpacity={active ? 0.9 : 0.35}
                  strokeWidth={active ? 1.8 : 1.2}
                  style={{ transition: 'all 0.2s ease-out' }}
                />
                {/* Inner dot */}
                <circle cx={n.x} cy={n.y} r={r * 0.35} fill={sc} opacity={active ? 1 : 0.6} style={{ transition: 'opacity 0.2s' }} />

                {/* Label */}
                {showLabel && (
                  <>
                    {/* Label background pill */}
                    <rect
                      x={n.x - Math.min(shortTitle.length * (fs.small * 0.52), 100)}
                      y={labelY - fs.small}
                      width={Math.min(shortTitle.length * (fs.small * 1.04), 200)}
                      height={fs.small * 1.6}
                      rx={4}
                      fill={active ? 'rgba(8,8,13,0.95)' : 'rgba(8,8,13,0.75)'}
                      stroke={active ? sc + '40' : 'none'}
                      strokeWidth={0.5}
                    />
                    <text
                      x={n.x}
                      y={labelY}
                      textAnchor={labelAnchor}
                      fill={active ? '#E8E6E1' : '#999'}
                      fontSize={fs.small}
                      fontFamily="system-ui, sans-serif"
                      fontWeight={active ? 600 : 400}
                      style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                    >
                      {shortTitle}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* ── Center node ────────────────────────────── */}
          <g>
            {/* Center glow disk */}
            <ellipse
              cx={cx} cy={cy}
              rx={(dim.w / 2 - marginX) * 0.09}
              ry={(dim.h / 2 - marginY) * 0.12}
              fill={centerSector + '12'}
              stroke={centerSector}
              strokeOpacity={0.4}
              strokeWidth={1.5}
            />
            {/* Center text */}
            <text
              x={cx} y={cy - fs.center * 0.5}
              textAnchor="middle"
              fill="#E8E6E1"
              fontSize={fs.center}
              fontWeight={600}
              fontFamily="system-ui, sans-serif"
            >
              {lawQuery.length > 28 ? lawQuery.slice(0, 26) + '…' : lawQuery}
            </text>
            <text
              x={cx} y={cy + fs.center * 1.1}
              textAnchor="middle"
              fill="#555"
              fontSize={fs.tiny}
              fontFamily="monospace"
              letterSpacing={1}
            >
              {RING_LABELS[depth - 1].toUpperCase()}
            </text>
          </g>
        </svg>

        {/* ── Detail panel ─────────────────────────────── */}
        {selectedNode && (() => {
          const sc = sectorColor(selectedNode.sector);
          const secLabel = SECTORS[selectedNode.sector]?.label || selectedNode.sector;
          return (
            <div style={{
              position: 'absolute', bottom: 16, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(8,8,13,0.97)',
              border: `1px solid ${sc}35`,
              borderRadius: 16, padding: '18px 22px',
              maxWidth: 420, width: 'calc(100% - 32px)',
              backdropFilter: 'blur(20px)',
              boxShadow: `0 16px 48px rgba(0,0,0,0.7), 0 0 28px ${sc}08`,
              animation: 'panelIn 0.22s ease-out',
              zIndex: 10,
            }}>
              <style>{`
                @keyframes panelIn {
                  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
              `}</style>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc }} />
                  <span style={{ fontSize: 10, color: sc, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    {secLabel}
                  </span>
                  <span style={{ fontSize: 9, color: '#444', fontFamily: 'monospace' }}>
                    · {RING_LABELS[selectedNode.ring]}
                  </span>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{
                  background: 'none', border: 'none', color: '#555', cursor: 'pointer',
                  fontSize: 20, padding: 0, lineHeight: 1, marginLeft: 8,
                }}>×</button>
              </div>

              <div style={{ fontSize: 17, fontWeight: 600, color: '#E8E6E1', marginBottom: 8, lineHeight: 1.35 }}>
                {selectedNode.title}
              </div>
              <div style={{ fontSize: 13, color: '#8A8880', lineHeight: 1.65, marginBottom: 16 }}>
                {selectedNode.summary}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { window.location.href = `/?loi=${encodeURIComponent(selectedNode.title)}&mode=analyse`; }}
                  style={{
                    flex: 1, padding: '10px 14px', border: `1px solid ${sc}40`,
                    borderRadius: 9, background: `${sc}14`, color: sc,
                    fontSize: 12, fontFamily: 'monospace', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = `${sc}28`}
                  onMouseLeave={e => e.target.style.background = `${sc}14`}
                >
                  Analyser cette loi →
                </button>
                <button
                  onClick={() => { window.location.href = `/?loi=${encodeURIComponent(selectedNode.title)}&mode=debate`; }}
                  style={{
                    padding: '10px 14px', border: '1px solid #ffffff10',
                    borderRadius: 9, background: '#ffffff06', color: '#888',
                    fontSize: 12, fontFamily: 'monospace', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#ffffff14'}
                  onMouseLeave={e => e.target.style.background = '#ffffff06'}
                >
                  Débattre ⚔
                </button>
                <button
                  onClick={() => { window.location.href = `/explorer?loi=${encodeURIComponent(selectedNode.title)}`; }}
                  style={{
                    padding: '10px 14px', border: `1px solid #8B6BEF25`,
                    borderRadius: 9, background: '#8B6BEF0A', color: '#8B6BEF',
                    fontSize: 12, fontFamily: 'monospace', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#8B6BEF18'}
                  onMouseLeave={e => e.target.style.background = '#8B6BEF0A'}
                >
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
