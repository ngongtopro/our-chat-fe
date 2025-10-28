'use client'

import { useState, useEffect } from 'react'
import { Card, Row, Col, Button, Typography, List, Modal, Form, InputNumber, Input, message, Spin, Statistic, Badge, Space, Tabs, Empty, Tag, Divider } from 'antd'
import { WalletOutlined, PlusOutlined, MinusOutlined, DollarOutlined, HistoryOutlined, TrophyOutlined, SwapOutlined, GiftOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { walletAPI } from '../../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'
import { useWalletRealtime } from '@/lib/hooks/use-realtime'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { Title, Text } = Typography

interface Wallet {
  balance: number
}

interface Transaction {
  id: number
  transaction_type: string
  amount: number
  description?: string
  created_at: string
  balance_after?: number
}

interface WalletStats {
  total_transactions?: number
  total_earned?: number
}

interface AddBalanceValues {
  amount: number
  description: string
}

interface DeductBalanceValues {
  amount: number
  description: string
}

export default function WalletPage() {
  const [loading, setLoading] = useState(true)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<WalletStats>({})
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [deductModalVisible, setDeductModalVisible] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Use realtime updates
  const { balance: realtimeBalance, lastTransaction } = useWalletRealtime()

  useEffect(() => {
    loadWalletData()
  }, [])

  // Update wallet balance when realtime update arrives
  useEffect(() => {
    if (realtimeBalance !== null && wallet) {
      setWallet({ ...wallet, balance: realtimeBalance })
    }
  }, [realtimeBalance])

  // Add new transaction to the list when received via realtime
  useEffect(() => {
    if (lastTransaction) {
      setTransactions(prev => [lastTransaction, ...prev])
      // Optionally reload full data to sync stats
      loadWalletData()
    }
  }, [lastTransaction])

  const loadWalletData = async () => {
    try {
      setLoading(true)
      
      const [walletRes, transactionsRes] = await Promise.all([
        walletAPI.getWallet().catch(() => null),
        walletAPI.getTransactions().catch(() => [])
      ])

      // Try to load stats
      let walletStats: WalletStats = {}
      try {
        walletStats = await walletAPI.getStats()
      } catch (error) {
        console.log('Wallet stats not available')
      }

      setWallet(walletRes)
      setTransactions(Array.isArray(transactionsRes) ? transactionsRes : [])
      setStats(walletStats)
    } catch (error) {
      console.error('Error loading wallet data:', error)
      message.error('Không thể tải dữ liệu ví')
    } finally {
      setLoading(false)
    }
  }

  const addBalance = async (values: AddBalanceValues) => {
    try {
      setProcessing(true)
      await walletAPI.addBalance(values.amount, values.description)
      message.success('Nạp tiền thành công!')
      setAddModalVisible(false)
      // Don't need to reload, realtime will update
      // loadWalletData()
    } catch (error) {
      console.error('Error adding balance:', error)
      message.error('Không thể nạp tiền')
    } finally {
      setProcessing(false)
    }
  }

  const deductBalance = async (values: DeductBalanceValues) => {
    try {
      setProcessing(true)
      await walletAPI.deductBalance(values.amount, values.description)
      message.success('Rút tiền thành công!')
      setDeductModalVisible(false)
      // Don't need to reload, realtime will update
      // loadWalletData()
    } catch (error) {
      console.error('Error deducting balance:', error)
      message.error('Không thể rút tiền')
    } finally {
      setProcessing(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'game_win':
      case 'game_prize':
        return <TrophyOutlined style={{ color: '#52c41a', fontSize: 20 }} />
      case 'game_bet':
        return <DollarOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
      case 'game_refund':
        return <SwapOutlined style={{ color: '#1890ff', fontSize: 20 }} />
      case 'admin_add':
      case 'deposit':
        return <ArrowDownOutlined style={{ color: '#52c41a', fontSize: 20 }} />
      case 'admin_deduct':
      case 'withdraw':
        return <ArrowUpOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
      case 'bonus':
      case 'gift':
        return <GiftOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
      default:
        return <SwapOutlined style={{ color: '#8c8c8c', fontSize: 20 }} />
    }
  }

  const getTransactionType = (type: string) => {
    const types: { [key: string]: string } = {
      'game_win': 'Thắng game',
      'game_prize': 'Giải thưởng',
      'game_bet': 'Đặt cược',
      'game_refund': 'Hoàn tiền',
      'admin_add': 'Nạp tiền',
      'admin_deduct': 'Rút tiền',
      'deposit': 'Nạp tiền',
      'withdraw': 'Rút tiền',
      'bonus': 'Thưởng',
      'gift': 'Quà tặng',
      'initial': 'Số dư ban đầu'
    }
    return types[type] || type
  }

  const getTransactionColor = (amount: number) => {
    return amount >= 0 ? '#52c41a' : '#ff4d4f'
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

  if (!wallet) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <WalletOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
          <Title level={3}>Chưa có ví</Title>
          <Text type="secondary">Ví sẽ được tạo tự động khi bạn bắt đầu sử dụng</Text>
        </div>
      </Card>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <Space align="center">
          <WalletOutlined style={{ fontSize: 32, color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>Ví của tôi</Title>
        </Space>
        <Space>
          <Button 
            icon={<ReloadOutlined />}
            onClick={loadWalletData}
            loading={loading}
          >
            Làm mới
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setAddModalVisible(true)}
            size="large"
          >
            Nạp tiền
          </Button>
          <Button 
            icon={<MinusOutlined />}
            onClick={() => setDeductModalVisible(true)}
            size="large"
            danger
          >
            Rút tiền
          </Button>
        </Space>
      </div>

      {/* Wallet Balance - Main Card */}
      <Card 
        style={{ 
          marginBottom: 24, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={12}>
            <Space direction="vertical" size={8}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>
                Số dư khả dụng
              </Text>
              <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 48 }}>
                {wallet.balance.toLocaleString()} <Text style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)' }}>coins</Text>
              </Title>
            </Space>
          </Col>
          <Col xs={24} md={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card bodyStyle={{ padding: 16, textAlign: 'center' }}>
                  <Statistic
                    title="Tổng giao dịch"
                    value={stats.total_transactions || 0}
                    prefix={<HistoryOutlined />}
                    valueStyle={{ fontSize: 20 }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card bodyStyle={{ padding: 16, textAlign: 'center' }}>
                  <Statistic
                    title="Tổng thu nhập"
                    value={stats.total_earned || 0}
                    suffix="coins"
                    prefix={<TrophyOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: 20 }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Transactions */}
      <Card
        title={
          <Space>
            <HistoryOutlined />
            <Text strong>Lịch sử giao dịch</Text>
          </Space>
        }
      >
        <Tabs 
          defaultActiveKey="all"
          items={[
            {
              key: 'all',
              label: (
                <span>
                  <SwapOutlined />
                  Tất cả
                </span>
              ),
              children: (
                <List
                  dataSource={transactions}
                  locale={{ emptyText: <Empty description="Chưa có giao dịch nào" /> }}
                  renderItem={(transaction) => (
                    <List.Item
                      style={{
                        padding: '16px',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: '#fafafa',
                        border: '1px solid #f0f0f0'
                      }}
                    >
                      <List.Item.Meta
                        avatar={getTransactionIcon(transaction.transaction_type)}
                        title={
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Space>
                              <Text strong>{getTransactionType(transaction.transaction_type)}</Text>
                              <Tag color={transaction.amount >= 0 ? 'success' : 'error'}>
                                {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} coins
                              </Tag>
                            </Space>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            {transaction.description && (
                              <Text type="secondary">{transaction.description}</Text>
                            )}
                            <Space split={<Divider type="vertical" />}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {dayjs(transaction.created_at).format('DD/MM/YYYY HH:mm:ss')}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {dayjs(transaction.created_at).fromNow()}
                              </Text>
                              {transaction.balance_after !== undefined && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Số dư: {transaction.balance_after.toLocaleString()} coins
                                </Text>
                              )}
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'income',
              label: (
                <span>
                  <ArrowDownOutlined />
                  Thu nhập
                </span>
              ),
              children: (
                <List
                  dataSource={transactions.filter(t => t.amount > 0)}
                  locale={{ emptyText: <Empty description="Chưa có giao dịch thu nhập" /> }}
                  renderItem={(transaction) => (
                    <List.Item
                      style={{
                        padding: '16px',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: '#f6ffed',
                        border: '1px solid #b7eb8f'
                      }}
                    >
                      <List.Item.Meta
                        avatar={getTransactionIcon(transaction.transaction_type)}
                        title={
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>{getTransactionType(transaction.transaction_type)}</Text>
                            <Tag color="success">
                              +{transaction.amount.toLocaleString()} coins
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            {transaction.description && (
                              <Text type="secondary">{transaction.description}</Text>
                            )}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(transaction.created_at).format('DD/MM/YYYY HH:mm:ss')} • {dayjs(transaction.created_at).fromNow()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            },
            {
              key: 'expense',
              label: (
                <span>
                  <ArrowUpOutlined />
                  Chi tiêu
                </span>
              ),
              children: (
                <List
                  dataSource={transactions.filter(t => t.amount < 0)}
                  locale={{ emptyText: <Empty description="Chưa có giao dịch chi tiêu" /> }}
                  renderItem={(transaction) => (
                    <List.Item
                      style={{
                        padding: '16px',
                        borderRadius: 8,
                        marginBottom: 8,
                        background: '#fff2e8',
                        border: '1px solid #ffbb96'
                      }}
                    >
                      <List.Item.Meta
                        avatar={getTransactionIcon(transaction.transaction_type)}
                        title={
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>{getTransactionType(transaction.transaction_type)}</Text>
                            <Tag color="error">
                              {transaction.amount.toLocaleString()} coins
                            </Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            {transaction.description && (
                              <Text type="secondary">{transaction.description}</Text>
                            )}
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(transaction.created_at).format('DD/MM/YYYY HH:mm:ss')} • {dayjs(transaction.created_at).fromNow()}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )
            }
          ]}
        />
      </Card>

      {/* Add Balance Modal */}
      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#52c41a' }} />
            <Text strong>Nạp tiền vào ví</Text>
          </Space>
        }
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={addBalance}
        >
          <Form.Item
            name="amount"
            label="Số tiền"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền!' },
              { type: 'number', min: 1000, message: 'Số tiền tối thiểu là 1,000 coins' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
              placeholder="Nhập số tiền cần nạp"
              suffix="coins"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Ghi chú"
            initialValue="Nạp tiền vào ví"
          >
            <Input.TextArea 
              placeholder="Ghi chú cho giao dịch (tùy chọn)" 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setAddModalVisible(false)} size="large">
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={processing}
                icon={<PlusOutlined />}
                size="large"
              >
                Nạp tiền
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Deduct Balance Modal */}
      <Modal
        title={
          <Space>
            <MinusOutlined style={{ color: '#ff4d4f' }} />
            <Text strong>Rút tiền từ ví</Text>
          </Space>
        }
        open={deductModalVisible}
        onCancel={() => setDeductModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={deductBalance}
        >
          <Card 
            size="small" 
            style={{ marginBottom: 16, background: '#f0f5ff', borderColor: '#adc6ff' }}
          >
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Text type="secondary">Số dư hiện tại:</Text>
              <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                {wallet.balance.toLocaleString()} coins
              </Text>
            </Space>
          </Card>

          <Form.Item
            name="amount"
            label="Số tiền muốn rút"
            rules={[
              { required: true, message: 'Vui lòng nhập số tiền!' },
              { type: 'number', min: 1000, message: 'Số tiền tối thiểu là 1,000 coins' },
              { 
                validator: (_, value) => {
                  if (value && value > wallet.balance) {
                    return Promise.reject('Số dư không đủ!')
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              size="large"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value ? Number(value.replace(/\$\s?|(,*)/g, '')) : 0}
              placeholder="Nhập số tiền cần rút"
              suffix="coins"
              max={wallet.balance}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Ghi chú"
            initialValue="Rút tiền từ ví"
          >
            <Input.TextArea 
              placeholder="Ghi chú cho giao dịch (tùy chọn)" 
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setDeductModalVisible(false)} size="large">
                Hủy
              </Button>
              <Button 
                danger
                htmlType="submit" 
                loading={processing}
                icon={<MinusOutlined />}
                size="large"
              >
                Rút tiền
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
