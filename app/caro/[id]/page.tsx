"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Row, Col, Button, Typography, Spin, Badge, Space, Modal, message } from 'antd'
import { ArrowLeftOutlined, TrophyOutlined } from '@ant-design/icons'
import { caroApi, CaroGame } from '@/lib/api-caro-client'
import { useCaroGameSocket } from '@/lib/hooks/use-caro-socket'
import dayjs from 'dayjs'

const { Title, Text } = Typography

export default function CaroGameDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomName = params.id as string
  
  const [game, setGame] = useState<CaroGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)

  // WebSocket connection for realtime game updates
  const { isConnected, makeMove } = useCaroGameSocket({
    roomName,
    onGameStateUpdate: (data) => {
      console.log('🎮 Game state updated:', data)
      setGame(data as any)
    },
    onError: (errorMessage) => {
      message.error(errorMessage)
    }
  })

  useEffect(() => {
    loadGame()
  }, [roomName])

  const loadGame = async () => {
    try {
      setLoading(true)
      const response = await caroApi.getGameByRoomName(roomName)
      
      if (response.success && response.game) {
        setGame(response.game)
      } else {
        message.error('Không tìm thấy phòng')
        router.push('/caro')
      }
    } catch (error) {
      console.error('Error loading game:', error)
      message.error('Không thể tải thông tin phòng')
      router.push('/caro')
    } finally {
      setLoading(false)
    }
  }

  const handleCellClick = (row: number, col: number) => {
    if (!game || game.status !== 'playing') return
    
    // Check if it's user's turn (simplified - need auth context for proper check)
    // For now, just send the move
    makeMove(row, col)
  }

  const handleAbandon = () => {
    if (!game) return

    Modal.confirm({
      title: 'Xác nhận đầu hàng',
      content: 'Bạn có chắc chắn muốn đầu hàng? Bạn sẽ thua ván này.',
      okText: 'Đầu hàng',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await caroApi.abandonGame(game.room_name)
          
          if (response.success) {
            message.success('Đã đầu hàng')
            router.push('/caro')
          }
        } catch (error) {
          console.error('Error abandoning game:', error)
          message.error('Không thể đầu hàng')
        }
      }
    })
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '70vh' 
      }}>
        <Spin size="large" tip="Đang tải game..." />
      </div>
    )
  }

  if (!game) {
    return null
  }

  // Build board from moves
  const board: { [key: string]: 'X' | 'O' } = {}
  game.moves.forEach(move => {
    board[`${move.row},${move.col}`] = move.symbol
  })

  // Determine board size dynamically
  let maxRow = 14, maxCol = 14
  game.moves.forEach(move => {
    if (move.row > maxRow) maxRow = move.row
    if (move.col > maxCol) maxCol = move.col
  })
  
  const boardSize = Math.max(15, maxRow + 1, maxCol + 1)

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/caro')}
          >
            Quay lại
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            🎯 {game.room_name}
          </Title>
          <Badge 
            status={
              game.status === 'playing' ? 'processing' : 
              game.status === 'waiting' ? 'warning' : 'success'
            } 
            text={
              game.status === 'playing' ? 'Đang chơi' : 
              game.status === 'waiting' ? 'Đang chờ' : 'Kết thúc'
            }
          />
          {isConnected && <Badge status="success" text="Realtime" />}
        </Space>

        {game.status === 'playing' && (
          <Button danger onClick={handleAbandon}>
            Đầu hàng
          </Button>
        )}
      </div>

      <Row gutter={24}>
        {/* Game Board */}
        <Col xs={24} lg={16}>
          <Card title="Bàn cờ">
            {game.status === 'waiting' && !game.player2 && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  ⏳ Đang chờ người chơi thứ 2 tham gia...
                </Text>
              </div>
            )}
            
            {(game.status === 'playing' || game.total_moves > 0) && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${boardSize}, 30px)`,
                gap: '1px',
                backgroundColor: '#ccc',
                border: '2px solid #999',
                width: 'fit-content',
                margin: '0 auto'
              }}>
                {Array.from({ length: boardSize * boardSize }).map((_, index) => {
                  const row = Math.floor(index / boardSize)
                  const col = index % boardSize
                  const cellKey = `${row},${col}`
                  const cellValue = board[cellKey]

                  return (
                    <div
                      key={cellKey}
                      onClick={() => handleCellClick(row, col)}
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: game.status === 'playing' && !cellValue ? 'pointer' : 'default',
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: cellValue === 'X' ? '#1890ff' : '#f5222d',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        if (game.status === 'playing' && !cellValue) {
                          e.currentTarget.style.backgroundColor = '#f0f0f0'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff'
                      }}
                    >
                      {cellValue}
                    </div>
                  )
                })}
              </div>
            )}

            {game.total_moves === 0 && game.status === 'playing' && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Text type="secondary">
                  Click vào ô trống để đánh
                </Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Game Info & History */}
        <Col xs={24} lg={8}>
          {/* Players Info */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Người chơi 1 (X)</Text>
                  <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                    👤 {game.player1.display_name}
                  </Text>
                </Space>
              </Col>
              <Col span={12}>
                <Space direction="vertical" size={4}>
                  <Text type="secondary">Người chơi 2 (O)</Text>
                  <Text strong style={{ fontSize: 16, color: '#f5222d' }}>
                    {game.player2 ? (
                      `👤 ${game.player2.display_name}`
                    ) : (
                      <Text type="secondary">Đang chờ...</Text>
                    )}
                  </Text>
                </Space>
              </Col>
            </Row>
            
            {game.status === 'playing' && (
              <div style={{ marginTop: 16, textAlign: 'center', padding: 12, backgroundColor: '#f0f5ff', borderRadius: 6 }}>
                <Text strong style={{ fontSize: 16, color: '#1890ff' }}>
                  🎯 Lượt: {game.current_turn}
                </Text>
              </div>
            )}
            
            {game.winner && (
              <div style={{ marginTop: 16, textAlign: 'center', padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
                <TrophyOutlined style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }} />
                <br />
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  {game.winner.display_name}
                </Text>
                <br />
                <Text type="secondary">
                  Phần thưởng: {game.winner_prize.toLocaleString()} coins
                </Text>
              </div>
            )}
          </Card>

          {/* Game Stats */}
          <Card title="Thông tin" style={{ marginBottom: 16 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Tổng cược:</Text>
                <Text strong>{game.total_pot.toLocaleString()} coins</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Người thắng nhận:</Text>
                <Text strong style={{ color: '#52c41a' }}>{game.winner_prize.toLocaleString()} coins</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Phí hệ thống:</Text>
                <Text type="secondary">{game.house_fee.toLocaleString()} coins</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Số nước đi:</Text>
                <Text strong>{game.total_moves}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">Thời gian tạo:</Text>
                <Text>{dayjs(game.created_at).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
            </Space>
          </Card>

          {/* Move History */}
          {game.moves.length > 0 && (
            <Card 
              title="Lịch sử nước đi" 
              extra={<Text type="secondary">{game.moves.length} nước</Text>}
              style={{ maxHeight: 400, overflow: 'auto' }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {game.moves.slice().reverse().slice(0, 20).map((move) => (
                  <div 
                    key={move.move_number}
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      padding: '4px 8px',
                      backgroundColor: move.move_number === game.total_moves ? '#f0f5ff' : 'transparent',
                      borderRadius: 4
                    }}
                  >
                    <Text>
                      <Text strong style={{ color: move.symbol === 'X' ? '#1890ff' : '#f5222d' }}>
                        {move.move_number}. {move.symbol}
                      </Text>
                      {' '}({move.row}, {move.col})
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(move.timestamp).format('HH:mm:ss')}
                    </Text>
                  </div>
                ))}
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
