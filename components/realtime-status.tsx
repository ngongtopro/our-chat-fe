'use client'

import { Badge, Tooltip } from 'antd'
import { WifiOutlined, LoadingOutlined } from '@ant-design/icons'
import { useRealtime } from '@/contexts/realtime-context'
import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'

export default function RealtimeStatus() {
  const { isConnected } = useRealtime()
  const { user } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)

  // Show connecting state for a brief moment
  useEffect(() => {
    if (!isConnected && user) {
      setIsConnecting(true)
      const timer = setTimeout(() => setIsConnecting(false), 3000)
      return () => clearTimeout(timer)
    } else {
      setIsConnecting(false)
    }
  }, [isConnected, user])

  if (!user) {
    return null // Don't show if not logged in
  }

  const getStatus = () => {
    if (isConnecting) {
      return { status: 'processing' as const, text: 'Connecting', icon: <LoadingOutlined /> }
    }
    if (isConnected) {
      return { status: 'success' as const, text: 'Live', icon: <WifiOutlined /> }
    }
    return { status: 'error' as const, text: 'Offline', icon: <WifiOutlined /> }
  }

  const { status, text, icon } = getStatus()

  return (
    <Tooltip title={isConnected ? 'Kết nối realtime đang hoạt động' : 'Mất kết nối realtime'}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        padding: '4px 12px',
        borderRadius: 16,
        background: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        cursor: 'default'
      }}>
        <Badge 
          status={status}
          style={{ marginRight: -4 }}
        />
        <span style={{ 
          fontSize: 12, 
          color: '#fff',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}>
          {icon}
          {text}
        </span>
      </div>
    </Tooltip>
  )
}
