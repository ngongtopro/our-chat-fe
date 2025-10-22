"use client";

import React from 'react'
import { 
  Layout, 
  Typography, 
  Row, 
  Col, 
  Card, 
  Space, 
  Divider,
  Statistic,
  Avatar,
  theme,
  Button
} from 'antd'
import {
  MessageOutlined,
  PlayCircleOutlined,
  BugOutlined,
  WalletOutlined,
  UserOutlined,
  StarFilled
} from '@ant-design/icons'
import Link from 'next/link'
import HeroSection from '../components/HeroSection'
import { useAuth } from '../contexts/auth-context'

const { Content, Footer } = Layout
const { Title, Paragraph, Text } = Typography

export default function HomePage() {
  const { token } = theme.useToken()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const features = [
    {
      icon: <MessageOutlined style={{ fontSize: 24, color: token.colorPrimary }} />,
      title: 'Chat Realtime',
      description: 'Trò chuyện trực tuyến với bạn bè một cách nhanh chóng và an toàn',
      link: '/chat'
    },
    {
      icon: <PlayCircleOutlined style={{ fontSize: 24, color: '#40a9ff' }} />,
      title: 'Game Online',
      description: 'Chơi game Caro và nhiều trò chơi khác cùng người thân yêu',
      link: '/caro'
    },
    {
      icon: <BugOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      title: 'Trang Trại Ảo',
      description: 'Xây dựng và quản lý trang trại của riêng bạn',
      link: '/farm'
    },
    {
      icon: <WalletOutlined style={{ fontSize: 24, color: '#40a9ff' }} />,
      title: 'Ví Điện Tử',
      description: 'Quản lý tài chính cá nhân một cách dễ dàng và tiện lợi',
      link: '/wallet'
    }
  ]

  const stats = [
    { title: 'Người dùng hoạt động', value: 1000, suffix: '+' },
    { title: 'Tin nhắn mỗi ngày', value: 50000, suffix: '+' },
    { title: 'Trận game đã chơi', value: 25000, suffix: '+' },
    { title: 'Đánh giá 5 sao', value: 4.8, precision: 1, suffix: '/5' }
  ]

  const testimonials = [
    {
      avatar: <UserOutlined />,
      name: 'Nguyễn Văn A',
      comment: 'Ứng dụng rất tuyệt vời! Tôi có thể trò chuyện và chơi game với bạn bè mọi lúc.'
    },
    {
      avatar: <UserOutlined />,
      name: 'Trần Thị B',
      comment: 'Giao diện đẹp, dễ sử dụng. Đặc biệt thích tính năng trang trại ảo.'
    },
    {
      avatar: <UserOutlined />,
      name: 'Lê Minh C',
      comment: 'Ví điện tử rất tiện lợi, giúp tôi quản lý chi tiêu hiệu quả hơn.'
    }
  ]

  // Dashboard cho người dùng đã đăng nhập
  if (user) {
    return (
      <Layout>
        <Content>
          {/* Welcome Section for Logged In Users */}
          <div style={{
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #40a9ff 100%)`,
            padding: '60px 50px',
            textAlign: 'center',
            color: '#fff'
          }}>
            <Row justify="center">
              <Col xs={24} md={16}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Title level={2} style={{ color: '#fff', margin: 0 }}>
                    🎉 Chào mừng trở lại, {user.first_name}!
                  </Title>
                  <Paragraph style={{ 
                    fontSize: 16,
                    color: 'rgba(255, 255, 255, 0.9)',
                    margin: 0
                  }}>
                    Sẵn sàng khám phá những tính năng tuyệt vời của Love Chat
                  </Paragraph>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Quick Actions for Logged In Users */}
          <div style={{ padding: '60px 50px', background: '#fff' }}>
            <Row justify="center" style={{ marginBottom: 40 }}>
              <Col xs={24} md={16} style={{ textAlign: 'center' }}>
                <Title level={2}>Bắt đầu ngay</Title>
                <Paragraph style={{ fontSize: 16, color: token.colorTextSecondary }}>
                  Chọn tính năng bạn muốn sử dụng
                </Paragraph>
              </Col>
            </Row>
            
            <Row gutter={[32, 32]} justify="center">
              {features.map((feature, index) => (
                <Col key={index} xs={24} sm={12} md={6}>
                  <Link href={feature.link}>
                    <Card
                      hoverable
                      style={{ 
                        height: '100%',
                        borderRadius: 16,
                        border: `1px solid ${token.colorBorder}`
                      }}
                      styles={{ body: { 
                        padding: '32px 24px',
                        textAlign: 'center'
                      } }}
                    >
                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div style={{ 
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          background: `${token.colorPrimary}10`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto'
                        }}>
                          {feature.icon}
                        </div>
                        <Title level={4} style={{ margin: 0 }}>
                          {feature.title}
                        </Title>
                        <Paragraph style={{ 
                          margin: 0,
                          color: token.colorTextSecondary 
                        }}>
                          {feature.description}
                        </Paragraph>
                      </Space>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>

            {/* Account Info and Logout */}
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <Card style={{ maxWidth: 600, margin: '0 auto' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Title level={4}>Thông tin tài khoản</Title>
                  <Space direction="vertical">
                    <Text><strong>Tên đăng nhập:</strong> {user.username}</Text>
                    <Text><strong>Email:</strong> {user.email}</Text>
                    <Text><strong>Họ tên:</strong> {user.first_name} {user.last_name}</Text>
                  </Space>
                  <Button type="primary" danger onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </Space>
              </Card>
            </div>
          </div>
        </Content>
      </Layout>
    )
  }

  // Landing Page cho người dùng chưa đăng nhập
  return (
    <Layout className="landing-page">
      <Content style={{ marginTop: -64 }}>
        {/* Hero Section */}
        <HeroSection />

        {/* Statistics */}
        <div style={{ padding: '80px 50px', background: '#fff' }}>
          <Row gutter={[32, 32]} justify="center">
            {stats.map((stat, index) => (
              <Col key={index} xs={12} md={6}>
                <Card 
                  variant="borderless"
                  style={{ textAlign: 'center', height: '100%' }}
                  styles={{ body: { padding: '32px 16px' } }}
                >
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    precision={stat.precision}
                    suffix={stat.suffix}
                    valueStyle={{ 
                      color: token.colorPrimary,
                      fontSize: '2rem',
                      fontWeight: 'bold'
                    }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Features */}
        <div style={{ 
          padding: '80px 50px',
          background: `linear-gradient(180deg, #fff 0%, ${token.colorBgLayout} 100%)`
        }}>
          <Row justify="center" style={{ marginBottom: 60 }}>
            <Col xs={24} md={16} style={{ textAlign: 'center' }}>
              <Title level={2}>Tính năng nổi bật</Title>
              <Paragraph style={{ fontSize: 16, color: token.colorTextSecondary }}>
                Khám phá những tính năng độc đáo và thú vị của Love Chat
              </Paragraph>
            </Col>
          </Row>
          
          <Row gutter={[32, 32]} justify="center">
            {features.map((feature, index) => (
              <Col key={index} xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  style={{ 
                    height: '100%',
                    borderRadius: 16,
                    border: `1px solid ${token.colorBorder}`
                  }}
                  styles={{ body: { 
                    padding: '32px 24px',
                    textAlign: 'center'
                  } }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ 
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      background: `${token.colorPrimary}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}>
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ margin: 0 }}>
                      {feature.title}
                    </Title>
                    <Paragraph style={{ 
                      margin: 0,
                      color: token.colorTextSecondary 
                    }}>
                      {feature.description}
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Testimonials */}
        <div style={{ padding: '80px 50px', background: '#fff' }}>
          <Row justify="center" style={{ marginBottom: 60 }}>
            <Col xs={24} md={16} style={{ textAlign: 'center' }}>
              <Title level={2}>Người dùng nói gì</Title>
              <Paragraph style={{ fontSize: 16, color: token.colorTextSecondary }}>
                Cảm nhận từ những người dùng thực sự của Love Chat
              </Paragraph>
            </Col>
          </Row>
          
          <Row gutter={[32, 32]} justify="center">
            {testimonials.map((testimonial, index) => (
              <Col key={index} xs={24} md={8}>
                <Card
                  style={{ 
                    height: '100%',
                    borderRadius: 16
                  }}
                  styles={{ body: { padding: '32px 24px' } }}
                >
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Space direction="vertical" size="small">
                        <Avatar size={64} icon={testimonial.avatar} />
                        <Text strong>{testimonial.name}</Text>
                        <div>
                          {[...Array(5)].map((_, i) => (
                            <StarFilled 
                              key={i}
                              style={{ 
                                color: '#fadb14',
                                fontSize: 16,
                                marginRight: 2
                              }} 
                            />
                          ))}
                        </div>
                      </Space>
                    </div>
                    <Paragraph style={{ 
                      textAlign: 'center',
                      fontStyle: 'italic',
                      margin: 0,
                      color: token.colorTextSecondary
                    }}>
                      "{testimonial.comment}"
                    </Paragraph>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{ 
        background: '#001529',
        color: '#fff',
        padding: '40px 50px 20px'
      }}>
        <Row gutter={[32, 32]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="middle">
              <Text strong style={{ color: '#fff', fontSize: 18 }}>
                Love Chat
              </Text>
              <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Nền tảng kết nối yêu thương, tạo ra những trải nghiệm tuyệt vời cho người dùng.
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="middle">
              <Text strong style={{ color: '#fff' }}>Liên kết nhanh</Text>
              <Space direction="vertical">
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Trang chủ
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Tính năng
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Về chúng tôi
                </Text>
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="middle">
              <Text strong style={{ color: '#fff' }}>Liên hệ</Text>
              <Space direction="vertical">
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Email: hello@lovechat.com
                </Text>
                <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Hotline: 1900 xxxx
                </Text>
              </Space>
            </Space>
          </Col>
        </Row>
        
        <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        
        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            © 2024 Love Chat. All rights reserved.
          </Text>
        </div>
      </Footer>
    </Layout>
  )
}
