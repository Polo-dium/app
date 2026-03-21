import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

// Generates /icon.png — used for favicon and PWA manifest (192x192 + 512x512)
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          borderRadius: '22%',
        }}
      >
        {/* Butterfly wings — left */}
        <div
          style={{
            position: 'absolute',
            width: 160,
            height: 200,
            background: 'radial-gradient(ellipse at 70% 40%, #60a5fa 0%, #2563eb 60%, #1d4ed8 100%)',
            borderRadius: '80% 20% 60% 40%',
            left: 80,
            top: 130,
            opacity: 0.9,
            transform: 'rotate(-10deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 120,
            height: 150,
            background: 'radial-gradient(ellipse at 60% 60%, #93c5fd 0%, #3b82f6 60%, #2563eb 100%)',
            borderRadius: '40% 60% 20% 80%',
            left: 95,
            top: 310,
            opacity: 0.8,
            transform: 'rotate(15deg)',
          }}
        />
        {/* Butterfly wings — right */}
        <div
          style={{
            position: 'absolute',
            width: 160,
            height: 200,
            background: 'radial-gradient(ellipse at 30% 40%, #60a5fa 0%, #2563eb 60%, #1d4ed8 100%)',
            borderRadius: '20% 80% 40% 60%',
            right: 80,
            top: 130,
            opacity: 0.9,
            transform: 'rotate(10deg)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 120,
            height: 150,
            background: 'radial-gradient(ellipse at 40% 60%, #93c5fd 0%, #3b82f6 60%, #2563eb 100%)',
            borderRadius: '60% 40% 80% 20%',
            right: 95,
            top: 310,
            opacity: 0.8,
            transform: 'rotate(-15deg)',
          }}
        />
        {/* Body */}
        <div
          style={{
            position: 'absolute',
            width: 24,
            height: 220,
            background: 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%)',
            borderRadius: 12,
            top: 150,
            left: 244,
          }}
        />
        {/* Head */}
        <div
          style={{
            position: 'absolute',
            width: 32,
            height: 32,
            background: '#e2e8f0',
            borderRadius: '50%',
            top: 120,
            left: 240,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
