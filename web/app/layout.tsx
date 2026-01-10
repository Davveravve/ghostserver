import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SoundProvider } from '@/components/providers/SoundProvider'
import { GlobalClickSound } from '@/components/providers/GlobalClickSound'

export const metadata: Metadata = {
  title: 'Ghost Servers | CS2 Community Servers',
  description: 'Premium CS2 community servers with Surf, Retake & Competitive. Earn souls, open cases, collect rare items.',
  keywords: ['CS2', 'Counter-Strike', 'Surf', 'Retake', 'Gaming', 'Community Server'],
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ghost-bg text-white antialiased">
        <SoundProvider>
          <GlobalClickSound />
          <AuthProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-140px)]">
              {children}
            </main>
            <Footer />
          </AuthProvider>
        </SoundProvider>
      </body>
    </html>
  )
}
