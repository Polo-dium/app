// archive/debate/api/debate-handler.js
// ─────────────────────────────────────────────────────────
// Extrait de app/api/[[...path]]/route.js — archivé le 16/03/2026
// Fonctions du mode Débat "Loi A vs Loi B" (Premium only)
// ─────────────────────────────────────────────────────────

// Dispatch dans le POST handler (à réintégrer dans route.js) :
//   if (endpoint === 'debate') {
//     return handleDebate(request)
//   }

async function generateVerdict(law1, law2, analysis1, analysis2) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: MODEL_PREMIUM,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Tu es un analyste politique cynique et direct. Compare ces deux lois et explique en 3 phrases maximum pourquoi l'une est meilleure que l'autre selon les scores.

LOI A: "${law1}" → Éco:${analysis1.scores.economy} Social:${analysis1.scores.social} Écologie:${analysis1.scores.ecology} Faisabilité:${analysis1.scores.faisabilite} Global:${analysis1.scores.overall}
LOI B: "${law2}" → Éco:${analysis2.scores.economy} Social:${analysis2.scores.social} Écologie:${analysis2.scores.ecology} Faisabilité:${analysis2.scores.faisabilite} Global:${analysis2.scores.overall}

Réponds en français, de manière percutante et sans complaisance. Max 3 phrases.`
    }]
  })
  return response.content[0].text
}

async function handleDebate(request) {
  const user = await getUser(request)

  // In demo mode (no Supabase), allow debate for testing
  const supabase = createServiceClient()
  if (supabase && (!user || !user.profile?.is_premium)) {
    return NextResponse.json({
      error: 'premium_required',
      message: 'Le Mode Débat est réservé aux abonnés Premium. Abonnez-vous pour 2,99€/mois.'
    }, { status: 403, headers: corsHeaders })
  }

  const body = await request.json()
  const { law1, law2 } = body

  if (!law1 || !law2) {
    return NextResponse.json({ error: 'Les champs "law1" et "law2" sont requis' }, { status: 400, headers: corsHeaders })
  }

  const ipAddress = getClientIP(request)

  try {
    const [analysis1, analysis2] = await Promise.all([analyzeLaw(law1), analyzeLaw(law2)])
    const verdict = await generateVerdict(law1, law2, analysis1, analysis2)

    await Promise.all([
      saveLawToHistory(law1, analysis1, user?.id, ipAddress, true),
      saveLawToHistory(law2, analysis2, user?.id, ipAddress, true)
    ])

    return NextResponse.json({
      law1: { text: law1.trim(), analysis: analysis1 },
      law2: { text: law2.trim(), analysis: analysis2 },
      verdict
    }, { headers: corsHeaders })

  } catch (error) {
    console.error('Debate Error:', error)
    return NextResponse.json({ error: 'Erreur lors de l\'analyse: ' + error.message }, { status: 500, headers: corsHeaders })
  }
}
