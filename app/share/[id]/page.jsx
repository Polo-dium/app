// app/share/[id]/page.jsx
// ─────────────────────────────────────────────────────────
// Page de partage — sert les meta OG pour les previews RS
// et présente un résumé de l'analyse avec CTA vers l'accueil
// ─────────────────────────────────────────────────────────

import { getShare } from '@/lib/share';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://butterflygov.com';

// ── Génère les metadata dynamiques pour les OG tags ─────
export async function generateMetadata({ params }) {
  const { id } = params;
  const share = await getShare(id);

  if (!share) {
    return {
      title: 'Analyse introuvable — Butterfly.gov',
      description: 'Cette analyse n\'existe pas ou a expiré.',
    };
  }

  const isDebate = share.type === 'debat';
  const title = isDebate
    ? `Débat : "${share.loi_a_titre?.slice(0, 50)}" vs "${share.loi_b_titre?.slice(0, 50)}"`
    : `${share.proposition?.slice(0, 70)}${share.proposition?.length > 70 ? '…' : ''}`;
  const description = isDebate
    ? `Comparaison de deux lois analysée par IA sur Butterfly.gov`
    : `Score ${share.score_global}/100 — Analyse d'impact sur Butterfly.gov`;
  const ogImageUrl = `${BASE_URL}/api/og/${id}`;

  return {
    title: `${title} | Butterfly.gov`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${BASE_URL}/share/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1080,
          height: 1080,
          alt: title,
        },
      ],
      siteName: 'Butterfly.gov',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// ── Page component ──────────────────────────────────────
export default async function SharePage({ params }) {
  const { id } = params;
  const share = await getShare(id);

  if (!share) {
    return (
      <main
        style={{
          minHeight: '100vh',
          background: '#0A0A12',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          fontFamily: 'system-ui, sans-serif',
          color: '#E8E6E1',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '14px', color: '#666', letterSpacing: '2px', marginBottom: '16px' }}>
          ✦ BUTTERFLY.GOV ✦
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, maxWidth: '600px', lineHeight: 1.4, marginBottom: '12px' }}>
          Analyse introuvable
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px' }}>
          Ce lien a peut-être expiré ou n'existe pas.
        </p>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '14px 32px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Tester ma propre loi →
        </a>
      </main>
    );
  }

  const isDebate = share.type === 'debat';

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0A0A12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif',
        color: '#E8E6E1',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '14px', color: '#666', letterSpacing: '2px', marginBottom: '16px' }}>
        ✦ BUTTERFLY.GOV ✦
      </p>

      {isDebate ? (
        <>
          <p style={{ fontSize: '13px', color: '#8B6BEF', letterSpacing: '2px', fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase' }}>
            Mode Débat
          </p>
          <div style={{ display: 'flex', gap: '16px', maxWidth: '700px', width: '100%', marginBottom: '32px' }}>
            <div style={{ flex: 1, padding: '20px', borderRadius: '16px', border: '1.5px solid rgba(91,141,239,0.3)', background: 'rgba(91,141,239,0.05)', textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#5B8DEF', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>LOI A</p>
              <p style={{ fontSize: '15px', color: '#E8E6E1', lineHeight: 1.4 }}>{share.loi_a_titre}</p>
            </div>
            <div style={{ flex: 1, padding: '20px', borderRadius: '16px', border: '1.5px solid rgba(239,91,141,0.3)', background: 'rgba(239,91,141,0.05)', textAlign: 'left' }}>
              <p style={{ fontSize: '12px', color: '#EF5B8D', fontWeight: 700, letterSpacing: '2px', marginBottom: '8px' }}>LOI B</p>
              <p style={{ fontSize: '15px', color: '#E8E6E1', lineHeight: 1.4 }}>{share.loi_b_titre}</p>
            </div>
          </div>
          {share.verdict && (
            <p style={{ fontSize: '15px', color: '#B0AEA6', fontStyle: 'italic', maxWidth: '600px', marginBottom: '32px', lineHeight: 1.5 }}>
              "{share.verdict}"
            </p>
          )}
        </>
      ) : (
        <>
          <h1 style={{ fontSize: '24px', fontWeight: 600, maxWidth: '600px', lineHeight: 1.4, marginBottom: '12px' }}>
            "{share.proposition}"
          </h1>
          <p style={{ fontSize: '18px', color: '#8B6BEF', marginBottom: '32px' }}>
            Score: {share.score_global}/100
          </p>
          {(share.gagnants || share.perdants) && (
            <div style={{ display: 'flex', gap: '16px', maxWidth: '700px', width: '100%', marginBottom: '32px' }}>
              {share.gagnants && (
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: '14px', border: '1.5px solid rgba(107,203,142,0.2)', background: 'rgba(107,203,142,0.05)', textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', color: '#6BCB8E', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>🏆 GAGNANTS</p>
                  <p style={{ fontSize: '14px', color: '#B0AEA6', lineHeight: 1.4 }}>{share.gagnants}</p>
                </div>
              )}
              {share.perdants && (
                <div style={{ flex: 1, padding: '16px 20px', borderRadius: '14px', border: '1.5px solid rgba(239,107,91,0.2)', background: 'rgba(239,107,91,0.05)', textAlign: 'left' }}>
                  <p style={{ fontSize: '12px', color: '#EF6B5B', fontWeight: 700, letterSpacing: '1px', marginBottom: '6px' }}>💥 PERDANTS</p>
                  <p style={{ fontSize: '14px', color: '#B0AEA6', lineHeight: 1.4 }}>{share.perdants}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CTA */}
      <a
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 32px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #8B6BEF 0%, #5B8DEF 100%)',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Tester ma propre loi →
      </a>

      {share.view_count > 1 && (
        <p style={{ fontSize: '13px', color: '#444', marginTop: '20px' }}>
          {share.view_count} personnes ont vu cette analyse
        </p>
      )}

      <p style={{ fontSize: '13px', color: '#444', marginTop: '12px' }}>
        Simulateur politique propulsé par IA
      </p>
    </main>
  );
}
