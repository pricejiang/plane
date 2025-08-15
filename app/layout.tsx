import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Excalidraw Next.js App',
  description: 'A Next.js application with Excalidraw integration',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}