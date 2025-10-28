'use client'

import { useEffect } from 'react'
import { Layout, ConfigProvider, theme } from 'antd'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useRealtime } from '@/contexts/realtime-context'
import HeaderComponent from '@/components/header'
import PageTransition from '@/components/page-transition'

const { Content } = Layout

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const { isConnected } = useRealtime()

  // Log connection status for debugging
  useEffect(() => {
    if (user) {
      console.log(`✅ User: ${user.username}, Realtime: ${isConnected ? '🟢 Connected' : '🔴 Disconnected'}`)
    }
  }, [user, isConnected])

  // Page transition effect (optional)
  useEffect(() => {
    console.log(`📍 Navigation: ${pathname}`)
  }, [pathname])

  // Don't show header on auth pages
  const isAuthPage = pathname.startsWith('/auth')

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        {!isAuthPage && <HeaderComponent />}
        <Content
          style={{
            padding: isAuthPage ? 0 : '24px',
            minHeight: 'calc(100vh - 64px)',
            background: isAuthPage ? '#f0f2f5' : 'transparent',
          }}
        >
          <PageTransition>
            {children}
          </PageTransition>
        </Content>
      </Layout>
    </ConfigProvider>
  )
}
