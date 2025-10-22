"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"
import { useAuth } from "./auth-context"

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinAuction: (auctionId: string) => void
  leaveAuction: (auctionId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinAuction: () => {},
  leaveAuction: () => {},
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    const newSocket = io(SOCKET_URL, {
      auth: user ? {
        userId: user.id,
        name: user.name,
      } : {},
      transports: ["websocket", "polling"],
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    newSocket.on("connect", () => {
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      setIsConnected(false)
    })

    newSocket.on("connect_error", () => {
      setIsConnected(false)
      setTimeout(() => {
        if (!newSocket.connected) {
          newSocket.connect()
        }
      }, 2000)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
      setSocket(null)
      setIsConnected(false)
    }
  }, [user])

  const joinAuction = (auctionId: string) => {
    if (socket && isConnected) {
      socket.emit("joinAuction", auctionId)
    }
  }

  const leaveAuction = (auctionId: string) => {
    if (socket && isConnected) {
      socket.emit("leaveAuction", auctionId)
    }
  }

  const value = {
    socket,
    isConnected,
    joinAuction,
    leaveAuction,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
