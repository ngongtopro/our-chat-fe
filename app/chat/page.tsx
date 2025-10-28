"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Row, Col, Card, List, Avatar, Input, Button, Typography, Space, Badge, Spin, App, Empty } from 'antd'
import { SendOutlined, UserOutlined, MessageOutlined, BookOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import ProtectedRoute from '../../components/ProtectedRoute'
import { apiClient } from '../../lib/api-client'
import { useChatRealtime } from '../../lib/hooks/use-realtime'
import { useAuth } from '../../contexts/auth-context'

// Add relativeTime plugin for dayjs
dayjs.extend(relativeTime)

// Interfaces
interface User {
  id: number
  username: string
  email: string
  is_online?: boolean
  first_name?: string
  last_name?: string
}

interface Message {
  id: number
  content: string
  timestamp: string
  sender: User
  is_own_message?: boolean
}

interface PrivateChat {
  id: number
  participants: User[]
  created_at: string
}

const { TextArea } = Input
const { Text } = Typography

function ChatPageContent() {
  const { message } = App.useApp()
  const { user: currentUser } = useAuth()
  const [loading, setLoading] = useState(false) // Changed to false - load UI first
  const [loadingUsers, setLoadingUsers] = useState(false) // Separate loading for users
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [currentChat, setCurrentChat] = useState<PrivateChat | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Use realtime hook for chat updates
  const { newMessage, userStatusUpdate } = useChatRealtime()

  // Handle realtime user status updates
  useEffect(() => {
    if (userStatusUpdate) {
      setUsers(prevUsers => {
        const updated = prevUsers.map(u => 
          u.id === userStatusUpdate.user_id 
            ? { ...u, is_online: userStatusUpdate.is_online }
            : u
        )
        
        // Re-sort: online users first
        updated.sort((a, b) => {
          if (a.is_online && !b.is_online) return -1
          if (!a.is_online && b.is_online) return 1
          return a.username.localeCompare(b.username)
        })
        
        return updated
      })
      
      // Show notification if selected user status changed
      if (selectedUser?.id === userStatusUpdate.user_id) {
        setSelectedUser(prev => prev ? { ...prev, is_online: userStatusUpdate.is_online } : null)
        const status = userStatusUpdate.is_online ? 'đã online' : 'đã offline'
        message.info(`${userStatusUpdate.username} ${status}`)
      }
    }
  }, [userStatusUpdate, selectedUser])

  // Handle realtime new messages
  useEffect(() => {
    if (newMessage && currentChat) {
      // Check if message belongs to current chat
      if (newMessage.chat === currentChat.id) {
        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m => m.id === newMessage.id)
          if (exists) return prev
          
          // Mark as own or other's message
          const processedMessage = {
            ...newMessage,
            is_own_message: newMessage.sender?.id === parseInt(currentUser?.id || '0')
          }
          
          return [...prev, processedMessage]
        })
      }
    }
  }, [newMessage, currentChat, currentUser])

  // Debug auth state
  useEffect(() => {
    console.log("🔍 ChatPageContent mounted")
    const token = localStorage.getItem("chat-token")
    console.log("🔑 Current token:", token ? "exists" : "missing")
    
    if (!token) {
      console.log("❌ No token found, should redirect to login")
    } else {
      console.log("✅ Token found, proceeding with chat loading")
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      // Get all user profiles which include online status
      const response = await apiClient.get<any>('/api/chat/profiles/')
      console.log('Profiles API Response:', response)
      
      // API returns paginated data: { count, next, previous, results }
      const profilesList = response.results || response
      
      // Transform profile data to User type
      let allUsers: User[] = Array.isArray(profilesList) 
        ? profilesList.map((profile: any) => ({
            id: profile.user?.id || 0,
            username: profile.user?.username || profile.name || '',
            email: profile.user?.email || '',
            is_online: profile.is_online || false,
            first_name: profile.user?.first_name || '',
            last_name: profile.user?.last_name || '',
          })).filter(u => u.id > 0) // Filter out invalid users
        : []
      
      console.log('Transformed users:', allUsers)
      
      // Sort: online users first, then by username
      allUsers.sort((a, b) => {
        if (a.is_online && !b.is_online) return -1
        if (!a.is_online && b.is_online) return 1
        return a.username.localeCompare(b.username)
      })
      
      // Add "Saved Messages" as first item (chat with yourself)
      if (currentUser) {
        const savedMessages: User = {
          id: parseInt(currentUser.id),
          username: 'Saved Messages',
          email: currentUser.email || '',
          is_online: true,
          first_name: '💾',
          last_name: 'Your Notes',
        }
        allUsers = [savedMessages, ...allUsers.filter(u => u.id !== parseInt(currentUser.id))]
      }
      
      setUsers(allUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      message.error('Không thể tải danh sách người dùng')
    } finally {
      setLoadingUsers(false)
    }
  }

  const selectUser = async (selectedUserId: string | number) => {
    try {
      setLoading(true)
      const numericUserId = typeof selectedUserId === 'string' ? parseInt(selectedUserId) : selectedUserId
      const user = users.find(u => u.id === numericUserId)
      if (!user) {
        // If users not loaded yet, try to load them first
        await loadUsers()
        const foundUser = users.find(u => u.id === numericUserId)
        if (!foundUser) {
          message.error('Không tìm thấy người dùng')
          return
        }
        setSelectedUser(foundUser)
      } else {
        setSelectedUser(user)
      }

      // Create or get existing chat
      const chatResponse = await apiClient.createPrivateChat(numericUserId)
      console.log('Chat API Response:', chatResponse)
      setCurrentChat(chatResponse.chat)

      // Load messages for this chat
      const messagesResponse = await apiClient.getMessages(chatResponse.chat.id)
      console.log('Messages API Response:', messagesResponse)
      
      // Handle paginated response or direct array
      let messagesList = Array.isArray(messagesResponse) 
        ? messagesResponse 
        : ((messagesResponse as any)?.results || [])
      
      // Mark messages as own or other's based on sender
      messagesList = messagesList.map((msg: any) => ({
        ...msg,
        is_own_message: msg.sender?.id === parseInt(currentUser?.id || '0')
      }))
      
      console.log('Processed messages:', messagesList)
      setMessages(messagesList)
      
      // Don't navigate - just load messages in right container
      // router.push(`/chat/${selectedUserId}`)
    } catch (error) {
      console.error('Error selecting user:', error)
      message.error('Không thể tải cuộc trò chuyện')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = useCallback(async () => {
    if (!messageText.trim() || !currentChat) return

    try {
      setSending(true)
      const response = await apiClient.sendMessage(currentChat.id, messageText.trim())
      
      // Don't add message here - will be added by WebSocket real-time update
      // This prevents duplicates when server broadcasts the message back
      console.log('Message sent, waiting for WebSocket confirmation:', response)
      
      setMessageText('')
    } catch (error) {
      console.error('Error sending message:', error)
      message.error('Không thể gửi tin nhắn')
    } finally {
      setSending(false)
    }
  }, [messageText, currentChat, message])

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }, [sendMessage])

  // Memoize message rendering to prevent re-render when typing
  const renderMessage = useCallback((msg: Message) => (
    <List.Item style={{ 
      border: 'none', 
      padding: '8px 0',
      display: 'flex',
      justifyContent: msg.is_own_message ? 'flex-end' : 'flex-start'
    }}>
      <div style={{
        maxWidth: '70%',
        padding: '8px 12px',
        borderRadius: '8px',
        backgroundColor: msg.is_own_message ? '#1890ff' : '#fff',
        color: msg.is_own_message ? '#fff' : '#000',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
      }}>
        <div>{msg.content}</div>
        <div style={{
          fontSize: '11px',
          marginTop: '4px',
          opacity: 0.7,
          textAlign: 'right'
        }}>
          {dayjs(msg.timestamp).format('HH:mm')}
        </div>
      </div>
    </List.Item>
  ), [])

  return (
    <Row gutter={16} className="chat-container">
      {/* Users List */}
      <Col xs={24} md={8}>
        <Card 
          title={
            <Space>
              <span>Danh sách người dùng</span>
              {users.length > 0 && (
                <Badge 
                  count={users.filter(u => u.is_online).length} 
                  style={{ backgroundColor: '#52c41a' }}
                  title="Người dùng online"
                />
              )}
            </Space>
          }
          style={{ height: '100%' }}
          styles={{ body: { padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' } }}
          loading={loadingUsers}
        >
          {users.length === 0 && !loadingUsers ? (
            <Empty 
              description="Chưa có người dùng nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ marginTop: 50 }}
            />
          ) : (
            <List
              dataSource={Array.isArray(users) ? users : []}
              renderItem={(user) => {
                const isSavedMessages = currentUser && user.id === parseInt(currentUser.id) && user.username === 'Saved Messages'
                return (
                  <List.Item
                    onClick={() => selectUser(user.id)}
                    className={`chat-user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                    style={{ 
                      cursor: 'pointer',
                      backgroundColor: isSavedMessages ? 'rgba(24, 144, 255, 0.05)' : undefined
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        isSavedMessages ? (
                          <Avatar style={{ backgroundColor: '#1890ff' }} icon={<BookOutlined />} />
                        ) : (
                          <Badge dot={user.is_online} status={user.is_online ? 'success' : 'default'}>
                            <Avatar icon={<UserOutlined />} />
                          </Badge>
                        )
                      }
                      title={
                        <span style={{ fontWeight: isSavedMessages ? 600 : 400 }}>
                          {user.username}
                        </span>
                      }
                      description={
                        isSavedMessages 
                          ? 'Lưu tin nhắn và file của bạn' 
                          : (user.is_online ? 'Đang online' : 'Offline')
                      }
                    />
                  </List.Item>
                )
              }}
            />
          )}
        </Card>
      </Col>

      {/* Chat Area */}
      <Col xs={24} md={16}>
        <Card 
          title={
            selectedUser ? (
              <Space>
                {currentUser && selectedUser.id === parseInt(currentUser.id) && selectedUser.username === 'Saved Messages' ? (
                  <Avatar style={{ backgroundColor: '#1890ff' }} icon={<BookOutlined />} />
                ) : (
                  <Avatar icon={<UserOutlined />} />
                )}
                <span>{selectedUser.username}</span>
                {!(currentUser && selectedUser.id === parseInt(currentUser.id) && selectedUser.username === 'Saved Messages') && (
                  <Badge 
                    dot={selectedUser.is_online} 
                    status={selectedUser.is_online ? 'success' : 'default'} 
                  />
                )}
              </Space>
            ) : (
              'Chọn người dùng để bắt đầu trò chuyện'
            )
          }
          style={{ height: '100%' }}
          styles={{ 
            body: { 
              padding: 0, 
              height: 'calc(100% - 57px)', 
              display: 'flex', 
              flexDirection: 'column' 
            }
          }}
        >
          {selectedUser ? (
            <>
              {/* Messages Area */}
              <div className="chat-messages" style={{ 
                flex: 1, 
                overflow: 'auto', 
                padding: '16px',
                backgroundColor: '#f5f5f5'
              }}>
                {messages.length === 0 ? (
                  <Empty 
                    description="Chưa có tin nhắn nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ) : (
                  <List
                    dataSource={messages}
                    renderItem={renderMessage}
                  />
                )}
              </div>

              {/* Message Input */}
              <div style={{ 
                padding: '16px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fff'
              }}>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={sending}
                    disabled={!messageText.trim()}
                  >
                    Gửi
                  </Button>
                </Space.Compact>
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <MessageOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
              <Text type="secondary">Chọn một người dùng để bắt đầu trò chuyện</Text>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  )
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <App>
        <div style={{ padding: '24px' }}>
          <ChatPageContent />
        </div>
      </App>
    </ProtectedRoute>
  )
}
