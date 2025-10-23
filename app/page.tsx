"use client";

import React from 'react'
import { Layout, Typography, Row, Col, Card, Space, Divider, Statistic, Avatar, theme, Button } from 'antd'
import { MessageOutlined, PlayCircleOutlined, BugOutlined, WalletOutlined, UserOutlined, StarFilled } from '@ant-design/icons'
import Link from 'next/link'
import HeroSection from '../components/HeroSection'
import { useAuth } from '../contexts/auth-context'
import LandingPage from './LandingPage'

const { Content, Footer } = Layout
const { Title, Paragraph, Text } = Typography

export default function HomePage() {
  const { token } = theme.useToken()
  const { user } = useAuth()

  const features = [
    {
      icon: <MessageOutlined style={{ fontSize: 24, color: token.colorPrimary }} />,
      title: 'Chat',
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
                    Chào mừng {user.first_name || user.username}!
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
          </div>
        </Content>
      </Layout>
    )
  }

  // Landing Page cho người dùng chưa đăng nhập
  return (
    <LandingPage />
  )
}
