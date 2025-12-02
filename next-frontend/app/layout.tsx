import './globals.css'
import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { Metadata } from 'next'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'Student Dormitory Management',
  description: 'Next.js Frontend',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main className="min-h-[calc(100dvh-64px)]">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
