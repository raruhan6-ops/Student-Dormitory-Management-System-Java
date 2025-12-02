import './globals.css'
import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import dynamic from 'next/dynamic'

const ChatBot = dynamic(() => import('@/components/ChatBot'), { ssr: false })

export const metadata: Metadata = {
  title: '学生宿舍管理系统',
  description: '高校学生宿舍综合管理平台，服务学生、宿管和管理员。',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
          <ChatBot />
        </ThemeProvider>
      </body>
    </html>
  )
}
