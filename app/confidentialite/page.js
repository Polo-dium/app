import LegalLayout from '@/components/LegalLayout'

export const metadata = {
  title: 'Politique de confidentialité — Butterfly.gov',
}

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : mars 2026</p>
      <p className="text-sm text-white/75 leading-relaxed mb-8">
        Butterflygov accorde une grande importance à la protection de vos données personnelles. Cette politique décrit les données que nous collectons, pourquoi nous les collectons et comment nous les utilisons, conformément au RGPD (Règlement UE 2016/679) et à la loi Informatique et Libertés.
      </p>

      <Section title="1. Responsable du traitement">
        <p><strong>Butterflygov</strong></p>
        <p>SIREN : [SIREN]</p>
        <p>Siège social : [ADRESSE_SIEGE]</p>
        <p>Contact DPO : <a href="mailto:privacy@butterflygov.com" className="text-blue-400 hover:text-blue-300">privacy@butterflygov.com</a></p>
      </Section>

      <Section title="2. Données collectées">
        <h3 className="text-base font-medium text-white mb-2">2.1 Données fournies par l'utilisateur</h3>
        <ul className="ml-5 space-y-1 list-disc text-white/75">
          <li><strong>Création de compte</strong> : adresse email (via Google OAuth ou magic link)</li>
          <li><strong>Abonnement Premium</strong> : les données de paiement sont traitées directement par Stripe et ne transitent pas par nos serveurs. Nous recevons uniquement un identifiant client Stripe, le statut de l'abonnement et la date d'expiration.</li>
          <li><strong>Utilisation du service</strong> : textes des lois soumises à l'analyse</li>
        </ul>
        <h3 className="text-base font-medium text-white mt-4 mb-2">2.2 Données collectées automatiquement</h3>
        <ul className="ml-5 space-y-1 list-disc text-white/75">
          <li><strong>Cookies essentiels</strong> : cookies d'authentification (Supabase Auth), cookies de session</li>
          <li><strong>Cookies analytiques</strong> (soumis à votre consentement) : données de navigation anonymisées</li>
          <li><strong>Données techniques</strong> : adresse IP (anonymisée), type de navigateur, système d'exploitation</li>
        </ul>
      </Section>

      <Section title="3. Finalités et bases légales">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 pr-4 text-white font-medium">Finalité</th>
                <th className="text-left py-2 pr-4 text-white font-medium">Base légale</th>
                <th className="text-left py-2 text-white font-medium">Durée de conservation</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {[
                ['Gestion de votre compte', 'Exécution du contrat', 'Durée du compte + 3 ans'],
                ['Traitement du paiement Premium', 'Exécution du contrat', 'Durée de l\'abonnement + 5 ans (obligation légale)'],
                ['Analyse de lois (IA)', 'Exécution du contrat', '12 mois dans l\'historique, puis anonymisation'],
                ['Rate limiting', 'Intérêt légitime (sécurité)', '24 heures'],
                ['Statistiques de fréquentation', 'Consentement', '13 mois maximum'],
                ['Amélioration du service', 'Intérêt légitime', 'Données anonymisées uniquement'],
              ].map(([f, b, d], i) => (
                <tr key={i} className="border-b border-white/10">
                  <td className="py-2 pr-4">{f}</td>
                  <td className="py-2 pr-4">{b}</td>
                  <td className="py-2">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="4. Partage des données">
        <p className="mb-3">Vos données personnelles peuvent être partagées avec les sous-traitants suivants, tous conformes au RGPD :</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-2 pr-4 text-white font-medium">Sous-traitant</th>
                <th className="text-left py-2 pr-4 text-white font-medium">Rôle</th>
                <th className="text-left py-2 pr-4 text-white font-medium">Localisation</th>
                <th className="text-left py-2 text-white font-medium">Garanties</th>
              </tr>
            </thead>
            <tbody className="text-white/70">
              {[
                ['Supabase', 'Authentification et base de données', 'UE (Francfort)', 'DPA signé, SOC 2 Type II'],
                ['Vercel', 'Hébergement', 'États-Unis', 'Clauses contractuelles types (SCCs)'],
                ['Stripe', 'Paiement', 'États-Unis', 'Certifié PCI-DSS, SCCs'],
                ['Anthropic', 'Analyse IA', 'États-Unis', 'SCCs, données non conservées pour l\'entraînement'],
              ].map(([s, r, l, g], i) => (
                <tr key={i} className="border-b border-white/10">
                  <td className="py-2 pr-4 font-medium text-white/90">{s}</td>
                  <td className="py-2 pr-4">{r}</td>
                  <td className="py-2 pr-4">{l}</td>
                  <td className="py-2">{g}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3">Nous ne vendons jamais vos données personnelles à des tiers.</p>
      </Section>

      <Section title="5. Transferts hors UE">
        <p>Certains de nos sous-traitants sont situés aux États-Unis. Ces transferts sont encadrés par les Clauses Contractuelles Types (SCCs) approuvées par la Commission Européenne, conformément à l'article 46 du RGPD.</p>
      </Section>

      <Section title="6. Cookies" id="cookies">
        <h3 className="text-base font-medium text-white mb-2">6.1 Cookies essentiels (pas de consentement requis)</h3>
        <ul className="ml-5 space-y-1 list-disc text-white/75 mb-4">
          <li><strong>Authentification Supabase</strong> : maintien de votre session connectée</li>
          <li><strong>Préférence cookies</strong> : mémorisation de votre choix concernant les cookies</li>
        </ul>
        <h3 className="text-base font-medium text-white mb-2">6.2 Cookies analytiques (soumis à consentement)</h3>
        <ul className="ml-5 space-y-1 list-disc text-white/75">
          <li><strong>Analytics</strong> : mesure d'audience anonymisée (activés uniquement après votre accord explicite)</li>
        </ul>
        <p className="mt-3">Vous pouvez modifier vos préférences à tout moment via le lien « Gérer les cookies » dans le pied de page du site.</p>
        <p className="mt-2">Pour plus d'informations : <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">cnil.fr — Cookies et autres traceurs</a></p>
      </Section>

      <Section title="7. Vos droits">
        <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="ml-5 space-y-1.5 list-disc text-white/75">
          <li><strong>Droit d'accès</strong> : obtenir une copie de vos données personnelles</li>
          <li><strong>Droit de rectification</strong> : corriger des données inexactes</li>
          <li><strong>Droit à l'effacement</strong> : demander la suppression de vos données</li>
          <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
          <li><strong>Droit de limitation</strong> : demander la limitation du traitement</li>
          <li><strong>Droit de retrait du consentement</strong> : retirer votre consentement à tout moment pour les cookies analytiques</li>
        </ul>
        <p className="mt-3">Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@butterflygov.com" className="text-blue-400 hover:text-blue-300">privacy@butterflygov.com</a></p>
        <p className="mt-2">Nous répondrons dans un délai de 30 jours. En cas de non-réponse, vous pouvez adresser une réclamation à la <a href="https://www.cnil.fr/fr/plaintes" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">CNIL</a>.</p>
      </Section>

      <Section title="8. Sécurité">
        <ul className="ml-5 space-y-1 list-disc text-white/75">
          <li>Chiffrement des données en transit (HTTPS/TLS)</li>
          <li>Chiffrement des données au repos (Supabase)</li>
          <li>Authentification sécurisée (OAuth 2.0, magic links à usage unique)</li>
          <li>Aucun stockage de données bancaires sur nos serveurs</li>
          <li>Accès restreint aux données personnelles</li>
        </ul>
      </Section>

      <Section title="9. Mineurs">
        <p>Le service butterflygov.com n'est pas destiné aux mineurs de moins de 16 ans. Si nous apprenons que des données personnelles d'un mineur de moins de 16 ans ont été collectées sans le consentement d'un parent, nous les supprimerons.</p>
      </Section>

      <Section title="10. Modifications">
        <p>Nous nous réservons le droit de modifier cette politique. En cas de modification substantielle, nous vous en informerons par email ou par notification sur le site.</p>
      </Section>

      <Section title="11. Contact">
        <p><strong>Email</strong> : <a href="mailto:privacy@butterflygov.com" className="text-blue-400 hover:text-blue-300">privacy@butterflygov.com</a></p>
        <p><strong>Courrier</strong> : Butterflygov — [ADRESSE_SIEGE]</p>
      </Section>
    </LegalLayout>
  )
}

function Section({ title, id, children }) {
  return (
    <section className="mb-8" id={id}>
      <h2 className="text-xl font-semibold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="text-white/75 leading-relaxed space-y-2 text-sm">{children}</div>
    </section>
  )
}
