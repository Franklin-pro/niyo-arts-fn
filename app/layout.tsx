import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import 'antd/dist/reset.css'
import './globals.css'
import { SiteProvider } from '@/components/site-provider'
import { AntdProvider } from '@/components/ui/antd-provider'

export const metadata: Metadata = {
  title: 'Niyo Arts Center and Café — Kigali, Rwanda',
  description: 'Visit Niyo Arts Center and Café in Kigali: a gallery for Rwandan creative artists and a café serving coffee from Rwanda.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400&family=Goblin+One&family=Lato:wght@400;700&family=Libre+Baskerville:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AntdRegistry>
          <AntdProvider>
            <SiteProvider>{children}</SiteProvider>
            {process.env.NODE_ENV === 'production' && <Analytics />}
          </AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
