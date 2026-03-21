export default function manifest() {
  return {
    name: 'Butterfly.gov',
    short_name: 'Butterfly',
    description: 'Analysez les propositions de loi avec l\'IA. Découvrez les gagnants, les perdants et les effets en chaîne.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    categories: ['education', 'politics', 'news'],
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
