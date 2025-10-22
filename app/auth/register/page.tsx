"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space,
  Divider,
  Alert,
  theme
} from 'antd'
import { 
  UserOutlined, 
  LockOutlined,
  MailOutlined,
  HeartOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons'
import { useAuth } from '../../../contexts/auth-context'

const { Title, Text } = Typography

interface RegisterFormValues {
  username: string
  email: string
  firstName: string
  lastName: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register } = useAuth()
  const router = useRouter()
  const { token } = theme.useToken()
  const [form] = Form.useForm()

  const onFinish = async (values: RegisterFormValues) => {
    setLoading(true)
    setError(null)
    try {
      const success = await register(
        values.username,
        values.password,
        values.email,
        values.firstName,
        values.lastName
      )
      
      if (success) {
        router.push('/') // Redirect to home after successful registration
      } else {
        setError('Đăng ký thất bại. Vui lòng thử lại.')
      }
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1890ff 0%, #40a9ff 100%)',
      padding: 20
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 400,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Space direction="vertical" size={8}>
            <HeartOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              Love Chat
            </Title>
            <Text type="secondary">
              Tạo tài khoản mới
            </Text>
          </Space>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          autoComplete="off"
        >
          <Form.Item
            name="firstName"
            rules={[
              { required: true, message: 'Vui lòng nhập tên!' },
              { min: 2, message: 'Tên phải có ít nhất 2 ký tự!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="Tên"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="lastName"
            rules={[
              { required: true, message: 'Vui lòng nhập họ!' },
              { min: 2, message: 'Họ phải có ít nhất 2 ký tự!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="Họ"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="Tên đăng nhập"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="Email"
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="Mật khẩu"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: token.colorTextPlaceholder }} />} 
              placeholder="Xác nhận mật khẩu"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              block
              loading={loading}
              style={{
                background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
                border: 'none',
                height: 48,
                fontSize: 16
              }}
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary">Hoặc</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Đã có tài khoản?{' '}
            <Link href="/auth/login" style={{ color: '#1890ff' }}>
              Đăng nhập ngay
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}
