'use client';

// components/LawExplorer.jsx
// ─────────────────────────────────────────────────────────
// Explorateur radial d'implications législatives
// Affiche une loi centrale entourée de 3 anneaux de connexions
// ─────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

const SECTORS = {
  economie:      { label: 'Économie',      color: '#E8B931' },
  libertes:      { label: 'Libertés',      color: '#5B8DEF' },
  securite:      { label: 'Sécurité',      color: '#EF6B5B' },
  social:        { label: 'Social',        color: '#6BCB8E' },
  environnement: { label: 'Environnement', color: '#8B6BEF' },
  numerique:     { label: 'Numérique',     color: '#EF8B5B' },
};

const MOCK_DATA = {
  center: {
    id: 'loi-ia-2026',
    title: "Loi sur l'encadrement de l'IA",
    subtitle: 'Projet de loi n°2026-142',
    sector: 'numerique',
  },
  rings: [
    {
      label: 'Implications directes',
      nodes: [
        { id: 'rgpd-ext',   title: "Extension RGPD aux modèles d'IA",    sector: 'numerique',     summary: "Obligation de transparence algorithmique pour tout système de décision automatisée" },
        { id: 'emploi-ia',  title: "Protection de l'emploi face à l'IA", sector: 'social',        summary: "Plan de reconversion obligatoire pour les entreprises automatisant plus de 30% des postes" },
        { id: 'souv-num',   title: 'Souveraineté numérique européenne',   sector: 'economie',      summary: "Obligation d'hébergement EU pour les données d'entraînement des modèles" },
        { id: 'surv-ia',    title: 'Surveillance algorithmique',          sector: 'securite',      summary: "Encadrement de l'utilisation de l'IA par les forces de l'ordre" },
        { id: 'ethique-ia', title: "Comité d'éthique de l'IA",           sector: 'libertes',      summary: "Création d'une autorité indépendante de contrôle des systèmes d'IA" },
      ],
    },
    {
      label: 'Lois connexes',
      nodes: [
        { id: 'ai-act',           title: 'AI Act européen (2024)',        sector: 'numerique',     summary: "Règlement européen classifiant les IA par niveau de risque" },
        { id: 'droit-deconnexion',title: 'Droit à la déconnexion',        sector: 'social',        summary: "Extension aux interactions avec les agents IA en milieu professionnel" },
        { id: 'taxe-robot',       title: "Taxe sur l'automatisation",     sector: 'economie',      summary: "Contribution des entreprises utilisant l'IA pour financer la transition sociale" },
        { id: 'biometrie',        title: 'Loi biométrie (2023)',          sector: 'securite',      summary: "Interdiction de la reconnaissance faciale dans l'espace public" },
        { id: 'open-source',      title: 'Directive open source IA',      sector: 'libertes',      summary: "Obligation de publication du code source des IA utilisées par l'État" },
        { id: 'green-ai',         title: 'Empreinte carbone data centers', sector: 'environnement', summary: "Plafonnement de la consommation énergétique des centres d'entraînement IA" },
      ],
    },
    {
      label: 'Conséquences de 2nd ordre',
      nodes: [
        { id: 'fuite-cerveaux', title: 'Fuite des talents tech',           sector: 'economie',      summary: "Risque de délocalisation des startups IA vers des juridictions moins régulées" },
        { id: 'justice-pred',   title: 'Justice prédictive',               sector: 'libertes',      summary: "Débat sur l'utilisation de l'IA dans les décisions judiciaires" },
        { id: 'cyber-souv',     title: 'Cyberdéfense nationale',           sector: 'securite',      summary: "Investissement dans l'IA défensive pour la protection des infrastructures critiques" },
        { id: 'transition-eco', title: "Transition écologique par l'IA",  sector: 'environnement', summary: "Utilisation de l'IA pour optimiser la consommation énergétique nationale" },
        { id: 'democratie-num', title: 'Démocratie participative',         sector: 'numerique',     summary: "Outils IA de consultation citoyenne pour l'élaboration des lois" },
        { id: 'sante-ia',       title: 'IA et diagnostic médical',         sector: 'social',        summary: "Responsabilité légale en cas d'erreur d'un système IA de santé" },
      ],
    },
  ],
};

const RING_LABELS = ['Implications directes', 'Lois connexes', 'Conséquences 2nd ordre'];

export default function LawExplorer() {
  const containerRef = useRef(null);
  const [dim, setDim] = useState({ w: 800, h: 800 });
  const [depth, setDepth] = useState(1);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = Math.min(window.innerWidth, 960);
      const h = Math.min(window.innerHeight - 140, 960);
      const s = Math.min(w, h);
      setDim({ w: s, h: s });
    };
    update();
    window.addEventListener('resize', update);
    setTimeout(() => setEntered(true), 80);
    return () => window.removeEventListener('resize', update);
  }, []);

  const cx = dim.w / 2;
  const cy = dim.h / 2;
  const maxR = Math.min(cx, cy) - 20;
  const ringRadii = [maxR * 0.34, maxR * 0.62, maxR * 0.92];

  const getPositions = (ringIdx) => {
    const nodes = MOCK_DATA.rings[ringIdx].nodes;
    const r = ringRadii[ringIdx];
    return nodes.map((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      return { ...node, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), ring: ringIdx };
    });
  };

  const visibleNodes = [];
  for (let i = 0; i < depth; i++) {
    visibleNodes.push(...getPositions(i));
  }

  const nodeR = (ring) => ring === 0 ? maxR * 0.05 : ring === 1 ? maxR * 0.042 : maxR * 0.036;
  const centerSector = SECTORS[MOCK_DATA.center.sector];

  const handleSelect = (node) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  // ── Navigation vers la homepage avec pré-remplissage ──
  const goAnalyse = (title) => {
    window.location.href = `/?loi=${encodeURIComponent(title)}&mode=analyse`;
  };
  const goDebat = (title) => {
    window.location.href = `/?loi=${encodeURIComponent(title)}&mode=debate`;
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#08080D',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflow: 'hidden', fontFamily: "'DM Sans', system-ui, sans-serif",
      color: '#E8E6E1',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: '16px 24px 0', textAlign: 'center', width: '100%', maxWidth: 700,
        opacity: entered ? 1 : 0, transform: entered ? 'none' : 'translateY(-8px)',
        transition: 'all 0.5s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 2 }}>
          <a href="/" style={{ fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}>
            ← Butterfly.gov
          </a>
          <span style={{ color: '#333' }}>·</span>
          <span style={{ fontSize: 10, color: '#444', fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>Explorateur</span>
        </div>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 20, fontWeight: 400, margin: '2px 0 0', color: '#ccc' }}>
          Carte d'implications législatives
        </h1>
      </div>

      {/* Depth slider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        opacity: entered ? 1 : 0, transition: 'opacity 0.5s 0.2s',
      }}>
        <span style={{ fontSize: 10, color: '#555', fontFamily: "'JetBrains Mono', monospace", minWidth: 80 }}>Profondeur</span>
        <div style={{ display: 'flex', gap: 0, background: '#111118', borderRadius: 8, padding: 3 }}>
          {[1, 2, 3].map((v) => (
            <button
              key={v}
              onClick={() => { setDepth(v); setSelectedNode(null); }}
              style={{
                padding: '6px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                background: depth >= v ? `${centerSector.color}${v === depth ? '30' : '12'}` : 'transparent',
                color: depth >= v ? centerSector.color : '#444',
                transition: 'all 0.25s',
              }}
            >
              {v}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 10, color: depth <= 3 ? '#666' : '#444', fontFamily: "'JetBrains Mono', monospace", transition: 'color 0.3s' }}>
          {RING_LABELS[depth - 1]}
        </span>
      </div>

      {/* Sector legend */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', padding: '0 20px 6px',
        opacity: entered ? 1 : 0, transition: 'opacity 0.5s 0.3s',
      }}>
        {Object.entries(SECTORS).map(([k, s]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, opacity: 0.7 }} />
            <span style={{ fontSize: 9, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* SVG map */}
      <div ref={containerRef} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <svg width={dim.w} height={dim.h} viewBox={`0 0 ${dim.w} ${dim.h}`}>
          <defs>
            <radialGradient id="cGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={centerSector.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={centerSector.color} stopOpacity="0" />
            </radialGradient>
            {Object.entries(SECTORS).map(([k, s]) => (
              <radialGradient key={k} id={`ng-${k}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0" />
              </radialGradient>
            ))}
          </defs>

          {/* Center ambient glow */}
          <circle cx={cx} cy={cy} r={maxR * 0.22} fill="url(#cGlow)" />

          {/* Ring circles */}
          {ringRadii.map((r, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={r}
              fill="none" stroke="#fff"
              strokeOpacity={i < depth ? 0.05 : 0.015}
              strokeWidth={1}
              strokeDasharray="3 7"
              style={{ transition: 'stroke-opacity 0.5s ease-out' }}
            />
          ))}

          {/* Connection lines */}
          {visibleNodes.map((n) => {
            const active = hoveredId === n.id || selectedNode?.id === n.id;
            const sc = SECTORS[n.sector];
            return (
              <line
                key={`l-${n.id}`}
                x1={cx} y1={cy} x2={n.x} y2={n.y}
                stroke={sc.color}
                strokeOpacity={active ? 0.2 : 0.04}
                strokeWidth={active ? 1.2 : 0.5}
                style={{ transition: 'all 0.3s' }}
              />
            );
          })}

          {/* Nodes */}
          {visibleNodes.map((n) => {
            const sc = SECTORS[n.sector];
            const r = nodeR(n.ring);
            const active = hoveredId === n.id || selectedNode?.id === n.id;

            return (
              <g
                key={n.id}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(n.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(n)}
              >
                {/* Hover glow */}
                <circle
                  cx={n.x} cy={n.y} r={r * 3}
                  fill={`url(#ng-${n.sector})`}
                  opacity={active ? 0.7 : 0}
                  style={{ transition: 'opacity 0.25s', pointerEvents: 'none' }}
                />
                {/* Main circle */}
                <circle
                  cx={n.x} cy={n.y}
                  r={active ? r * 1.3 : r}
                  fill={active ? sc.color + '20' : '#0C0C14'}
                  stroke={sc.color}
                  strokeOpacity={active ? 0.8 : 0.3}
                  strokeWidth={active ? 1.5 : 1}
                  style={{ transition: 'all 0.2s ease-out' }}
                />
                {/* Inner dot */}
                <circle cx={n.x} cy={n.y} r={2.5} fill={sc.color} opacity={active ? 1 : 0.5} style={{ transition: 'opacity 0.2s' }} />

                {/* Label — only on hover/select */}
                {active && (
                  <g>
                    <rect
                      x={n.x - Math.min(n.title.length * 3.6, 90)}
                      y={n.y - r - 26}
                      width={Math.min(n.title.length * 7.2, 180)}
                      height={20}
                      rx={5}
                      fill="rgba(8,8,13,0.92)"
                      stroke={sc.color + '33'}
                      strokeWidth={0.5}
                    />
                    <text
                      x={n.x}
                      y={n.y - r - 13}
                      textAnchor="middle"
                      fill="#E8E6E1"
                      fontSize={10.5}
                      fontFamily="'DM Sans', sans-serif"
                      fontWeight={500}
                    >
                      {n.title.length > 26 ? n.title.slice(0, 24) + '…' : n.title}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Center node */}
          <g>
            <circle cx={cx} cy={cy} r={maxR * 0.1} fill="#0C0C14" stroke={centerSector.color} strokeWidth={1.5} strokeOpacity={0.5} />
            <circle cx={cx} cy={cy} r={maxR * 0.1} fill="url(#cGlow)" opacity={0.3} />
            <text x={cx} y={cy - 4} textAnchor="middle" fill="#E8E6E1" fontSize={11} fontFamily="'Instrument Serif', Georgia, serif">
              Encadrement de l'IA
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill="#555" fontSize={8.5} fontFamily="'JetBrains Mono', monospace">
              n°2026-142
            </text>
          </g>
        </svg>

        {/* Detail panel */}
        {selectedNode && (() => {
          const sc = SECTORS[selectedNode.sector];
          return (
            <div style={{
              position: 'absolute', bottom: 12, left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10,10,18,0.96)',
              border: `1px solid ${sc.color}30`,
              borderRadius: 14, padding: '16px 20px',
              maxWidth: 380, width: 'calc(100% - 40px)',
              backdropFilter: 'blur(16px)',
              boxShadow: `0 12px 40px rgba(0,0,0,0.6), 0 0 24px ${sc.color}08`,
              animation: 'panelIn 0.25s ease-out',
            }}>
              <style>{`@keyframes panelIn { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.color }} />
                  <span style={{ fontSize: 10, color: sc.color, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{sc.label}</span>
                  <span style={{ fontSize: 9, color: '#444', fontFamily: "'JetBrains Mono', monospace" }}>
                    · {RING_LABELS[selectedNode.ring]}
                  </span>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
              </div>

              <div style={{ fontSize: 17, fontWeight: 500, color: '#E8E6E1', marginBottom: 8, fontFamily: "'Instrument Serif', Georgia, serif", lineHeight: 1.3 }}>
                {selectedNode.title}
              </div>
              <div style={{ fontSize: 13, color: '#8A8880', lineHeight: 1.6, marginBottom: 14 }}>
                {selectedNode.summary}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => goAnalyse(selectedNode.title)}
                  style={{
                    flex: 1, padding: '9px 14px', border: `1px solid ${sc.color}33`,
                    borderRadius: 8, background: `${sc.color}12`, color: sc.color,
                    fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = `${sc.color}25`}
                  onMouseLeave={e => e.target.style.background = `${sc.color}12`}
                >
                  Analyser cette loi →
                </button>
                <button
                  onClick={() => goDebat(selectedNode.title)}
                  style={{
                    padding: '9px 14px', border: '1px solid #ffffff10',
                    borderRadius: 8, background: '#ffffff06', color: '#777',
                    fontSize: 11.5, fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#ffffff10'}
                  onMouseLeave={e => e.target.style.background = '#ffffff06'}
                >
                  Débattre
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
