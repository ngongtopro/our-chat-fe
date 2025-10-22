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

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Network error" }))
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

  // Categories
  async getCategories() {
    return this.request<{ categories: any[] }>("/api/categories")
  }

  async createCategory(categoryData: any) {
    return this.request<any>("/api/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    })
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/api/categories/${id}`, {
      method: "DELETE",
    })
  }

  // Auctions
  async getAuctions(params?: { category?: string; status?: string; search?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.category) searchParams.set("category", params.category)
    if (params?.status) searchParams.set("status", params.status)
    if (params?.search) searchParams.set("search", params.search)
    
    const query = searchParams.toString()
    return this.request<{ auctions: any[] }>(`/api/auctions${query ? `?${query}` : ""}`)
  }

  async getAuction(id: string) {
    return this.request<{ auction: any; bids: any[] }>(`/api/auctions/${id}`)
  }

  async createAuction(data: any) {
    return this.request<{ auction: any; message: string }>("/api/auctions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateAuction(id: string, data: any) {
    return this.request<{ auction: any; message: string }>(`/api/auctions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteAuction(id: string) {
    return this.request<{ message: string }>(`/api/auctions/${id}`, {
      method: "DELETE",
    })
  }

  // Bids
  async placeBid(auctionId: string, amount: number) {
    return this.request<{ bid: any; auction: any; message: string }>(`/api/auctions/${auctionId}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    })
  }

  async getBids(auctionId: string) {
    return this.request<{ bids: any[] }>(`/api/auctions/${auctionId}/bids`)
  }

  // File upload endpoint
  async uploadUserDocument(auctionId: string, file: File) {
    const formData = new FormData()
    formData.append('document', file)
    formData.append('auctionId', auctionId)
    
    const headers: Record<string, string> = {}
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(`${this.baseURL}/api/auctions/${auctionId}/user-documents`, {
      method: 'POST',
      body: formData,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Get user documents for auction
  async getUserDocuments(auctionId: string) {
    return this.request<any>(`/api/auctions/${auctionId}/user-documents`)
  }

  // Delete user document
  async deleteUserDocument(auctionId: string, documentId: string) {
    return this.request<any>(`/api/auctions/${auctionId}/user-documents/${documentId}`, {
      method: 'DELETE'
    })
  }

  // Admin endpoints
  async getAdminDashboard() {
    return this.request<{ stats: any; recentAuctions: any[]; recentUsers: any[] }>("/api/admin/dashboard")
  }

  async getAdminAuctions() {
    return this.request<{ auctions: any[] }>("/api/auctions")
  }

  async getUsers() {
    return this.request<{ users: any[] }>("/api/admin/users")
  }

  async getUserDetails(id: string) {
    return this.request<{ user: any; stats: any }>(`/api/admin/users/${id}`)
  }

  async updateUser(id: string, data: any) {
    return this.request<{ user: any; message: string }>(`/api/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/api/admin/users/${id}`, {
      method: "DELETE",
    })
  }

  async bulkUpdateUsers(userIds: string[], updates: any) {
    return this.request<{ message: string; updatedCount: number }>("/api/admin/users/bulk", {
      method: "PUT", 
      body: JSON.stringify({ userIds, updates }),
    })
  }

  async getUserStats(id: string) {
    return this.request<{ 
      totalAuctions: number; 
      totalBids: number; 
      winCount: number; 
      totalSpent: number 
    }>(`/api/admin/users/${id}/stats`)
  }

  // User profile management
  async updateProfile(data: any) {
    return this.request<{ user: any; message: string }>("/api/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getUserAuctions(userId?: string) {
    const endpoint = userId ? `/api/admin/users/${userId}/auctions` : "/api/auth/my-auctions"
    return this.request<{ auctions: any[] }>(endpoint)
  }

  async getUserBids(userId?: string) {
    const endpoint = userId ? `/api/admin/users/${userId}/bids` : "/api/auth/my-bids"
    return this.request<{ bids: any[] }>(endpoint)
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
