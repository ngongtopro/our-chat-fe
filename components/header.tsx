"use client";

import { Layout, Avatar, Dropdown, Button, Space } from 'antd';
import { UserOutlined, LogoutOutlined, InfoCircleOutlined, WalletOutlined, LoginOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/auth-context';

const { Header } = Layout;

const HeaderComponent = () => {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: '1',
      label: 'Thông tin cá nhân',
      icon: <InfoCircleOutlined />,
      onClick: () => router.push('/profile'),
    },
    {
      key: '2',
      label: 'Ví cá nhân',
      icon: <WalletOutlined />,
      onClick: () => router.push('/wallet'),
    },
    {
      key: '3',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  const renderUserSection = () => {
    if (isLoading) {
      return (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#40a9ff' }} />
          <span style={{ color: '#fff', fontSize: '16px' }}>Đang tải...</span>
        </Space>
      );
    }

    if (user) {
      return (
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Button type="text" style={{ padding: 0, height: 'auto' }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#40a9ff' }} />
              <span style={{ color: '#fff', fontSize: '16px' }}>
                {user.first_name} {user.last_name}
              </span>
            </Space>
          </Button>
        </Dropdown>
      );
    }

    return (
      <Space>
        <Link href="/auth/register">
          <Button>
            Đăng ký
          </Button>
        </Link>
        <Link href="/auth/login">
          <Button type="primary" icon={<LoginOutlined />}>
            Đăng nhập
          </Button>
        </Link>
      </Space>
    );
  };

  return (
    <Header
      style={{
        backgroundColor: user ? '#1890ff' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: user ? 'none' : 'blur(10px)',
        padding: '0 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px',
        position: user ? 'static' : 'fixed',
        top: user ? 'auto' : 0,
        width: '100%',
        zIndex: 1000,
        borderBottom: user ? 'none' : '1px solid #f0f0f0',
      }}
    >
      <Link href="/">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ 
            color: user ? '#fff' : '#1890ff', 
            fontSize: '20px', 
            fontWeight: 'bold' 
          }}>
            <Image
              src="/logo.png"
              alt="Chat App Logo"
              width={40}
              height={40}
              style={{ marginRight: '12px' }}
            />
            Love Chat
          </span>
        </div>
      </Link>
      {renderUserSection()}
    </Header>
  );
};

export default HeaderComponent;