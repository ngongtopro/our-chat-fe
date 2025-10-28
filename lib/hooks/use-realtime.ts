'use client'

import { useCallback, useState } from 'react'
import { useRealtimeEvent } from '@/contexts/realtime-context'
import { message } from 'antd'

// Hook for wallet realtime updates
export function useWalletRealtime() {
  const [balance, setBalance] = useState<number | null>(null)
  const [lastTransaction, setLastTransaction] = useState<any>(null)

  // Subscribe to wallet balance updates
  useRealtimeEvent('wallet.updated', (event) => {
    console.log('💰 Wallet updated:', event.data)
    if (event.data.balance !== undefined) {
      setBalance(event.data.balance)
      message.success(`Số dư đã cập nhật: ${event.data.balance.toLocaleString()} coins`)
    }
  })

  // Subscribe to new transactions
  useRealtimeEvent('wallet.transaction', (event) => {
    console.log('💳 New transaction:', event.data)
    setLastTransaction(event.data)
    
    const { amount, transaction_type } = event.data
    const isPositive = amount > 0
    const msg = `${isPositive ? '+' : ''}${amount.toLocaleString()} coins`
    
    if (isPositive) {
      message.success(msg)
    } else {
      message.info(msg)
    }
  })

  return {
    balance,
    lastTransaction,
    setBalance,
  }
}

// Hook for Caro game realtime updates
export function useCaroRealtime() {
  const [roomsUpdate, setRoomsUpdate] = useState<any>(null)
  const [gameUpdate, setGameUpdate] = useState<any>(null)

  // Room created
  useRealtimeEvent('caro.room_created', (event) => {
    console.log('🎮 Room created:', event.data)
    setRoomsUpdate({ type: 'created', data: event.data })
  })

  // Room updated
  useRealtimeEvent('caro.room_updated', (event) => {
    console.log('🎮 Room updated:', event.data)
    setRoomsUpdate({ type: 'updated', data: event.data })
  })

  // Room deleted
  useRealtimeEvent('caro.room_deleted', (event) => {
    console.log('🎮 Room deleted:', event.data)
    setRoomsUpdate({ type: 'deleted', data: event.data })
  })

  // Game started
  useRealtimeEvent('caro.game_started', (event) => {
    console.log('🎮 Game started:', event.data)
    setGameUpdate({ type: 'started', data: event.data })
    message.success('Trò chơi bắt đầu!')
  })

  // Game move
  useRealtimeEvent('caro.game_move', (event) => {
    console.log('🎮 Game move:', event.data)
    setGameUpdate({ type: 'move', data: event.data })
  })

  // Game ended
  useRealtimeEvent('caro.game_ended', (event) => {
    console.log('🎮 Game ended:', event.data)
    setGameUpdate({ type: 'ended', data: event.data })
    
    if (event.data.winner) {
      message.success(`${event.data.winner} thắng!`)
    } else {
      message.info('Hòa!')
    }
  })

  return {
    roomsUpdate,
    gameUpdate,
  }
}

// Hook for chat realtime updates
export function useChatRealtime(roomId?: string) {
  const [newMessage, setNewMessage] = useState<any>(null)
  const [roomUpdate, setRoomUpdate] = useState<any>(null)

  // New message
  useRealtimeEvent('chat.new_message', (event) => {
    // Only update if it's for the current room or no room specified
    if (!roomId || event.data.room_id === roomId) {
      console.log('💬 New message:', event.data)
      setNewMessage(event.data)
    }
  })

  // Room updated
  useRealtimeEvent('chat.room_updated', (event) => {
    if (!roomId || event.data.room_id === roomId) {
      console.log('💬 Room updated:', event.data)
      setRoomUpdate(event.data)
    }
  })

  return {
    newMessage,
    roomUpdate,
  }
}

// Hook for farm realtime updates
export function useFarmRealtime() {
  const [cropReady, setCropReady] = useState<any>(null)
  const [animalReady, setAnimalReady] = useState<any>(null)

  // Crop ready to harvest
  useRealtimeEvent('farm.crop_ready', (event) => {
    console.log('🌾 Crop ready:', event.data)
    setCropReady(event.data)
    message.success(`${event.data.crop_name} đã sẵn sàng thu hoạch!`)
  })

  // Animal ready
  useRealtimeEvent('farm.animal_ready', (event) => {
    console.log('🐄 Animal ready:', event.data)
    setAnimalReady(event.data)
    message.success(`${event.data.animal_name} đã sẵn sàng!`)
  })

  return {
    cropReady,
    animalReady,
  }
}

// Hook for notifications
export function useNotifications() {
  const [notification, setNotification] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])

  useRealtimeEvent('notification.new', (event) => {
    console.log('🔔 New notification:', event.data)
    setNotification(event.data)
    setNotifications(prev => [event.data, ...prev])
    
    message.info({
      content: event.data.message,
      duration: 3,
    })
  })

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notification,
    notifications,
    clearNotifications,
  }
}
