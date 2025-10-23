"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, email: string, first_name: string, last_name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token and validate with backend
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("chat-token")
        if (token) {
          apiClient.setToken(token)
          try {
            const response = await apiClient.me()
            setUser(response.user)
          } catch (error) {
            console.error("Token validation failed:", error)
            // Token is invalid, remove it
            localStorage.removeItem("chat-token")
            apiClient.setToken(null)
            setUser(null)
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only run on client side
    if (typeof window !== "undefined") {
      initAuth()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await apiClient.login(username, password)
      setUser(response.user)
      apiClient.setToken(response.access)
      // Store tokens in localStorage
      localStorage.setItem("chat-token", response.access)
      localStorage.setItem("chat-refresh-token", response.refresh)
      // Also store in cookies for middleware
      document.cookie = `chat-token=${response.access}; path=/; max-age=86400; SameSite=Lax`
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("❌ Login error:", error)
      setIsLoading(false)
      return false
    }
  }

  const register = async (username: string, password: string, email: string, first_name: string, last_name: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await apiClient.register(username, password, email, first_name, last_name)
      setUser(response.user)
      apiClient.setToken(response.access)
      // Store tokens in localStorage
      localStorage.setItem("chat-token", response.access)
      localStorage.setItem("chat-refresh-token", response.refresh)
      // Also store in cookies for middleware
      document.cookie = `chat-token=${response.access}; path=/; max-age=86400; SameSite=Lax`
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("❌ Registration error:", error)
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    apiClient.setToken(null)
    localStorage.removeItem("chat-token")
    localStorage.removeItem("chat-refresh-token")
    // Clear cookie
    document.cookie = "chat-token=; path=/; max-age=0"
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
