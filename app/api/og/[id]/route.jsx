import { ImageResponse } from 'next/og'
import { getShare } from '@/lib/share'

export const runtime = 'edge'

export async function GET(request, { params }) {
  const { id } = params
  const share = await getShare(id)

  const isDebate = share?.type === 'debat'

  // Fallback image if share not found
  if (!share) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%', background: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 48, color: '#3b82f6' }}>Butterfly.gov</span>
        </div>
      ),
      { width: 1080, height: 1080 }
    )
  }

  const scoreColor = (s) => {
    if (s >= 70) return '#4ade80'
    if (s >= 40) return '#facc15'
    return '#f87171'
  }

  return new ImageResponse(
    isDebate ? (
      // ── DÉBAT layout ──
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0a0a0a', padding: 60, fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span style={{ fontSize: 28, color: '#3b82f6', fontWeight: 700 }}>🦋 Butterfly.gov</span>
          <span style={{ fontSize: 18, color: '#6b7280', marginLeft: 8 }}>Mode Débat</span>
        </div>

        {/* Laws */}
        <div style={{ display: 'flex', gap: 32, flex: 1 }}>
          {[
            { label: 'LOI A', title: share.loi_a_titre, scores: share.loi_a_scores, color: '#3b82f6' },
            { label: 'LOI B', title: share.loi_b_titre, scores: share.loi_b_scores, color: '#ef4444' },
          ].map(({ label, title, scores, color }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', flex: 1, background: '#111827', borderRadius: 20, padding: 36, border: `2px solid ${color}40` }}>
              <div style={{ fontSize: 16, color, fontWeight: 700, marginBottom: 12 }}>{label}</div>
              <div style={{ fontSize: 22, color: '#f9fafb', fontWeight: 600, marginBottom: 28, lineHeight: 1.3 }}>
                {title?.length > 80 ? title.slice(0, 80) + '…' : title}
              </div>
              {scores && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[['💰 Économie', scores.economy], ['❤️ Social', scores.social], ['🌿 Écologie', scores.ecology], ['⚙️ Faisabilité', scores.faisabilite]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 14, color: '#9ca3af', width: 130 }}>{k}</span>
                      <div style={{ flex: 1, background: '#1f2937', borderRadius: 6, height: 10 }}>
                        <div style={{ width: `${v}%`, height: '100%', background: scoreColor(v), borderRadius: 6 }} />
                      </div>
                      <span style={{ fontSize: 16, color: scoreColor(v), fontWeight: 700, width: 40, textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, fontSize: 16, color: '#4b5563' }}>butterflygov.com · Simulateur de lois par IA</div>
      </div>
    ) : (
      // ── ANALYSE layout ──
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', background: '#0a0a0a', padding: 60, fontFamily: 'sans-serif' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <span style={{ fontSize: 28, color: '#3b82f6', fontWeight: 700 }}>🦋 Butterfly.gov</span>
          <span style={{ fontSize: 18, color: '#6b7280' }}>Simulateur de lois</span>
        </div>

        {/* Law text */}
        <div style={{ background: '#111827', borderRadius: 20, padding: 40, marginBottom: 36 }}>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>PROPOSITION DE LOI</div>
          <div style={{ fontSize: 32, color: '#f9fafb', fontWeight: 700, lineHeight: 1.3 }}>
            "{share.proposition?.length > 120 ? share.proposition.slice(0, 120) + '…' : share.proposition}"
          </div>
        </div>

        {/* Scores grid */}
        {share.scores && (
          <div style={{ display: 'flex', gap: 24, marginBottom: 36 }}>
            {[['💰', 'Économie', share.scores.economy], ['❤️', 'Social', share.scores.social], ['🌿', 'Écologie', share.scores.ecology], ['⚙️', 'Faisabilité', share.scores.faisabilite]].map(([emoji, label, val]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, background: '#111827', borderRadius: 16, padding: '24px 16px' }}>
                <div style={{ fontSize: 28 }}>{emoji}</div>
                <div style={{ fontSize: 40, color: scoreColor(val), fontWeight: 800, marginTop: 8 }}>{val}</div>
                <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{label}</div>
              </div>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, background: '#1e3a5f', borderRadius: 16, padding: '24px 16px', border: '2px solid #3b82f6' }}>
              <div style={{ fontSize: 28 }}>⭐</div>
              <div style={{ fontSize: 40, color: '#60a5fa', fontWeight: 800, marginTop: 8 }}>{share.score_global}</div>
              <div style={{ fontSize: 14, color: '#93c5fd', marginTop: 4 }}>Global</div>
            </div>
          </div>
        )}

        {/* Gagnants / Perdants */}
        {(share.gagnants || share.perdants) && (
          <div style={{ display: 'flex', gap: 24, marginBottom: 32 }}>
            {share.gagnants && (
              <div style={{ flex: 1, background: '#052e16', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#4ade80', marginBottom: 6 }}>✅ GAGNANTS</div>
                <div style={{ fontSize: 18, color: '#bbf7d0' }}>{share.gagnants.length > 80 ? share.gagnants.slice(0, 80) + '…' : share.gagnants}</div>
              </div>
            )}
            {share.perdants && (
              <div style={{ flex: 1, background: '#450a0a', borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, color: '#f87171', marginBottom: 6 }}>❌ PERDANTS</div>
                <div style={{ fontSize: 18, color: '#fecaca' }}>{share.perdants.length > 80 ? share.perdants.slice(0, 80) + '…' : share.perdants}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ fontSize: 16, color: '#4b5563' }}>butterflygov.com · Analyse par IA Claude</div>
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
