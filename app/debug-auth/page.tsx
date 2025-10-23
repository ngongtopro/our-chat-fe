"use client"

import { useAuth } from '../../contexts/auth-context'

export default function DebugAuthPage() {
  const { user, isLoading } = useAuth()
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('chat-token') : null

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>🔍 Auth Debug Page</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Auth Context State:</h2>
        <pre>{JSON.stringify({
          isLoading,
          hasUser: !!user,
          username: user?.username || 'null',
          userId: user?.id || 'null'
        }, null, 2)}</pre>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>localStorage:</h2>
        <pre>{JSON.stringify({
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 30) + '...' : 'null'
        }, null, 2)}</pre>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h2>Expected Behavior:</h2>
        <ul>
          <li>If logged in: hasUser should be <code>true</code></li>
          <li>If logged in: hasToken should be <code>true</code></li>
          <li>isLoading should be <code>false</code> after init</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Actions:</h2>
        <button 
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
          style={{
            padding: '10px 20px',
            background: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  )
}
