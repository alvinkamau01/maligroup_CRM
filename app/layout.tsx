import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// UxSculpt design system: Inter for UI/body, Satoshi (loaded in globals.css) for display
const interBody = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Mali Group — Leads Workflow Dashboard',
  description: 'Mali Group internal operations dashboard — manage property leads, seller and land contacts, skip tracing, PSA agreements, and multi-channel communications.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: '#ff5e2b',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${interBody.variable} ${jetbrainsMono.variable} bg-background`} suppressHydrationWarning>
      <head>
        {/* UxSculpt design system display face */}
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f%5B%5D=satoshi@500,700,900&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  const html = document.documentElement;
                  if (theme === 'dark') {
                    html.classList.add('dark');
                    html.classList.remove('light');
                  } else {
                    html.classList.add('light');
                    html.classList.remove('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans bg-background">
        <ThemeProvider>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
