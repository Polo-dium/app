# STATUS — Butterfly.gov

## Dernière mise à jour : 2026-03-21

---

## ✅ Chantier 1 — Page d'accueil "Textes du moment" + Veille législative

- [x] Table `textes_actuels` — migration SQL : `migrations/2026-03-21-textes-actuels.sql`
- [x] `lib/legislative-utils.js` — constantes STATUT_LABELS, CATEGORIE_COLORS, CATEGORIES_LIST
- [x] `app/api/veille/route.js` — GET (liste) + POST admin (refresh depuis AN)
- [x] `app/api/veille/pregenerate/route.js` — POST admin (pré-génération explications)
- [x] `components/TextesActuels.jsx` — section hub éditorial avec filtres catégories
- [x] `app/page.js` — section TextesActuels intégrée dans la page d'accueil
- [x] Sous-titre hero mis à jour : "Comprendre les lois qui changent ta vie"

**À faire manuellement :**
- Exécuter la migration SQL dans Supabase
- Configurer `ADMIN_SECRET_KEY` dans les variables d'env Vercel
- Alimenter les premiers textes dans `textes_actuels` (via SQL ou via l'API admin)
- Configurer un cron Vercel ou GitHub Actions pour appeler POST /api/veille (refresh) quotidiennement

---

## ✅ Chantier 2 — Profil citoyen + Personnalisation

- [x] Table `profiles` — migration SQL : `migrations/2026-03-21-profil-citoyen.sql`
- [x] `components/ProfilCitoyen.jsx` — modal onboarding 3 étapes (situation, secteur, intérêts)
- [x] `app/api/profile/route.js` — GET + PUT pour le profil citoyen
- [x] Injection du profil dans le prompt Explication (`lib/prompts/explication.js`)
- [x] Injection du profil dans le prompt Analyse (`app/api/[[...path]]/route.js`)
- [x] Injection du profil dans la route Explication (`app/api/explain/route.js`)
- [x] Bandeau "Mon profil" dans la page si `profil_complete === false`
- [x] Lien "Mon profil citoyen" dans le menu utilisateur
- [x] CTA profil dans les résultats d'analyse et d'explication

**À faire manuellement :**
- Exécuter la migration SQL dans Supabase
- Section "Ce que ça change pour toi" dans les résultats : visible quand le profil + système prompt génèrent bien cette section

---

## ✅ Chantier 3 — Notifications Push PWA

- [x] `public/sw.js` — service worker (push + notificationclick)
- [x] Table `push_subscriptions` — migration SQL : `migrations/2026-03-21-push-subscriptions.sql`
- [x] `app/api/notifications/subscribe/route.js` — POST (abonnement utilisateur)
- [x] `app/api/notifications/send/route.js` — POST admin (envoi push ciblé par catégorie)
- [x] `components/NotificationBanner.jsx` — bannière d'activation en bas de page
- [x] Déclenchement automatique des notifications depuis `/api/veille` (POST refresh)

**À faire manuellement :**
- Installer `web-push` : `npm install web-push`
- Générer les clés VAPID : `npx web-push generate-vapid-keys`
- Configurer `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dans Vercel
- Exécuter la migration SQL dans Supabase
- Générer et placer les icônes `/public/icons/icon-192.png` et `/public/icons/icon-512.png` (actuellement utilise logo-192.png)

---

## ✅ Chantier 4 — Refonte positionnement / Messaging

- [x] Titre `<title>` et meta description mis à jour dans `app/layout.js`
- [x] Hero subtitle : "Comprendre les lois qui changent ta vie"
- [x] Bannière onboarding : nouveau texte d'accroche
- [x] ResultCard : encadré "🦋 L'Effet Papillon" redesigné (gradient violet/bleu, icône butterfly)
- [x] Mode Explication : section "L'Effet Papillon" mise en évidence dans les résultats
- [x] Section `### 8. L'Effet Papillon` ajoutée au system prompt Explication
- [x] Footer : "Butterfly.gov — L'info législative claire pour tous" + "Fait avec 🦋 en France"
- [x] CTA "Analyser cette loi" → "Comprendre cette loi" dans le modal de prévisualisation

---

## Prochains chantiers

### Chantier 5 — Système de Parrainage

- [ ] Chaque utilisateur reçoit un lien de parrainage unique (`/invite/[code]`)
- [ ] Quand un filleul s'inscrit via ce lien et effectue une première action qualifiante (ex: première analyse), **les deux parties** obtiennent un avantage :
  - Utilisateurs gratuits : +30 analyses supplémentaires (ou 7 jours premium offerts)
  - Utilisateurs premium : prolongation de l'abonnement de 7 jours
- [ ] Table Supabase `referrals` : `referrer_id`, `referee_id`, `code`, `status`, `rewarded_at`
- [ ] Migration SQL : `migrations/YYYY-MM-DD-referrals.sql`
- [ ] API `app/api/referral/route.js` — génération du code + validation + attribution récompense
- [ ] Page `/account` : affiche le lien de parrainage, nb de filleuls parrainés, récompenses obtenues
- [ ] Email automatique quand la récompense est créditée (via Resend ou Supabase Edge Function)
- [ ] Tracking anti-abus : un lien ne peut pas être utilisé par le même compte, pas d'auto-parrainage

**À faire manuellement :**
- Créer et exécuter la migration SQL dans Supabase
- Configurer l'expéditeur email pour les notifications de récompense

---

## Fonctionnalités existantes conservées

- ✅ Mode Analyse (lois fictives avec scores)
- ✅ Mode Débat (L'Opposant Féroce)
- ✅ Mode Explication (vraies lois avec web search)
- ✅ Mode Explorer (constellation)
- ✅ Auth Supabase (Google OAuth + Magic Link)
- ✅ Stripe Premium
- ✅ Rate limiting
- ✅ Historique, votes, leaderboard
- ✅ Partage (lien + OG image)
- ✅ PDF export
- ✅ Manifeste PWA (déjà en place)
