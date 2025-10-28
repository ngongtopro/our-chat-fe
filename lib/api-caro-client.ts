import { apiClient } from "./api-client"

// ===========================
// CARO GAME TYPES
// ===========================

export interface CaroMove {
  row: number
  col: number
  symbol: "X" | "O"
  move_number: number
  player_username: string
  timestamp: string
}

export interface CaroPlayer {
  username: string
  display_name: string
}

export interface CaroGame {
  id: number
  game_id: string
  room_name: string
  player1: CaroPlayer
  player2: CaroPlayer | null
  moves: CaroMove[]
  current_turn: "X" | "O"
  status: "waiting" | "playing" | "finished" | "abandoned"
  winner: CaroPlayer | null
  win_condition: number
  total_moves: number
  bet_amount: number
  total_pot: number
  winner_prize: number
  house_fee: number
  created_at: string
  updated_at: string
  started_at: string | null
  finished_at: string | null
}

export interface CaroGameListItem {
  id: number
  game_id: string
  room_name: string
  player1: string
  player2: string | null
  status: string
  bet_amount: number
  created_at: string
}

export interface CaroStats {
  total_games_played: number
  total_games_won: number
  win_rate: number
}

// ===========================
// CARO API CLIENT
// ===========================

class CaroApiClient {
  /**
   * Get list of all active Caro games (waiting or playing)
   * This uses the new ViewSet endpoint
   */
  async getActiveGames(): Promise<{ waiting: CaroGameListItem[]; playing: CaroGameListItem[] }> {
    return apiClient.get("/api/caro/games/rooms/")
  }

  /**
   * Get detailed information about a specific game
   */
  async getGameDetails(gameId: number): Promise<CaroGame> {
    return apiClient.get(`/api/caro/games/${gameId}/`)
  }

  /**
   * Get game status by room name
   */
  async getGameByRoomName(roomName: string): Promise<{ game: CaroGame | null; success: boolean }> {
    return apiClient.get(`/api/caro/games/room/${encodeURIComponent(roomName)}/`)
  }

  /**
   * Create a new Caro game room
   */
  async createGame(roomName: string): Promise<{ game: CaroGame; success: boolean; message?: string }> {
    return apiClient.post("/api/caro/games/create-room/", { room_name: roomName })
  }

  /**
   * Join an existing game room
   */
  async joinGame(roomName: string): Promise<{ game: CaroGame; success: boolean; message?: string }> {
    return apiClient.post("/api/caro/games/join-room/", { room_name: roomName })
  }

  /**
   * Make a move in the game
   */
  async makeMove(
    roomName: string,
    row: number,
    col: number
  ): Promise<{ game: CaroGame; success: boolean; message?: string }> {
    return apiClient.post(`/api/caro/games/make-move/`, { room_name: roomName, row, col })
  }

  /**
   * Abandon/leave the current game
   */
  async abandonGame(roomName: string): Promise<{ success: boolean; message?: string }> {
    return apiClient.post("/api/caro/games/abandon-room/", { room_name: roomName })
  }

  /**
   * Get user's Caro game statistics
   */
  async getStats(): Promise<{ stats: CaroStats; success: boolean }> {
    return apiClient.get("/api/caro/games/user-stats/")
  }

  /**
   * Get user's game history
   */
  async getGameHistory(limit: number = 10): Promise<{ games: CaroGame[]; success: boolean }> {
    return apiClient.get(`/api/caro/games/my_games/`)
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 10): Promise<{
    leaderboard: Array<{
      username: string
      display_name: string
      games_won: number
      games_played: number
      win_rate: number
    }>
    success: boolean
  }> {
    return apiClient.get(`/api/caro/games/leaderboard/?limit=${limit}`)
  }
}

export const caroApi = new CaroApiClient()
