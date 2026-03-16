// app/api/og/[id]/route.jsx
// ─────────────────────────────────────────────────────────
// Génère l'image OG 1080x1080 côté serveur via next/og
// URL: /api/og/[id]
// ─────────────────────────────────────────────────────────

import { ImageResponse } from 'next/og';
import { getShare } from '@/lib/share';

export const runtime = 'edge';

// ── Couleurs par catégorie ──────────────────────────────
const SCORE_COLORS = {
  economy:     '#E8B931',
  social:      '#EF5B8D',
  ecology:     '#6BCB8E',
  faisabilite: '#8B6BEF',
};

const SCORE_LABELS = {
  economy:     'ÉCONOMIE',
  social:      'SOCIAL',
  ecology:     'ÉCOLOGIE',
  faisabilite: 'FAISABILITÉ',
};

const SCORE_ICONS = {
  economy:     '📈',
  social:      '❤️',
  ecology:     '🌿',
  faisabilite: '⚙️',
};

function getScoreColor(score) {
  if (score >= 70) return '#6BCB8E';
  if (score >= 50) return '#E8B931';
  if (score >= 35) return '#EF8B5B';
  return '#EF5B5B';
}

// ── Ailes de papillon SVG (fond décoratif) ─────────────
// Rendu via des divs CSS car next/og ne supporte pas SVG <path>
function ButterflyWings() {
  return (
    <>
      {/* ── Aile haute gauche ── */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 460,
          height: 380,
          top: 220,
          left: 80,
          borderRadius: '90% 10% 60% 20%',
          background:
            'linear-gradient(145deg, rgba(139,107,239,0.18) 0%, rgba(91,141,239,0.06) 60%, transparent 100%)',
          transform: 'rotate(-18deg)',
        }}
      />
      {/* ── Aile haute droite ── */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 460,
          height: 380,
          top: 220,
          right: 80,
          borderRadius: '10% 90% 20% 60%',
          background:
            'linear-gradient(215deg, rgba(139,107,239,0.18) 0%, rgba(91,141,239,0.06) 60%, transparent 100%)',
          transform: 'rotate(18deg)',
        }}
      />
      {/* ── Aile basse gauche ── */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 300,
          height: 260,
          top: 530,
          left: 160,
          borderRadius: '70% 10% 90% 20%',
          background:
            'linear-gradient(160deg, rgba(139,107,239,0.12) 0%, rgba(91,141,239,0.04) 70%, transparent 100%)',
          transform: 'rotate(-25deg)',
        }}
      />
      {/* ── Aile basse droite ── */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 300,
          height: 260,
          top: 530,
          right: 160,
          borderRadius: '10% 70% 20% 90%',
          background:
            'linear-gradient(200deg, rgba(139,107,239,0.12) 0%, rgba(91,141,239,0.04) 70%, transparent 100%)',
          transform: 'rotate(25deg)',
        }}
      />
      {/* ── Corps central ── */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          width: 18,
          height: 320,
          top: 340,
          left: 531,
          borderRadius: 20,
          background: 'linear-gradient(180deg, rgba(139,107,239,0.25) 0%, rgba(91,141,239,0.08) 100%)',
        }}
      />
    </>
  );
}

export async function GET(request, { params }) {
  const { id } = params;

  const share = await getShare(id);

  // ── Fallback si pas trouvé ────────────────────────────
  if (!share) {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #0A0A12 0%, #0D0B18 50%, #0A0A12 100%)',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <ButterflyWings />
          <span style={{ fontSize: '48px', color: '#8B6BEF', letterSpacing: '4px', fontWeight: 600, position: 'relative' }}>
            🦋 BUTTERFLY.GOV
          </span>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  }

  const isDebate = share.type === 'debat';

  try {
    return new ImageResponse(
      isDebate ? (
        // ── DÉBAT layout ──────────────────────────────────
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0A0A12 0%, #0D0B18 50%, #0A0A12 100%)',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Effet papillon en fond */}
          <ButterflyWings />

          {/* Glow central */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'radial-gradient(circle at 50% 35%, rgba(139,107,239,0.08) 0%, transparent 55%)',
              display: 'flex',
            }}
          />

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '36px', position: 'relative' }}>
            <span style={{ fontSize: '24px', color: '#8B6BEF', letterSpacing: '4px', fontWeight: 700 }}>
              🦋 BUTTERFLY.GOV
            </span>
          </div>

          {/* Mode label */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px', position: 'relative' }}>
            <span style={{ fontSize: '15px', color: '#555', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Mode Débat
            </span>
          </div>

          {/* Laws side by side */}
          <div style={{ display: 'flex', gap: '24px', flex: 1, position: 'relative' }}>
            {[
              { label: 'LOI A', title: share.loi_a_titre, scores: share.loi_a_scores, color: '#5B8DEF' },
              { label: 'LOI B', title: share.loi_b_titre, scores: share.loi_b_scores, color: '#EF5B8D' },
            ].map(({ label, title, scores, color }) => (
              <div
                key={label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '32px',
                  borderRadius: '20px',
                  border: `1.5px solid ${color}30`,
                  background: `linear-gradient(180deg, ${color}08 0%, ${color}03 100%)`,
                }}
              >
                <div style={{ fontSize: '14px', color, fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>{label}</div>
                <div style={{ fontSize: '20px', color: '#E8E6E1', fontWeight: 600, marginBottom: '24px', lineHeight: 1.35 }}>
                  "{title?.length > 80 ? title.slice(0, 80) + '…' : title}"
                </div>
                {scores && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(SCORE_COLORS).map(([key, clr]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#666', width: '110px' }}>{SCORE_LABELS[key]}</span>
                        <div style={{ flex: 1, background: '#1A1A2E', borderRadius: '6px', height: '8px', display: 'flex' }}>
                          <div style={{ width: `${scores[key] || 0}%`, height: '100%', background: clr, borderRadius: '6px' }} />
                        </div>
                        <span style={{ fontSize: '16px', color: clr, fontWeight: 700, width: '36px', textAlign: 'right' }}>{scores[key] ?? '?'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '28px', position: 'relative' }}>
            <span style={{ fontSize: '13px', color: '#333', letterSpacing: '2px' }}>
              butterflygov.com • Simulateur politique propulsé par IA
            </span>
          </div>
        </div>
      ) : (
        // ── ANALYSE layout ────────────────────────────────
        <div
          style={{
            width: 1080,
            height: 1080,
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(180deg, #0A0A12 0%, #0D0B18 50%, #0A0A12 100%)',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Effet papillon en fond */}
          <ButterflyWings />

          {/* Glow central */}
          <div
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(139,107,239,0.08) 0%, transparent 55%)',
              display: 'flex',
            }}
          />

          {/* Branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '36px',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '24px', color: '#8B6BEF', letterSpacing: '4px', fontWeight: 700 }}>
              🦋 BUTTERFLY.GOV
            </span>
          </div>

          {/* Proposition text */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '40px',
              padding: '0 20px',
              position: 'relative',
            }}
          >
            <span
              style={{
                fontSize: share.proposition?.length > 80 ? '28px' : '32px',
                color: '#E8E6E1',
                textAlign: 'center',
                lineHeight: 1.35,
                fontWeight: 600,
                maxWidth: '880px',
                display: 'block',
              }}
            >
              "{share.proposition}"
            </span>
          </div>

          {/* Label */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px', position: 'relative' }}>
            <span style={{ fontSize: '14px', color: '#555', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Analyse d'impact — Butterfly.gov
            </span>
          </div>

          {/* Score cards */}
          {share.scores && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                marginBottom: '32px',
                position: 'relative',
              }}
            >
              {Object.entries(SCORE_COLORS).map(([key, color]) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '200px',
                    height: '160px',
                    borderRadius: '20px',
                    border: `1.5px solid ${color}30`,
                    background: `linear-gradient(180deg, ${color}10 0%, ${color}04 100%)`,
                  }}
                >
                  <span style={{ fontSize: '26px', marginBottom: '4px' }}>{SCORE_ICONS[key]}</span>
                  <span style={{ fontSize: '12px', color: color, letterSpacing: '2px', fontWeight: 600, marginBottom: '8px' }}>
                    {SCORE_LABELS[key]}
                  </span>
                  <span style={{ fontSize: '48px', fontWeight: 700, color: color }}>
                    {share.scores[key] ?? '?'}
                  </span>
                  <span style={{ fontSize: '13px', color: '#444' }}>/100</span>
                </div>
              ))}
            </div>
          )}

          {/* Score global */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px', position: 'relative' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 44px',
                borderRadius: '60px',
                border: `2px solid ${getScoreColor(share.score_global)}40`,
                background: `${getScoreColor(share.score_global)}12`,
              }}
            >
              <span style={{ fontSize: '20px' }}>⭐</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: getScoreColor(share.score_global) }}>
                Score Global : {share.score_global}/100
              </span>
            </div>
          </div>

          {/* Gagnants / Perdants */}
          {(share.gagnants || share.perdants) && (
            <div
              style={{
                display: 'flex',
                gap: '20px',
                marginBottom: '24px',
                padding: '0 10px',
                position: 'relative',
              }}
            >
              {share.gagnants && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    border: '1.5px solid rgba(107,203,142,0.20)',
                    background: 'rgba(107,203,142,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px' }}>🏆</span>
                    <span style={{ fontSize: '14px', color: '#6BCB8E', fontWeight: 700, letterSpacing: '1.5px' }}>GAGNANTS</span>
                  </div>
                  <span style={{ fontSize: '15px', color: '#9A9890', lineHeight: 1.5 }}>
                    {share.gagnants.length > 100 ? share.gagnants.slice(0, 100) + '…' : share.gagnants}
                  </span>
                </div>
              )}
              {share.perdants && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '20px 24px',
                    borderRadius: '16px',
                    border: '1.5px solid rgba(239,107,91,0.20)',
                    background: 'rgba(239,107,91,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '18px' }}>💥</span>
                    <span style={{ fontSize: '14px', color: '#EF6B5B', fontWeight: 700, letterSpacing: '1.5px' }}>PERDANTS</span>
                  </div>
                  <span style={{ fontSize: '15px', color: '#9A9890', lineHeight: 1.5 }}>
                    {share.perdants.length > 100 ? share.perdants.slice(0, 100) + '…' : share.perdants}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 'auto',
              position: 'relative',
            }}
          >
            <span style={{ fontSize: '13px', color: '#333', letterSpacing: '2px' }}>
              butterflygov.com • Simulateur politique propulsé par IA
            </span>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1080,
      }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
