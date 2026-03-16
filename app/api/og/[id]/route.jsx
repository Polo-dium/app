// app/api/og/[id]/route.jsx
// ─────────────────────────────────────────────────────────
// Génère l'image OG 1080x1080 côté serveur via next/og
// URL: /api/og/[id]
// ─────────────────────────────────────────────────────────

import { ImageResponse } from 'next/og';
import { getShare } from '@/lib/share';

export const runtime = 'edge';

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

export async function GET(request, { params }) {
  const { id } = params;
  const share = await getShare(id);

  // ── Fallback ───────────────────────────────────────────
  if (!share) {
    return new ImageResponse(
      (
        <div style={{
          width: 1080, height: 1080,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(180deg, #0A0A12 0%, #0D0B18 50%, #0A0A12 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <span style={{ fontSize: '48px', color: '#8B6BEF', letterSpacing: '4px', fontWeight: 600 }}>
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
        // ────────────────────────────────────────────────
        // DÉBAT layout
        // ────────────────────────────────────────────────
        <div style={{
          width: 1080, height: 1080,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #0A0A12 0%, #0D0B18 50%, #0A0A12 100%)',
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(139,107,239,0.07) 0%, transparent 60%)',
            display: 'flex',
          }} />

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
            <span style={{ fontSize: '22px', color: '#8B6BEF', letterSpacing: '4px', fontWeight: 700 }}>
              🦋 BUTTERFLY.GOV
            </span>
          </div>

          {/* Mode */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '14px', color: '#555', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Mode Débat
            </span>
          </div>

          {/* Two laws */}
          <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
            {[
              { label: 'LOI A', title: share.loi_a_titre, scores: share.loi_a_scores, color: '#5B8DEF' },
              { label: 'LOI B', title: share.loi_b_titre, scores: share.loi_b_scores, color: '#EF5B8D' },
            ].map(({ label, title, scores, color }) => (
              <div key={label} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                padding: '32px', borderRadius: '20px',
                border: `1.5px solid ${color}30`,
                background: `linear-gradient(180deg, ${color}08 0%, ${color}03 100%)`,
              }}>
                <div style={{ fontSize: '14px', color, fontWeight: 700, letterSpacing: '2px', marginBottom: '12px' }}>{label}</div>
                <div style={{ fontSize: '20px', color: '#E8E6E1', fontWeight: 600, marginBottom: '24px', lineHeight: 1.35 }}>
                  "{title?.length > 80 ? title.slice(0, 80) + '…' : title}"
                </div>
                {scores && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(SCORE_COLORS).map(([key, clr]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', color: '#555', width: '110px' }}>{SCORE_LABELS[key]}</span>
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
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
            <span style={{ fontSize: '13px', color: '#333', letterSpacing: '2px' }}>
              butterflygov.com • Simulateur politique propulsé par IA
            </span>
          </div>
        </div>

      ) : (
        // ────────────────────────────────────────────────
        // ANALYSE layout
        // ────────────────────────────────────────────────
        <div style={{
          width: 1080, height: 1080,
          display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #0A0A12 0%, #0D0B18 50%, #0A0A12 100%)',
          padding: '52px 60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Glow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(circle at 50% 25%, rgba(139,107,239,0.07) 0%, transparent 55%)',
            display: 'flex',
          }} />

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '22px', color: '#8B6BEF', letterSpacing: '4px', fontWeight: 700 }}>
              🦋 BUTTERFLY.GOV
            </span>
          </div>

          {/* Proposition */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px', padding: '0 16px' }}>
            <span style={{
              fontSize: share.proposition?.length > 80 ? '26px' : '30px',
              color: '#E8E6E1', textAlign: 'center', lineHeight: 1.35,
              fontWeight: 600, maxWidth: '880px', display: 'block',
            }}>
              "{share.proposition}"
            </span>
          </div>

          {/* Sous-titre */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <span style={{ fontSize: '13px', color: '#444', letterSpacing: '3px', textTransform: 'uppercase' }}>
              Analyse d'impact — Butterfly.gov
            </span>
          </div>

          {/* Score cards */}
          {share.scores && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '24px' }}>
              {Object.entries(SCORE_COLORS).map(([key, color]) => (
                <div key={key} style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  width: '192px', height: '148px',
                  borderRadius: '18px',
                  border: `1.5px solid ${color}30`,
                  background: `linear-gradient(180deg, ${color}10 0%, ${color}04 100%)`,
                }}>
                  <span style={{ fontSize: '22px', marginBottom: '3px' }}>{SCORE_ICONS[key]}</span>
                  <span style={{ fontSize: '11px', color, letterSpacing: '2px', fontWeight: 600, marginBottom: '6px' }}>
                    {SCORE_LABELS[key]}
                  </span>
                  <span style={{ fontSize: '44px', fontWeight: 700, color }}>{share.scores[key] ?? '?'}</span>
                  <span style={{ fontSize: '12px', color: '#444' }}>/100</span>
                </div>
              ))}
            </div>
          )}

          {/* Score global */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '22px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 40px', borderRadius: '60px',
              border: `2px solid ${getScoreColor(share.score_global)}40`,
              background: `${getScoreColor(share.score_global)}10`,
            }}>
              <span style={{ fontSize: '18px' }}>⭐</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: getScoreColor(share.score_global) }}>
                Score Global : {share.score_global}/100
              </span>
            </div>
          </div>

          {/* Gagnants / Perdants */}
          {(share.gagnants || share.perdants) && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '18px', padding: '0 4px' }}>
              {share.gagnants && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  padding: '16px 20px', borderRadius: '14px',
                  border: '1.5px solid rgba(107,203,142,0.20)',
                  background: 'rgba(107,203,142,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>🏆</span>
                    <span style={{ fontSize: '12px', color: '#6BCB8E', fontWeight: 700, letterSpacing: '1.5px' }}>GAGNANTS</span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#8A8880', lineHeight: 1.45 }}>
                    {share.gagnants.length > 90 ? share.gagnants.slice(0, 90) + '…' : share.gagnants}
                  </span>
                </div>
              )}
              {share.perdants && (
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  padding: '16px 20px', borderRadius: '14px',
                  border: '1.5px solid rgba(239,107,91,0.20)',
                  background: 'rgba(239,107,91,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>💥</span>
                    <span style={{ fontSize: '12px', color: '#EF6B5B', fontWeight: 700, letterSpacing: '1.5px' }}>PERDANTS</span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#8A8880', lineHeight: 1.45 }}>
                    {share.perdants.length > 90 ? share.perdants.slice(0, 90) + '…' : share.perdants}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Effet papillon ─────────────────────────────── */}
          {share.effet_papillon && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              padding: '18px 24px', borderRadius: '14px',
              border: '1.5px solid rgba(139,107,239,0.28)',
              background: 'linear-gradient(135deg, rgba(139,107,239,0.09) 0%, rgba(91,141,239,0.04) 100%)',
              marginBottom: '18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '9px' }}>
                <span style={{ fontSize: '18px' }}>🦋</span>
                <span style={{ fontSize: '12px', color: '#8B6BEF', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  Effet papillon · dans 5 ans
                </span>
              </div>
              <span style={{ fontSize: '16px', color: '#C8C6C1', lineHeight: 1.55, fontStyle: 'italic' }}>
                "{share.effet_papillon}"
              </span>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 'auto' }}>
            <span style={{ fontSize: '13px', color: '#333', letterSpacing: '2px' }}>
              butterflygov.com • Simulateur politique propulsé par IA
            </span>
          </div>
        </div>
      ),
      { width: 1080, height: 1080 }
    );
  } catch (error) {
    console.error('OG image generation error:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
