import type { Metadata, Viewport } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/ui/Providers'

const font = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grow Residencial',
  description: 'Sistema de gestión de residencias',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={font.className} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}