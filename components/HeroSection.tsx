"use client"

import React from 'react'
import { Button, Typography, Row, Col, Space } from 'antd'
import { RightOutlined, PlayCircleOutlined } from '@ant-design/icons'
import Link from 'next/link'
import { useAuth } from '../contexts/auth-context'

const { Title, Paragraph } = Typography

const HeroSection: React.FC = () => {
  const { user } = useAuth()

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      padding: '120px 50px 80px',
      color: '#fff',
      textAlign: 'center'
    }}>
      <Row justify="center">
        <Col xs={24} md={20} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={1} style={{ 
              color: '#fff', 
              fontSize: '3.5rem',
              fontWeight: 'bold',
              margin: 0,
              lineHeight: 1.2
            }}>
              Kết nối yêu thương<br />
              <span style={{ color: '#87e8de' }}>Chia sẻ niềm vui</span>
            </Title>
            
            <Paragraph style={{ 
              fontSize: '1.25rem',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '24px 0',
              lineHeight: 1.6
            }}>
              Trải nghiệm nền tảng giải trí toàn diện với chat thời gian thực,
              game online và nhiều tính năng thú vị khác
            </Paragraph>
            
            <div style={{ marginTop: '40px' }}>
              <Space size="large" wrap>
                {!user ? (
                  <>
                    <Link href="/auth/register">
                      <Button 
                        type="primary"
                        size="large"
                        icon={<RightOutlined />}
                        style={{ 
                          height: 56,
                          padding: '0 32px',
                          fontSize: 16,
                          borderRadius: 28,
                          background: '#fff',
                          borderColor: '#fff',
                          color: '#1890ff'
                        }}
                      >
                        Bắt đầu ngay
                      </Button>
                    </Link>
                    <Button 
                      ghost
                      size="large"
                      icon={<PlayCircleOutlined />}
                      style={{ 
                        height: 56,
                        padding: '0 32px',
                        fontSize: 16,
                        borderRadius: 28,
                        borderColor: '#fff',
                        color: '#fff'
                      }}
                    >
                      Xem demo
                    </Button>
                  </>
                ) : (
                  <Link href="/chat">
                    <Button 
                      type="primary"
                      size="large"
                      icon={<RightOutlined />}
                      style={{ 
                        height: 56,
                        padding: '0 32px',
                        fontSize: 16,
                        borderRadius: 28,
                        background: '#fff',
                        borderColor: '#fff',
                        color: '#1890ff'
                      }}
                    >
                      Vào Chat ngay
                    </Button>
                  </Link>
                )}
              </Space>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  )
}

export default HeroSection
