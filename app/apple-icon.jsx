import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Generates /apple-icon.png — used for iOS home screen shortcut
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          borderRadius: 0,
        }}
      >
        {/* Butterfly wings — left */}
        <div
          style={{
            position: 'absolute',
            width: 56,
            height: 70,
            background: 'radial-gradient(ellipse at 70% 40%, #60a5fa 0%, #2563eb 60%, #1d4ed8 100%)',
            borderRadius: '80% 20% 60% 40%',
            left: 28,
            top: 46,
            opacity: 0.9,
            transform: 'rotate(-10deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 42,
            height: 52,
            background: 'radial-gradient(ellipse at 60% 60%, #93c5fd 0%, #3b82f6 60%, #2563eb 100%)',
            borderRadius: '40% 60% 20% 80%',
            left: 34,
            top: 110,
            opacity: 0.8,
            transform: 'rotate(15deg)',
          }}
        />
        {/* Butterfly wings — right */}
        <div
          style={{
            position: 'absolute',
            width: 56,
            height: 70,
            background: 'radial-gradient(ellipse at 30% 40%, #60a5fa 0%, #2563eb 60%, #1d4ed8 100%)',
            borderRadius: '20% 80% 40% 60%',
            right: 28,
            top: 46,
            opacity: 0.9,
            transform: 'rotate(10deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 42,
            height: 52,
            background: 'radial-gradient(ellipse at 40% 60%, #93c5fd 0%, #3b82f6 60%, #2563eb 100%)',
            borderRadius: '60% 40% 80% 20%',
            right: 34,
            top: 110,
            opacity: 0.8,
            transform: 'rotate(-15deg)',
          }}
        />
        {/* Body */}
        <div
          style={{
            position: 'absolute',
            width: 8,
            height: 78,
            background: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)',
            borderRadius: 4,
            top: 54,
            left: 86,
          }}
        />
        {/* Head */}
        <div
          style={{
            position: 'absolute',
            width: 12,
            height: 12,
            background: '#e2e8f0',
            borderRadius: '50%',
            top: 43,
            left: 84,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
