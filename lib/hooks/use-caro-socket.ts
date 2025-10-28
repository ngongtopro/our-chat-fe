import { useEffect, useRef, useCallback, useState } from 'react'

export interface CaroRoomListData {
  waiting: Array<{
    id: number
    game_id: string
    room_name: string
    player1: string
    player2: string | null
    status: string
    bet_amount: number
    created_at: string
  }>
  playing: Array<{
    id: number
    game_id: string
    room_name: string
    player1: string
    player2: string | null
    status: string
    bet_amount: number
    created_at: string
  }>
}

export interface UseCaroRoomListSocketProps {
  onRoomsUpdate?: (data: CaroRoomListData) => void
}

/**
 * Hook to connect to Caro room list WebSocket for real-time updates
 */
export function useCaroRoomListSocket({ onRoomsUpdate }: UseCaroRoomListSocketProps = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onRoomsUpdateRef = useRef(onRoomsUpdate)

  // Update the ref when onRoomsUpdate changes
  useEffect(() => {
    onRoomsUpdateRef.current = onRoomsUpdate
  }, [onRoomsUpdate])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const refreshRooms = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'refresh_rooms' }))
    }
  }, [])

  useEffect(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/caro/rooms/`

    console.log('🔌 Connecting to Caro room list WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ Connected to Caro room list WebSocket')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('📨 Caro room list message:', message)

        if (message.type === 'rooms_update' && message.data) {
          onRoomsUpdateRef.current?.(message.data)
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ Caro room list WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 Disconnected from Caro room list WebSocket')
      setIsConnected(false)

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect to Caro room list WebSocket...')
        // Trigger reconnect by setting state
        setIsConnected(false)
      }, 3000)
    }

    wsRef.current = ws

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, []) // Empty deps - only run once on mount

  return {
    isConnected,
    refreshRooms,
    disconnect,
  }
}

export interface CaroGameData {
  id: number
  game_id: string
  room_name: string
  player1: {
    username: string
    display_name: string
  }
  player2: {
    username: string
    display_name: string
  } | null
  current_turn: 'X' | 'O'
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
  winner: {
    username: string
    display_name: string
  } | null
  total_moves: number
  moves: Array<{
    row: number
    col: number
    symbol: 'X' | 'O'
    move_number: number
    player_username: string
    timestamp: string
  }>
  bet_amount: number
  total_pot: number
  winner_prize: number
  house_fee: number
}

export interface UseCaroGameSocketProps {
  roomName: string
  onGameStateUpdate?: (data: CaroGameData) => void
  onError?: (message: string) => void
}

/**
 * Hook to connect to individual Caro game WebSocket for real-time game updates
 */
export function useCaroGameSocket({ roomName, onGameStateUpdate, onError }: UseCaroGameSocketProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const onGameStateUpdateRef = useRef(onGameStateUpdate)
  const onErrorRef = useRef(onError)

  // Update refs when callbacks change
  useEffect(() => {
    onGameStateUpdateRef.current = onGameStateUpdate
  }, [onGameStateUpdate])

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const makeMove = useCallback((row: number, col: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'make_move',
        row,
        col,
      }))
    }
  }, [])

  const refreshGame = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'refresh_game' }))
    }
  }, [])

  useEffect(() => {
    if (!roomName) {
      setIsConnected(false)
      return
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close()
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/caro/game/${encodeURIComponent(roomName)}/`

    console.log('🎮 Connecting to Caro game WebSocket:', wsUrl)

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ Connected to Caro game WebSocket')
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('📨 Caro game message:', message)

        if (message.type === 'game_state' && message.data) {
          onGameStateUpdateRef.current?.(message.data)
        } else if (message.type === 'error' && message.message) {
          onErrorRef.current?.(message.message)
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ Caro game WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 Disconnected from Caro game WebSocket')
      setIsConnected(false)

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect to Caro game WebSocket...')
        // Trigger re-render to reconnect
        setIsConnected(false)
      }, 3000)
    }

    wsRef.current = ws

    // Cleanup on unmount or roomName change
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [roomName]) // Only depend on roomName

  return {
    isConnected,
    makeMove,
    refreshGame,
    disconnect,
  }
}
