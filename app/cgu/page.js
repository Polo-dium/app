import LegalLayout from '@/components/LegalLayout'

export const metadata = {
  title: 'CGU / CGV — Butterfly.gov',
}

export default function CGU() {
  return (
    <LegalLayout title="Conditions Générales d'Utilisation et de Vente">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : mars 2026</p>

      <h2 className="text-2xl font-bold text-white mb-6">Partie 1 — Conditions Générales d'Utilisation (CGU)</h2>

      <Section title="Article 1 — Objet">
        <p>Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation du site butterflygov.com (ci-après « le Service »), édité par Butterflygov, SIREN [SIREN], dont le siège social est situé au [ADRESSE_SIEGE] (ci-après « l'Éditeur »).</p>
        <p className="mt-2">Toute utilisation du Service implique l'acceptation pleine et entière des présentes CGU.</p>
      </Section>

      <Section title="Article 2 — Description du Service">
        <p>Butterflygov est une plateforme d'analyse de propositions de loi par intelligence artificielle. Le Service permet aux utilisateurs de :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc">
          <li>soumettre des textes de loi ou propositions à l'analyse IA,</li>
          <li>consulter des scores d'impact (économique, social, écologique),</li>
          <li>comparer deux propositions de loi en mode Débat,</li>
          <li>débattre avec une IA « Opposant Féroce » sur les résultats d'analyse,</li>
          <li>consulter un historique de leurs analyses,</li>
          <li>accéder à un classement communautaire (leaderboard).</li>
        </ul>
      </Section>

      <Section title="Article 3 — Accès au Service">
        <p>Le Service est accessible gratuitement avec des fonctionnalités limitées. Certaines fonctionnalités avancées nécessitent un abonnement Premium (voir Partie 2 — CGV).</p>
        <div className="mt-3 grid sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="font-medium text-white mb-2">Offre gratuite</p>
            <ul className="space-y-1 list-disc ml-4">
              <li>5 analyses par heure (utilisateur anonyme)</li>
              <li>10 analyses par heure (utilisateur inscrit)</li>
              <li>Analyse de loi unique</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="font-medium text-white mb-2">Offre Premium</p>
            <ul className="space-y-1 list-disc ml-4">
              <li>Analyses illimitées</li>
              <li>Mode Débat (comparaison de 2 lois)</li>
              <li>Verdict narratif détaillé</li>
              <li>Débat interactif avec l'IA</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Article 4 — Inscription">
        <p>L'inscription est possible via :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc">
          <li>Google OAuth (connexion avec un compte Google)</li>
          <li>Magic link (lien de connexion envoyé par email)</li>
        </ul>
        <p className="mt-2">L'utilisateur s'engage à fournir des informations exactes et à ne pas créer plusieurs comptes.</p>
      </Section>

      <Section title="Article 5 — Responsabilité de l'utilisateur">
        <p>L'utilisateur s'engage à :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc">
          <li>utiliser le Service conformément à sa destination,</li>
          <li>ne pas soumettre de contenu illicite, haineux, diffamatoire ou portant atteinte aux droits des tiers,</li>
          <li>ne pas tenter de contourner les limitations d'usage (rate limiting),</li>
          <li>ne pas utiliser le Service de manière automatisée (scraping, bots) sans autorisation.</li>
        </ul>
      </Section>

      <Section title="Article 6 — Nature des analyses IA">
        <p className="font-medium text-white">Les analyses fournies par le Service sont générées par intelligence artificielle et sont communiquées à titre strictement informatif.</p>
        <p className="mt-2">L'utilisateur reconnaît que :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc">
          <li>les analyses ne constituent pas un avis juridique, politique ou professionnel,</li>
          <li>l'IA peut commettre des erreurs, des approximations ou des omissions,</li>
          <li>les scores d'impact sont des estimations subjectives et ne prétendent pas à l'objectivité scientifique,</li>
          <li>les résultats peuvent varier pour un même texte soumis à différents moments,</li>
          <li>les analyses du mode Débat et les arguments de « L'Opposant Féroce » sont des exercices rhétoriques et ne reflètent pas une position éditoriale.</li>
        </ul>
        <p className="mt-2">Butterflygov ne saurait être tenu responsable des décisions prises sur la base des analyses fournies.</p>
      </Section>

      <Section title="Article 7 — Propriété intellectuelle">
        <p>Le code source, le design, les textes, le logo et l'ensemble des éléments composant le Service sont la propriété exclusive de Butterflygov.</p>
        <p className="mt-2">Les analyses générées par l'IA à partir des textes soumis par l'utilisateur n'appartiennent pas à Butterflygov. L'utilisateur est libre de les utiliser, partager et reproduire.</p>
      </Section>

      <Section title="Article 8 — Données personnelles">
        <p>Le traitement des données personnelles est décrit dans notre <a href="/confidentialite" className="text-blue-400 hover:text-blue-300">Politique de Confidentialité</a>.</p>
      </Section>

      <Section title="Article 9 — Disponibilité du Service">
        <p>Butterflygov s'efforce d'assurer une disponibilité continue du Service, sans garantie de disponibilité permanente. Le Service peut être interrompu pour maintenance, mise à jour ou en cas de force majeure.</p>
        <p className="mt-2">Butterflygov ne saurait être tenu responsable des interruptions de service liées à ses sous-traitants (Vercel, Supabase, Anthropic, Stripe).</p>
      </Section>

      <Section title="Article 10 — Modification des CGU">
        <p>Butterflygov se réserve le droit de modifier les présentes CGU. Les modifications prennent effet dès leur publication sur le site. L'utilisation du Service après modification vaut acceptation des nouvelles CGU.</p>
        <p className="mt-2">En cas de modification substantielle, l'utilisateur inscrit sera informé par email.</p>
      </Section>

      <Section title="Article 11 — Résiliation">
        <p>L'utilisateur peut supprimer son compte à tout moment en contactant <a href="mailto:privacy@butterflygov.com" className="text-blue-400 hover:text-blue-300">privacy@butterflygov.com</a>. La suppression entraîne l'effacement des données personnelles dans un délai de 30 jours.</p>
        <p className="mt-2">Butterflygov peut suspendre ou supprimer un compte en cas de violation des présentes CGU.</p>
      </Section>

      <Section title="Article 12 — Droit applicable et litiges">
        <p>Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux de [VILLE_TRIBUNAL] seront seuls compétents.</p>
        <p className="mt-2">Conformément aux dispositions du Code de la consommation, l'utilisateur peut recourir à un médiateur de la consommation. Le médiateur compétent est : [NOM_MEDIATEUR — à compléter, ex : Médiation de la consommation — www.mediation-conso.fr]</p>
      </Section>

      <div className="my-10 border-t border-white/10" />

      <h2 className="text-2xl font-bold text-white mb-6">Partie 2 — Conditions Générales de Vente (CGV)</h2>
      <p className="text-sm text-white/70 mb-8">Les présentes CGV s'appliquent à tout abonnement Premium souscrit sur butterflygov.com.</p>

      <Section title="Article 13 — Offre Premium">
        <p>L'abonnement Premium donne accès aux fonctionnalités décrites à l'Article 3 au tarif suivant :</p>
        <p className="mt-2 font-medium text-white">Abonnement mensuel : 2,99 € TTC par mois</p>
        <p className="mt-2">Le prix est indiqué en euros, toutes taxes comprises (TVA française applicable).</p>
        <p className="mt-2">Butterflygov se réserve le droit de modifier ses tarifs. Toute modification sera communiquée à l'utilisateur avec un préavis de 30 jours.</p>
      </Section>

      <Section title="Article 14 — Souscription et paiement">
        <p>La souscription à l'offre Premium nécessite un compte utilisateur actif et un moyen de paiement valide (carte bancaire).</p>
        <p className="mt-2">Le paiement est traité par <strong>Stripe</strong>, prestataire certifié PCI-DSS. Butterflygov n'a jamais accès aux données bancaires complètes de l'utilisateur.</p>
        <p className="mt-2">L'abonnement est à tacite reconduction mensuelle. Le prélèvement intervient automatiquement chaque mois à la date anniversaire de la souscription.</p>
      </Section>

      <Section title="Article 15 — Droit de rétractation">
        <p>Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l'exécution a commencé avec l'accord du consommateur.</p>
        <p className="mt-2">Toutefois, Butterflygov accorde une <strong>garantie satisfait ou remboursé de 14 jours</strong> à compter de la première souscription. Pour en bénéficier, contactez <a href="mailto:contact@butterflygov.com" className="text-blue-400 hover:text-blue-300">contact@butterflygov.com</a>.</p>
      </Section>

      <Section title="Article 16 — Résiliation de l'abonnement">
        <p>L'utilisateur peut résilier son abonnement Premium à tout moment :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc">
          <li>depuis les paramètres de son compte, ou</li>
          <li>en contactant <a href="mailto:contact@butterflygov.com" className="text-blue-400 hover:text-blue-300">contact@butterflygov.com</a>.</li>
        </ul>
        <p className="mt-2">La résiliation prend effet à la fin de la période de facturation en cours. L'accès Premium est maintenu jusqu'à cette date. Aucun remboursement prorata n'est effectué.</p>
      </Section>

      <Section title="Article 17 — Facturation">
        <p>Une facture est émise pour chaque paiement et envoyée par email à l'adresse associée au compte. Les factures sont également disponibles dans le tableau de bord Stripe de l'utilisateur.</p>
      </Section>

      <Section title="Article 18 — Responsabilité">
        <p>Butterflygov s'engage à fournir le Service Premium tel que décrit. En cas d'indisponibilité prolongée (plus de 72h consécutives) du Service pour une raison imputable à Butterflygov, l'utilisateur pourra demander un remboursement au prorata de la période d'indisponibilité.</p>
        <p className="mt-2">La responsabilité de Butterflygov est limitée au montant des sommes versées par l'utilisateur au cours des 12 derniers mois.</p>
      </Section>

      <Section title="Article 19 — Service client">
        <p><strong>Email</strong> : <a href="mailto:contact@butterflygov.com" className="text-blue-400 hover:text-blue-300">contact@butterflygov.com</a></p>
        <p><strong>Délai de réponse</strong> : 48h ouvrées maximum</p>
      </Section>
    </LegalLayout>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="text-white/75 leading-relaxed space-y-2 text-sm">{children}</div>
    </section>
  )
}
