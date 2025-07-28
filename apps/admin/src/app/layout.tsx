import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'E-Commerce Admin Panel',
  description: 'Admin panel for e-commerce platform management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}