import Link from 'next/link'
import { getShare } from '@/lib/share'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://butterflygov.com'

export async function generateMetadata({ params }) {
  const share = await getShare(params.id)
  if (!share) {
    return {
      title: 'Analyse introuvable — Butterfly.gov',
      description: 'Cette analyse n\'existe pas ou a expiré.',
    }
  }

  const isDebate = share.type === 'debat'
  const title = isDebate
    ? `Débat : "${share.loi_a_titre?.slice(0, 50)}" vs "${share.loi_b_titre?.slice(0, 50)}" — Butterfly.gov`
    : `"${share.proposition?.slice(0, 80)}" — Score ${share.score_global}/100 | Butterfly.gov`

  const description = isDebate
    ? `Comparaison de deux lois analysée par IA sur Butterfly.gov`
    : `Gagnants : ${share.gagnants} • Perdants : ${share.perdants}`

  const ogImage = `${APP_URL}/api/og/${params.id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage, width: 1080, height: 1080 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function SharePage({ params }) {
  const share = await getShare(params.id)
  const isDebate = share?.type === 'debat'

  if (!share) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <p className="text-6xl mb-4">🦋</p>
        <h1 className="text-2xl font-bold text-white mb-2">Analyse introuvable</h1>
        <p className="text-muted-foreground mb-6">Ce lien a peut-être expiré ou n'existe pas.</p>
        <Link href="/" className="px-6 py-3 rounded-full bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors">
          Tester ma propre loi →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors">
          <span className="text-xl">🦋</span>
          <span className="font-bold">Butterfly.gov</span>
        </Link>

        <div className="bg-card rounded-2xl border border-white/10 p-6 text-left space-y-4">
          {isDebate ? (
            <>
              <p className="text-xs text-purple-400 font-semibold uppercase tracking-widest">Mode Débat</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-400 font-medium mb-1">LOI A</p>
                  <p className="text-sm text-white">{share.loi_a_titre}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400 font-medium mb-1">LOI B</p>
                  <p className="text-sm text-white">{share.loi_b_titre}</p>
                </div>
              </div>
              {share.verdict && (
                <p className="text-sm text-white/70 italic border-t border-white/10 pt-3">{share.verdict}</p>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-widest">Proposition de loi</p>
              <p className="text-lg font-semibold text-white">"{share.proposition}"</p>
              {share.scores && (
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[['💰', share.scores.economy], ['❤️', share.scores.social], ['🌿', share.scores.ecology], ['⭐', share.score_global]].map(([e, v], i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-white/5">
                      <div>{e}</div>
                      <div className="text-lg font-bold text-white">{v}</div>
                    </div>
                  ))}
                </div>
              )}
              {share.gagnants && <p className="text-xs text-green-400">✅ {share.gagnants}</p>}
              {share.perdants && <p className="text-xs text-red-400">❌ {share.perdants}</p>}
            </>
          )}
        </div>

        <Link
          href="/"
          className="inline-block w-full px-6 py-4 rounded-full bg-gradient-to-r from-blue-600 to-red-500 text-white font-semibold text-base hover:opacity-90 transition-opacity"
        >
          Tester ma propre loi →
        </Link>

        <p className="text-xs text-muted-foreground">
          {share.view_count > 1 && `${share.view_count} personnes ont vu cette analyse · `}
          Analyse simulée par IA Claude — à but éducatif
        </p>
      </div>
    </div>
  )
}
