"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';
import { useAuth } from '../contexts/auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute = ({ children, redirectTo = '/auth/login' }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if loading is complete and still no user
    if (!isLoading && !user) {
      router.replace(redirectTo); // Use replace to avoid back button issues
    } else if (user) {
    } else if (isLoading) {
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading spinner while auth is initializing
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div style={{ color: '#666' }}>Đang xác thực...</div>
      </div>
    );
  }

  // If we have user, show content
  if (user) {
    return <>{children}</>;
  }

  // No user and not loading - will redirect via useEffect, show nothing
  return null;
};

export default ProtectedRoute;
