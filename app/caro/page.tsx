"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, List, Modal, Form, Select, message, Spin, Statistic, Badge, Space } from 'antd'
import { PlusOutlined, PlayCircleOutlined, TrophyOutlined } from '@ant-design/icons'
import { caroApi } from '@/lib/api-caro-client'
import { useCaroRoomListSocket } from '@/lib/hooks/use-caro-socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Add relativeTime plugin for dayjs
dayjs.extend(relativeTime)

// Interfaces
interface CaroPlayer {
  username: string
  display_name: string
}

interface CaroMove {
  row: number
  col: number
  symbol: 'X' | 'O'
  move_number: number
  player_username: string
  timestamp: string
}

interface CaroGame {
  id: number
  game_id: string
  room_name: string
  player1: CaroPlayer
  player2: CaroPlayer | null
  moves: CaroMove[]
  current_turn: 'X' | 'O'
  status: 'waiting' | 'playing' | 'finished' | 'abandoned'
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

interface GameListItem {
  id: number
  game_id: string
  room_name: string
  player1: string
  player2: string | null
  status: string
  bet_amount: number
  created_at: string
}

interface GameStats {
  total_games_played: number
  total_games_won: number
  win_rate: number
}

const { Title, Text } = Typography
const { Option } = Select

export default function CaroPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [waitingGames, setWaitingGames] = useState<GameListItem[]>([])
  const [stats, setStats] = useState<GameStats | null>(null)
  const [currentGame, setCurrentGame] = useState<CaroGame | null>(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [gameModalVisible, setGameModalVisible] = useState(false)
  const [myActiveGame, setMyActiveGame] = useState<CaroGame | null>(null)

  // WebSocket connection for realtime room list updates
  const { isConnected } = useCaroRoomListSocket({
    onRoomsUpdate: (data) => {
      console.log('🔄 Rooms updated via WebSocket:', data)
      setWaitingGames(data.waiting || [])
    }
  })

  // Initial load - load both stats and games
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Load active games and stats
      const [gamesRes, statsRes] = await Promise.all([
        caroApi.getActiveGames().catch(() => ({ waiting: [], playing: [] })),
        caroApi.getStats().catch(() => ({ stats: null, success: false }))
      ])

      console.log('Initial load:', { games: gamesRes, stats: statsRes })

      setWaitingGames(gamesRes.waiting || [])
      if (statsRes.success && statsRes.stats) {
        setStats(statsRes.stats)
      }

      // Check if user has an active game
      const userGames = [...(gamesRes.waiting || []), ...(gamesRes.playing || [])]
      // TODO: Filter to find user's game when we have username from auth context
      
    } catch (error) {
      console.error('Error loading initial data:', error)
      message.error('Không thể tải dữ liệu game')
    } finally {
      setLoading(false)
    }
  }

  const createGame = async (roomName: string) => {
    if (!roomName || roomName.trim() === '') {
      message.error('Vui lòng nhập tên phòng')
      return
    }

    try {
      setCreating(true)
      const response = await caroApi.createGame(roomName.trim())
      
      if (response.success && response.game) {
        message.success('Tạo phòng thành công!')
        setCreateModalVisible(false)
        
        // Navigate to game detail page
        router.push(`/caro/${response.game.room_name}`)
      } else {
        message.error(response.message || 'Không thể tạo phòng')
      }
    } catch (error: any) {
      console.error('Error creating game:', error)
      
      if (error.message?.includes('insufficient_balance')) {
        message.error('Số dư không đủ để tạo phòng (cần 10,000 coins)')
      } else if (error.message?.includes('game_in_progress')) {
        message.error('Bạn đang có trận đấu chưa kết thúc')
      } else {
        message.error('Không thể tạo phòng')
      }
    } finally {
      setCreating(false)
    }
  }

  const joinGame = async (roomName: string) => {
    try {
      const response = await caroApi.joinGame(roomName)
      
      if (response.success && response.game) {
        message.success('Tham gia phòng thành công!')
        
        // Navigate to game detail page
        router.push(`/caro/${response.game.room_name}`)
      } else {
        message.error(response.message || 'Không thể tham gia phòng')
      }
    } catch (error: any) {
      console.error('Error joining game:', error)
      
      if (error.message?.includes('insufficient_balance')) {
        message.error('Số dư không đủ để tham gia (cần 10,000 coins)')
      } else if (error.message?.includes('own_game')) {
        message.error('Không thể tham gia phòng của chính mình')
      } else if (error.message?.includes('no_game')) {
        message.error('Phòng không tồn tại hoặc đã đầy')
      } else {
        message.error('Không thể tham gia phòng')
      }
    }
  }

  const abandonGame = async () => {
    if (!currentGame) return

    Modal.confirm({
      title: 'Xác nhận đầu hàng',
      content: 'Bạn có chắc chắn muốn đầu hàng? Bạn sẽ thua ván này.',
      okText: 'Đầu hàng',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await caroApi.abandonGame(currentGame.room_name)
          
          if (response.success) {
            message.success('Đã đầu hàng')
            setMyActiveGame(null)
            setCurrentGame(null)
            setGameModalVisible(false)
            // Reload all data because game finished (affects stats)
            loadInitialData()
          }
        } catch (error) {
          console.error('Error abandoning game:', error)
          message.error('Không thể đầu hàng')
        }
      }
    })
  }

  const openGameByRoom = async (roomName: string) => {
    try {
      const response = await caroApi.getGameByRoomName(roomName)
      
      if (response.success && response.game) {
        setCurrentGame(response.game)
        setGameModalVisible(true)
      } else {
        message.error('Không tìm thấy phòng')
      }
    } catch (error) {
      console.error('Error loading game:', error)
      message.error('Không thể tải thông tin phòng')
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>🎮 Game Caro</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          disabled={!!myActiveGame}
        >
          Tạo phòng mới
        </Button>
      </div>

      {/* Warning if user has active game */}
      {myActiveGame && (
        <Card style={{ marginBottom: 24, backgroundColor: '#fff7e6', borderColor: '#ffa940' }}>
          <Space>
            <Text strong>⚠️ Bạn đang có trận đấu chưa kết thúc:</Text>
            <Button 
              type="link" 
              onClick={() => router.push(`/caro/${myActiveGame.room_name}`)}
            >
              Quay lại phòng "{myActiveGame.room_name}"
            </Button>
          </Space>
        </Card>
      )}

      {/* Game Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng trận"
              value={stats?.total_games_played || 0}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Trận thắng"
              value={stats?.total_games_won || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tỷ lệ thắng"
              value={stats?.win_rate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Waiting Games List */}
      <Card 
        title={
          <Space>
            <Text strong>Danh sách phòng chờ</Text>
            <Badge count={waitingGames.length} showZero />
          </Space>
        }
      >
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 4,
            xxl: 4,
          }}
          dataSource={waitingGames}
          locale={{ emptyText: 'Không có phòng nào đang chờ. Hãy tạo phòng mới!' }}
          renderItem={(game) => (
            <List.Item>
              <Card
                hoverable
                actions={[
                  <Button 
                    key="join"
                    type="primary" 
                    block
                    icon={<PlayCircleOutlined />}
                    onClick={() => joinGame(game.room_name)}
                    disabled={!!myActiveGame}
                  >
                    Tham gia
                  </Button>
                ]}
              >
                <Card.Meta
                  avatar={<Badge status="warning" text="Đang chờ" />}
                  title={
                    <Space direction="vertical" size={0}>
                      <Text strong style={{ fontSize: 16 }}>
                        🎯 {game.room_name}
                      </Text>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Text>
                        👤 Chủ phòng: <Text strong>{game.player1}</Text>
                      </Text>
                      <Text type="secondary">
                        💰 Cược: {game.bet_amount.toLocaleString()} coins
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ⏰ {dayjs(game.created_at).fromNow()}
                      </Text>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Card>

      {/* Create Game Modal */}
      <Modal
        title="Tạo phòng mới"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={(values) => createGame(values.room_name)}
        >
          <Form.Item
            name="room_name"
            label="Tên phòng"
            rules={[
              { required: true, message: 'Vui lòng nhập tên phòng' },
              { min: 3, message: 'Tên phòng phải có ít nhất 3 ký tự' },
              { max: 30, message: 'Tên phòng không được quá 30 ký tự' }
            ]}
          >
            <input 
              type="text" 
              placeholder="Nhập tên phòng (VD: PhongCuaToi123)"
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                borderRadius: '6px',
                border: '1px solid #d9d9d9'
              }}
            />
          </Form.Item>

          <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f5ff', borderRadius: 6 }}>
            <Space direction="vertical" size={4}>
              <Text strong>💰 Phí tham gia: 10,000 coins</Text>
              <Text type="secondary">• Người thắng nhận: 18,000 coins (90%)</Text>
              <Text type="secondary">• Phí hệ thống: 2,000 coins (10%)</Text>
            </Space>
          </div>

          <Form.Item>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                Tạo phòng
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Game Play Modal */}
      <Modal
        title={
          currentGame ? (
            <Space>
              <Text strong>🎯 {currentGame.room_name}</Text>
              <Badge 
                status={
                  currentGame.status === 'playing' ? 'processing' : 
                  currentGame.status === 'waiting' ? 'warning' : 'success'
                } 
                text={
                  currentGame.status === 'playing' ? 'Đang chơi' : 
                  currentGame.status === 'waiting' ? 'Đang chờ' : 'Kết thúc'
                }
              />
            </Space>
          ) : 'Game'
        }
        open={gameModalVisible}
        onCancel={() => setGameModalVisible(false)}
        footer={
          currentGame && currentGame.status === 'playing' ? (
            <Space>
              <Button danger onClick={abandonGame}>
                Đầu hàng
              </Button>
              <Button onClick={() => setGameModalVisible(false)}>
                Đóng
              </Button>
            </Space>
          ) : null
        }
        width={700}
      >
        {currentGame && (
          <div>
            {/* Game Info */}
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">Người chơi 1 (X)</Text>
                    <Text strong style={{ fontSize: 16 }}>
                      👤 {currentGame.player1.display_name}
                    </Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">Người chơi 2 (O)</Text>
                    <Text strong style={{ fontSize: 16 }}>
                      {currentGame.player2 ? (
                        `👤 ${currentGame.player2.display_name}`
                      ) : (
                        <Text type="secondary">Đang chờ...</Text>
                      )}
                    </Text>
                  </Space>
                </Col>
              </Row>
              
              {currentGame.status === 'playing' && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                    🎯 Lượt: {currentGame.current_turn}
                  </Text>
                </div>
              )}
              
              {currentGame.winner && (
                <div style={{ marginTop: 16, textAlign: 'center', padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
                  <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                    🎉 Người thắng: {currentGame.winner.display_name}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Phần thưởng: {currentGame.winner_prize.toLocaleString()} coins
                  </Text>
                </div>
              )}
            </Card>

            {/* Game Board - TODO: Implement board rendering */}
            <Card title="Bàn cờ">
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">
                  Bàn cờ sẽ được hiển thị ở đây
                </Text>
                <br />
                <Text type="secondary">
                  Tổng số nước đi: {currentGame.total_moves}
                </Text>
              </div>
            </Card>

            {/* Move History */}
            {currentGame.moves && currentGame.moves.length > 0 && (
              <Card title="Lịch sử nước đi" style={{ marginTop: 16 }}>
                <List
                  size="small"
                  dataSource={currentGame.moves.slice(-10)}
                  renderItem={(move) => (
                    <List.Item>
                      <Text>
                        {move.move_number}. {move.player_username} ({move.symbol}): 
                        ({move.row}, {move.col})
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(move.timestamp).format('HH:mm:ss')}
                      </Text>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
