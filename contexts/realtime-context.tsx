'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { message } from 'antd'

// Event types for realtime updates
export type RealtimeEventType = 
  | 'wallet.updated'
  | 'wallet.transaction'
  | 'caro.room_created'
  | 'caro.room_updated'
  | 'caro.room_deleted'
  | 'caro.game_started'
  | 'caro.game_move'
  | 'caro.game_ended'
  | 'chat.new_message'
  | 'chat.private_message'
  | 'chat.user_status'
  | 'chat.room_updated'
  | 'farm.crop_ready'
  | 'farm.animal_ready'
  | 'notification.new'

export interface RealtimeEvent {
  type: RealtimeEventType
  data: any
  timestamp: string
}

type EventCallback = (event: RealtimeEvent) => void

interface RealtimeContextType {
  isConnected: boolean
  subscribe: (eventType: RealtimeEventType, callback: EventCallback) => () => void
  unsubscribe: (eventType: RealtimeEventType, callback: EventCallback) => void
  send: (eventType: string, data: any) => void
}

const RealtimeContext = createContext<RealtimeContextType | null>(null)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subscriptionsRef = useRef<Map<RealtimeEventType, Set<EventCallback>>>(new Map())
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('chat-token') : null
    if (!token) return null

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = process.env.NEXT_PUBLIC_WS_URL || 'localhost:8000'
    return `${wsProtocol}//${wsHost}/ws/realtime/?token=${token}`
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    const url = getWebSocketUrl()
    if (!url) {
      console.log('🔌 No token, skipping realtime connection')
      return
    }

    try {
      console.log('🔌 Connecting to realtime server...')
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('✅ Realtime connected')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
          console.log('📨 Realtime event:', realtimeEvent.type, realtimeEvent.data)

          // Dispatch to all subscribers for this event type
          const subscribers = subscriptionsRef.current.get(realtimeEvent.type)
          if (subscribers) {
            subscribers.forEach(callback => {
              try {
                callback(realtimeEvent)
              } catch (error) {
                console.error('Error in subscriber callback:', error)
              }
            })
          }
        } catch (error) {
          console.error('Error parsing realtime message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ Realtime error:', error)
      }

      ws.onclose = () => {
        console.log('🔌 Realtime disconnected')
        setIsConnected(false)
        wsRef.current = null

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          console.log('❌ Max reconnection attempts reached')
          message.warning('Mất kết nối realtime. Vui lòng tải lại trang.')
        }
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
    }
  }, [getWebSocketUrl])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Subscribe to an event type
  const subscribe = useCallback((eventType: RealtimeEventType, callback: EventCallback) => {
    if (!subscriptionsRef.current.has(eventType)) {
      subscriptionsRef.current.set(eventType, new Set())
    }
    subscriptionsRef.current.get(eventType)!.add(callback)

    console.log(`📝 Subscribed to ${eventType}`)

    // Return unsubscribe function
    return () => {
      const subscribers = subscriptionsRef.current.get(eventType)
      if (subscribers) {
        subscribers.delete(callback)
        if (subscribers.size === 0) {
          subscriptionsRef.current.delete(eventType)
        }
      }
      console.log(`📝 Unsubscribed from ${eventType}`)
    }
  }, [])

  // Unsubscribe from an event type
  const unsubscribe = useCallback((eventType: RealtimeEventType, callback: EventCallback) => {
    const subscribers = subscriptionsRef.current.get(eventType)
    if (subscribers) {
      subscribers.delete(callback)
      if (subscribers.size === 0) {
        subscriptionsRef.current.delete(eventType)
      }
    }
  }, [])

  // Send message through WebSocket
  const send = useCallback((eventType: string, data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: eventType,
        data,
        timestamp: new Date().toISOString()
      }))
    } else {
      console.warn('WebSocket is not connected')
    }
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    // Only connect if we have a token
    const token = typeof window !== 'undefined' ? localStorage.getItem('chat-token') : null
    if (token) {
      console.log('🔌 RealtimeProvider: Initiating connection...')
      connect()
    } else {
      console.log('⏸️ RealtimeProvider: No token, waiting for login...')
    }
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Auto-reconnect when token changes (e.g., after login)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chat-token') {
        if (e.newValue) {
          console.log('🔑 Token detected, connecting realtime...')
          connect()
        } else {
          console.log('🔓 Token removed, disconnecting realtime...')
          disconnect()
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [connect, disconnect])

  return (
    <RealtimeContext.Provider value={{ isConnected, subscribe, unsubscribe, send }}>
      {children}
    </RealtimeContext.Provider>
  )
}

// Custom hook to use realtime context
export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider')
  }
  return context
}

// Custom hook to subscribe to specific event types
export function useRealtimeEvent(
  eventType: RealtimeEventType,
  callback: EventCallback,
  deps: React.DependencyList = []
) {
  const { subscribe } = useRealtime()
  const callbackRef = useRef(callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    // Wrap callback to use ref
    const wrappedCallback = (event: RealtimeEvent) => {
      callbackRef.current(event)
    }

    const unsubscribe = subscribe(eventType, wrappedCallback)
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, subscribe, ...deps])
}
