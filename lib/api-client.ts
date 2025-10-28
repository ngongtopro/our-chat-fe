const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
console.log("API Base URL:", API_BASE_URL)
class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    // Get token from localStorage on client side
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("chat-token")
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("chat-token", token)
      } else {
        localStorage.removeItem("chat-token")
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    // Always get the latest token from storage before making request
    if (typeof window !== "undefined") {
      const latestToken = localStorage.getItem("chat-token")
      if (latestToken) {
        this.token = latestToken
      }
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
      console.log("🔐 API Request with token:", this.token.substring(0, 20) + "...")
    } else {
      console.log("⚠️ API Request without token")
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Network error" }))
        console.error("❌ API Error Response:", response.status, error)
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (networkError: any) {
      console.error('API Error:', { url, error: networkError }) // Keep only error log
      throw new Error(`Failed to fetch: ${networkError.message || 'Unknown error'}`)
    }
  }

  // Authentication
  async login(username: string, password: string) {
    return this.request<{ user: any; access: string; refresh: string; message: string }>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })
  }

  async register(username: string, password: string, email: string, first_name: string, last_name: string) {
    return this.request<{ user: any; access: string; refresh: string; message: string }>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify({ username, password, email, first_name, last_name }),
    })
  }

  async me() {
    return this.request<{ user: any }>("/api/auth/me/")
  }

  async refreshToken(refresh: string) {
    return this.request<{ access: string }>("/api/auth/token/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh }),
    })
  }

  // Chat APIs
  async getChatUsers() {
    return this.request<{ online_users: any[]; online_user_ids: number[] }>("/api/chat/online-users/")
  }

  async getOnlineUsers() {
    return this.request<{ online_users: any[]; online_user_ids: number[] }>("/api/chat/online-users/")
  }

  async createPrivateChat(userId: number) {
    return this.request<{ chat: any; created: boolean }>("/api/chat/start-chat/", {
      method: "POST",
      body: JSON.stringify({ user_id: userId }),
    })
  }

  async getPrivateChats() {
    return this.request<any[]>("/api/chat/chats/")
  }

  async getMessages(chatId?: number) {
    const endpoint = chatId ? `/api/chat/messages/?chat=${chatId}` : "/api/chat/messages/"
    return this.request<any[]>(endpoint)
  }

  async sendMessage(chatId: number, content: string) {
    return this.request<any>("/api/chat/messages/", {
      method: "POST",
      body: JSON.stringify({ chat: chatId, content }),
    })
  }

  async markMessagesAsRead(chatId: number) {
    return this.request<{ status: string }>(`/chats/${chatId}/mark_read/`, {
      method: "POST",
    })
  }

  async updateActivity() {
    return this.request<{ status: string }>("/update-activity/", {
      method: "POST",
    })
  }

  // User Management APIs
  async getAllUsers() {
    return this.request<any[]>("/users/")
  }

  async getUserProfile(userId?: number) {
    const endpoint = userId ? `/profiles/${userId}/` : "/profiles/me/"
    return this.request<any>(endpoint)
  }

  async updateUserProfile(data: any) {
    return this.request<any>("/profiles/update_me/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  // Farm APIs (future expansion)
  async getFarmData() {
    return this.request<any>("/api/farm/")
  }

  async updateFarm(data: any) {
    return this.request<any>("/api/farm/", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
  }

  // Wallet APIs (future expansion)
  async getWallet() {
    return this.request<any>("/api/wallet/")
  }

  async addTransaction(data: any) {
    return this.request<any>("/api/wallet/transactions/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Generic HTTP methods
  async get<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
