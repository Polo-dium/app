import LegalLayout from '@/components/LegalLayout'

export const metadata = {
  title: 'Mentions légales — Butterfly.gov',
}

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales">
      <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : mars 2026</p>

      <Section title="Éditeur du site">
        <p><strong>Butterflygov</strong></p>
        <p>Forme juridique : Micro-entreprise (Entreprise individuelle)</p>
        <p>RCS : 898 098 389 — Villefranche-Tarare</p>
        <p>Date d'immatriculation : 17 mars 2026</p>
        <p>Siège social : 119 Rue de la Mairie, 69870 Grandris, France</p>
        <p>Directeur de la publication : Paul Boutarin</p>
        <p>Activité : Site web avec service IA</p>
        <p>Contact : <a href="mailto:contact@butterflygov.com" className="text-blue-400 hover:text-blue-300">contact@butterflygov.com</a></p>
      </Section>

      <Section title="Hébergement">
        <p><strong>Vercel Inc.</strong><br />440 N Barranca Ave #4133<br />Covina, CA 91723, États-Unis<br /><a href="https://vercel.com" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">vercel.com</a></p>
        <p className="mt-4"><strong>Supabase Inc.</strong> (base de données et authentification)<br />970 Toa Payoh North #07-04, Singapore 318992<br /><a href="https://supabase.com" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">supabase.com</a></p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L'ensemble du contenu du site butterflygov.com (textes, graphismes, logo, icônes, logiciels, structure) est la propriété exclusive de Butterflygov ou de ses partenaires et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
        <p className="mt-3">Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site est interdite sans autorisation écrite préalable de Butterflygov.</p>
      </Section>

      <Section title="Analyses générées par intelligence artificielle">
        <p>Les analyses de lois proposées sur butterflygov.com sont générées par intelligence artificielle (modèles Anthropic Claude). Elles sont fournies <strong>à titre informatif uniquement</strong> et ne constituent en aucun cas :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc text-white/80">
          <li>un avis juridique,</li>
          <li>une recommandation politique,</li>
          <li>une analyse exhaustive ou définitive d'un texte de loi.</li>
        </ul>
        <p className="mt-3">Butterflygov ne garantit pas l'exactitude, l'exhaustivité ou l'actualité des analyses produites. L'utilisateur est invité à consulter les textes de loi originaux et, le cas échéant, un professionnel du droit.</p>
      </Section>

      <Section title="Responsabilité">
        <p>Butterflygov s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le site. Toutefois, Butterflygov ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations disponibles.</p>
        <p className="mt-3">Butterflygov décline toute responsabilité :</p>
        <ul className="mt-2 ml-5 space-y-1 list-disc text-white/80">
          <li>pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur le site,</li>
          <li>pour tous dommages résultant d'une intrusion frauduleuse d'un tiers,</li>
          <li>et plus généralement pour tout dommage direct ou indirect résultant de l'utilisation du site.</li>
        </ul>
      </Section>

      <Section title="Liens hypertextes">
        <p>Le site peut contenir des liens vers d'autres sites internet. Butterflygov n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.</p>
      </Section>

      <Section title="Droit applicable">
        <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
      </Section>
    </LegalLayout>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-white mb-3 pb-2 border-b border-white/10">{title}</h2>
      <div className="text-white/75 leading-relaxed space-y-2 text-sm">{children}</div>
    </section>
  )
}
