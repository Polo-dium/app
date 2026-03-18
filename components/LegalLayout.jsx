import Link from 'next/link'

export default function LegalLayout({ title, children }) {
  return (
    <div className="min-h-screen bg-background text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
            ← Retour
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/" className="font-bold text-white hover:text-blue-400 transition-colors">
            <span className="text-blue-400">Butterfly</span>.gov
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>
        <div className="prose-legal">{children}</div>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 mt-12">
        <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="/mentions-legales" className="hover:text-white transition-colors">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-white transition-colors">Politique de confidentialité</Link>
          <Link href="/cgu" className="hover:text-white transition-colors">CGU / CGV</Link>
          <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>
      </footer>
    </div>
  )
}
