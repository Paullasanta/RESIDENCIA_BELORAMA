import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/ui/Providers'

const font = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Belorama',
  description: 'Sistema de gestión de residencias',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={font.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}