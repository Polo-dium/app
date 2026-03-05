import './globals.css'

export const metadata = {
  title: 'Butterfly.gov - Simulateur de Lois',
  description: 'Proposez une loi et découvrez ses conséquences avec l\'IA',
  openGraph: {
    title: 'Butterfly.gov - Simulateur de Lois',
    description: 'Si vous étiez Président, quelle loi passeriez-vous ?',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
