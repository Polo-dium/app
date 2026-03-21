import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Generates /apple-icon.png — iOS home screen icon (180x180)
// Uses the exact ButterflyIcon SVG paths from app/page.js
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
        }}
      >
        <svg
          width="136"
          height="136"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 12V3" />
          <path d="M5.5 7c-.8-1.3-2.1-2-3.5-2 2.4 0 4.5 2 4.5 4.5 0 3-2.5 5.5-5.5 5.5 2.2 0 4.3-1.3 5.5-3.5" />
          <path d="M18.5 7c.8-1.3 2.1-2 3.5-2-2.4 0-4.5 2-4.5 4.5 0 3 2.5 5.5 5.5 5.5-2.2 0-4.3-1.3-5.5-3.5" />
          <path d="M12 12c-2 1.5-3 4-3 6" />
          <path d="M12 12c2 1.5 3 4 3 6" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
