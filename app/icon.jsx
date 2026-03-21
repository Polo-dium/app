import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

// Generates /icon.png — favicon + PWA manifest icon
// Uses the exact ButterflyIcon SVG paths from app/page.js
export default function Icon() {
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
          width="380"
          height="380"
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
