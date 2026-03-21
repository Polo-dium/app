'use client'

import Link from 'next/link'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

const faqItems = [
  {
    q: "C'est quoi Butterfly.gov ?",
    a: "Un outil citoyen qui utilise l'intelligence artificielle pour analyser les propositions de loi. Vous soumettez un texte, l'IA évalue ses impacts (économie, social, écologie, faisabilité), identifie qui y gagne et qui y perd, et révèle les effets en chaîne que personne ne vous explique au JT."
  },
  {
    q: "À quoi ça sert concrètement ?",
    a: "Trois choses : comprendre une loi sans jargon juridique, tester vos arguments en débattant avec l'IA, et visualiser les implications grâce à une carte interactive qui montre les effets directs, les lois connexes et les conséquences de second ordre. C'est votre kit de fact-check législatif."
  },
  {
    q: "L'IA est-elle neutre ?",
    a: "L'IA n'a pas d'opinion politique. En mode analyse, elle attribue des scores factuels sur des critères objectifs. En mode explication, elle décrit ce que la loi fait sans jamais dire si c'est bien ou mal. Quand vous débattez avec elle, elle challenge vos arguments avec la même rigueur quel que soit le camp. Si un point fait débat, elle présente les positions de chaque partie prenante."
  },
  {
    q: "Je peux analyser des vraies lois ou seulement des idées ?",
    a: "Les deux. Vous pouvez soumettre une proposition fictive (« Et si on interdisait les jets privés ? ») ou demander l'explication d'une loi réelle en cours au Parlement. Le mode Explication utilise la recherche web pour aller chercher les sources officielles en temps réel."
  },
  {
    q: "C'est fiable ?",
    a: "L'IA s'appuie sur des données vérifiables et cite ses sources. Mais c'est un outil d'aide à la réflexion, pas un oracle. Les scores sont des indicateurs pour structurer votre pensée, pas des vérités absolues. On vous encourage toujours à croiser avec d'autres sources."
  },
  {
    q: "C'est quoi la carte des implications ?",
    a: "Une visualisation interactive qui montre les effets d'une loi en trois niveaux : les conséquences directes, les lois connexes qui sont impactées, et les effets domino de second ordre. Parce qu'une loi sur le logement peut toucher l'éducation, et une réforme fiscale peut changer vos vacances."
  },
  {
    q: "C'est gratuit ?",
    a: "Oui. Vous pouvez analyser jusqu'à 5 lois par jour avec un compte gratuit (2 sans compte). L'abonnement premium à 7€/mois donne un accès illimité et utilise un modèle d'IA plus puissant pour des analyses plus fines."
  },
  {
    q: "Mes données sont-elles protégées ?",
    a: "Vos analyses ne sont pas partagées publiquement sauf si vous choisissez de les partager vous-même. Nous n'exploitons pas vos données à des fins publicitaires. L'authentification passe par Supabase, un service sécurisé."
  },
  {
    q: "Qui est derrière Butterfly.gov ?",
    a: "Un projet indépendant, sans affiliation politique. L'objectif est simple : rendre la fabrique de la loi accessible à tous ceux qui votent — c'est-à-dire tout le monde."
  },
  {
    q: "Comment ça marche techniquement ?",
    a: "Butterfly.gov utilise l'IA Claude d'Anthropic, conçue pour être factuelle et nuancée. En mode explication, l'IA effectue des recherches web en temps réel pour sourcer chaque information. Les résultats ne sont jamais inventés — si l'IA ne sait pas, elle le dit."
  }
]

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
            &larr; Retour
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors">
            <span className="text-blue-400">Butterfly</span>.gov
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-2">Questions fréquentes</h1>
        <p className="text-muted-foreground mb-8">Tout ce que vous devez savoir sur Butterfly.gov</p>

        <Accordion type="single" collapsible className="space-y-2">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`q-${i}`} className="border border-white/10 rounded-lg px-4 bg-card/50">
              <AccordionTrigger className="text-base text-white hover:no-underline hover:text-blue-400 py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-white/70 leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground text-sm mb-4">
            Vous avez d&apos;autres questions ?{' '}
            <a
              href="mailto:contact@butterflygov.com"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Contactez-nous
            </a>
          </p>
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
            Essayer Butterfly.gov &rarr;
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link href="/cgu" className="hover:text-white transition-colors">CGU / CGV</Link>
          <Link href="/faq" className="text-white transition-colors">FAQ</Link>
        </div>
      </footer>
    </div>
  )
}
