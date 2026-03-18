'use client'

import Link from 'next/link'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

const faqItems = [
  {
    q: "C'est quoi Butterfly.gov ?",
    a: "Un outil citoyen qui utilise l'intelligence artificielle pour analyser les propositions de loi. Vous soumettez un texte, l'IA \u00e9value ses impacts (\u00e9conomie, social, \u00e9cologie, faisabilit\u00e9), identifie qui y gagne et qui y perd, et r\u00e9v\u00e8le les effets en cha\u00eene que personne ne vous explique au JT."
  },
  {
    q: "\u00c0 quoi \u00e7a sert concr\u00e8tement ?",
    a: "Trois choses : comprendre une loi sans jargon juridique, tester vos arguments en d\u00e9battant avec l'IA, et visualiser les implications gr\u00e2ce \u00e0 une carte interactive qui montre les effets directs, les lois connexes et les cons\u00e9quences de second ordre. C'est votre kit de fact-check l\u00e9gislatif."
  },
  {
    q: "L'IA est-elle neutre ?",
    a: "L'IA n'a pas d'opinion politique. En mode analyse, elle attribue des scores factuels sur des crit\u00e8res objectifs. En mode explication, elle d\u00e9crit ce que la loi fait sans jamais dire si c'est bien ou mal. Quand vous d\u00e9battez avec elle, elle challenge vos arguments avec la m\u00eame rigueur quel que soit le camp. Si un point fait d\u00e9bat, elle pr\u00e9sente les positions de chaque partie prenante."
  },
  {
    q: "Je peux analyser des vraies lois ou seulement des id\u00e9es ?",
    a: "Les deux. Vous pouvez soumettre une proposition fictive (\u00ab Et si on interdisait les jets priv\u00e9s ? \u00bb) ou demander l'explication d'une loi r\u00e9elle en cours au Parlement. Le mode Explication utilise la recherche web pour aller chercher les sources officielles en temps r\u00e9el."
  },
  {
    q: "C'est fiable ?",
    a: "L'IA s'appuie sur des donn\u00e9es v\u00e9rifiables et cite ses sources. Mais c'est un outil d'aide \u00e0 la r\u00e9flexion, pas un oracle. Les scores sont des indicateurs pour structurer votre pens\u00e9e, pas des v\u00e9rit\u00e9s absolues. On vous encourage toujours \u00e0 croiser avec d'autres sources."
  },
  {
    q: "C'est quoi la carte des implications ?",
    a: "Une visualisation interactive qui montre les effets d'une loi en trois niveaux : les cons\u00e9quences directes, les lois connexes qui sont impact\u00e9es, et les effets domino de second ordre. Parce qu'une loi sur le logement peut toucher l'\u00e9ducation, et une r\u00e9forme fiscale peut changer vos vacances."
  },
  {
    q: "C'est gratuit ?",
    a: "Oui. Vous pouvez analyser jusqu'\u00e0 5 lois par jour avec un compte gratuit (2 sans compte). L'abonnement premium \u00e0 7\u20ac/mois donne un acc\u00e8s illimit\u00e9 et utilise un mod\u00e8le d'IA plus puissant pour des analyses plus fines."
  },
  {
    q: "Mes donn\u00e9es sont-elles prot\u00e9g\u00e9es ?",
    a: "Vos analyses ne sont pas partag\u00e9es publiquement sauf si vous choisissez de les partager vous-m\u00eame. Nous n'exploitons pas vos donn\u00e9es \u00e0 des fins publicitaires. L'authentification passe par Supabase, un service s\u00e9curis\u00e9."
  },
  {
    q: "Qui est derri\u00e8re Butterfly.gov ?",
    a: "Un projet ind\u00e9pendant, sans affiliation politique. L'objectif est simple : rendre la fabrique de la loi accessible \u00e0 tous ceux qui votent \u2014 c'est-\u00e0-dire tout le monde."
  },
  {
    q: "Comment \u00e7a marche techniquement ?",
    a: "Butterfly.gov utilise l'IA Claude d'Anthropic, con\u00e7ue pour \u00eatre factuelle et nuanc\u00e9e. En mode explication, l'IA effectue des recherches web en temps r\u00e9el pour sourcer chaque information. Les r\u00e9sultats ne sont jamais invent\u00e9s \u2014 si l'IA ne sait pas, elle le dit."
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
        <h1 className="text-3xl font-bold text-white mb-2">Questions fr\u00e9quentes</h1>
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
          <p className="text-muted-foreground text-sm mb-4">Vous avez d'autres questions ?</p>
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium">
            Essayer Butterfly.gov &rarr;
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions l\u00e9gales</Link>
          <Link href="/confidentialite" className="hover:text-white transition-colors">Confidentialit\u00e9</Link>
          <Link href="/cgu" className="hover:text-white transition-colors">CGU / CGV</Link>
          <Link href="/faq" className="text-white transition-colors">FAQ</Link>
        </div>
      </footer>
    </div>
  )
}
