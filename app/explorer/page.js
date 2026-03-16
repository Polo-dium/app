// app/explorer/page.js
// ─────────────────────────────────────────────────────────
// Page Explorateur — carte radiale d'implications législatives
// ─────────────────────────────────────────────────────────

import LawExplorer from '@/components/LawExplorer';

export const metadata = {
  title: 'Explorateur législatif | Butterfly.gov',
  description: 'Visualisez les implications et connexions entre les lois en un coup d\'œil.',
};

export default function ExplorerPage() {
  return <LawExplorer />;
}
