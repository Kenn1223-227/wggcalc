import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WeirdGunGameCalc — Weapon Lab',
  description: 'Tối ưu build súng Weird Gun Game từ kho phụ kiện và phong cách chơi của bạn.',
  applicationName: 'WeirdGunGameCalc',
  generator: 'v0.app',
  icons: {
    icon: '/logo.svg',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}