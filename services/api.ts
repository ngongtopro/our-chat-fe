import axios, { InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('chat-token') : null
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Wallet API
export const walletAPI = {
  // Get wallet info
  getWallet: async () => {
    const response = await apiClient.get('/api/wallet/wallets/my_wallet/')
    return response.data
  },

  // Get transaction history
  getTransactions: async () => {
    const response = await apiClient.get('/api/wallet/transactions/')
    return response.data
  },

  // Get wallet stats
  getStats: async () => {
    const response = await apiClient.get('/api/wallet/wallets/stats/')
    return response.data
  },

  // Add balance (deposit)
  addBalance: async (amount: number, description?: string) => {
    const response = await apiClient.post('/api/wallet/wallets/add_balance/', {
      amount,
      description: description || 'Nạp tiền vào ví'
    })
    return response.data
  },

  // Deduct balance (withdraw)
  deductBalance: async (amount: number, description?: string) => {
    const response = await apiClient.post('/api/wallet/wallets/deduct_balance/', {
      amount,
      description: description || 'Rút tiền từ ví'
    })
    return response.data
  },
}

export default apiClient
