'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'operator' | 'engineer' | 'admin'>('operator');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 사용자 정보를 localStorage에 저장
    const user = {
      id: userId,
      name: userId, // ID를 이름으로 사용 (실제로는 서버에서 받아와야 함)
      role: activeTab, // operator, engineer, admin
      loginTime: new Date().toISOString()
    };

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true');

    // TODO: 실제 서버 인증 API 호출 구현
    // const response = await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ userId, password, role: activeTab }) });

    // 대시보드로 이동
    router.push('/dashboard');
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        @keyframes waveFlow {
          0% {
            background-position: 0% 0%;
            transform: translateY(0);
          }
          50% {
            background-position: 100% 0%;
            transform: translateY(-15px);
          }
          100% {
            background-position: 0% 0%;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '40px',
        position: 'relative',
        background: 'linear-gradient(135deg, #0F1117 0%, #1a1d29 100%)',
      }}>
        {/* Background glow effect */}
        <div style={{
          content: '',
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(0, 227, 174, 0.05) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Login Card Wrapper */}
        <div style={{
          display: 'flex',
          maxWidth: '1100px',
          width: '100%',
          height: '600px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* Left Panel - Brand Section */}
          <div style={{
            flex: 1,
            background: 'linear-gradient(135deg, #006B54 0%, #00A884 50%, #00C8A4 100%)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '50px',
            overflow: 'hidden',
          }}>
            {/* Radial gradient overlay */}
            <div style={{
              content: '',
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.06) 0%, transparent 40%)',
              opacity: 0.7,
              zIndex: 0,
            }} />

            {/* Wave animation layer */}
            <div style={{
              content: '',
              position: 'absolute',
              bottom: '-5%',
              left: '-5%',
              width: '110%',
              height: '75%',
              backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" preserveAspectRatio="none"><defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:rgb(0,200,150);stop-opacity:0.15" /><stop offset="50%" style="stop-color:rgb(0,230,180);stop-opacity:0.25" /><stop offset="100%" style="stop-color:rgb(0,200,150);stop-opacity:0.15" /></linearGradient></defs><path d="M0,300 C150,200 300,400 450,300 C600,200 750,400 900,300 C1050,200 1200,300 1200,300 L1200,600 L0,600 Z" fill="url(%23grad1)" opacity="0.6"/><path d="M0,350 C200,250 400,450 600,350 C800,250 1000,450 1200,350 L1200,600 L0,600 Z" fill="rgba(255,255,255,0.12)" opacity="0.5"/><path d="M0,400 C250,320 500,480 750,400 C1000,320 1200,400 1200,400 L1200,600 L0,600 Z" fill="rgba(255,255,255,0.08)" opacity="0.7"/></svg>')`,
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 0%',
              backgroundRepeat: 'no-repeat',
              animation: 'waveFlow 25s ease-in-out infinite',
              zIndex: 0,
            }} />

            {/* Brand Content */}
            <div style={{
              position: 'relative',
              zIndex: 1,
            }}>
              <h1 style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: '56px',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '16px',
                letterSpacing: '-1px',
              }}>
                IX Solution
              </h1>
              <p style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                fontSize: '18px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 400,
                lineHeight: 1.6,
              }}>
                Creating New Value From Digital Technology
              </p>
            </div>

            {/* Bottom Logo */}
            <div style={{
              position: 'relative',
              zIndex: 1,
              alignSelf: 'flex-start',
            }}>
              <span style={{
                display: 'inline-block',
                backgroundColor: '#121212',
                padding: '10px 8px 6px 10px',
                borderRadius: '4px',
                fontSize: '18px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '1.5px',
                borderBottom: '4px solid #00E676',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}>
                IX
              </span>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div style={{
            flex: 1,
            background: '#2A2D3E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '50px',
          }}>
            <div style={{
              background: 'transparent',
              width: '100%',
              maxWidth: '420px',
              position: 'relative',
              zIndex: 1,
            }}>
              {/* Login Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '32px',
              }}>
                {/* Logo Badge */}
                <div style={{
                  display: 'inline-block',
                  background: 'linear-gradient(135deg, #00E3AE, #00b894)',
                  padding: '8px 24px',
                  borderRadius: '20px',
                  marginBottom: '20px',
                  boxShadow: '0 4px 12px rgba(0, 227, 174, 0.3)',
                }}>
                  <span style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#0F1117',
                    letterSpacing: '0.5px',
                  }}>
                    PCB AI
                  </span>
                </div>

                <h2 style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  marginBottom: '6px',
                }}>
                  PCB Inspection AI
                </h2>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 400,
                }}>
                  Edge AI Platform
                </p>
              </div>

              {/* Role Selector */}
              <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '28px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '4px',
                borderRadius: '8px',
              }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('operator')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: 'none',
                    background: activeTab === 'operator' ? 'linear-gradient(135deg, #00E3AE, #00b894)' : 'transparent',
                    color: activeTab === 'operator' ? '#0F1117' : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all .3s ease',
                    boxShadow: activeTab === 'operator' ? '0 2px 8px rgba(0, 227, 174, .3)' : 'none',
                  }}
                >
                  작업자
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('engineer')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: 'none',
                    background: activeTab === 'engineer' ? 'linear-gradient(135deg, #00E3AE, #00b894)' : 'transparent',
                    color: activeTab === 'engineer' ? '#0F1117' : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all .3s ease',
                    boxShadow: activeTab === 'engineer' ? '0 2px 8px rgba(0, 227, 174, .3)' : 'none',
                  }}
                >
                  엔지니어
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    border: 'none',
                    background: activeTab === 'admin' ? 'linear-gradient(135deg, #00E3AE, #00b894)' : 'transparent',
                    color: activeTab === 'admin' ? '#0F1117' : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all .3s ease',
                    boxShadow: activeTab === 'admin' ? '0 2px 8px rgba(0, 227, 174, .3)' : 'none',
                  }}
                >
                  관리자
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '8px',
                  }}>
                    사용자 ID
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="BT"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 400,
                      transition: 'all .3s ease',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '8px',
                  }}>
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="****"
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: 400,
                      transition: 'all .3s ease',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: 'linear-gradient(135deg, #00E3AE, #00b894)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#0F1117',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all .3s ease',
                    boxShadow: '0 4px 12px rgba(0, 227, 174, .3)',
                    marginTop: '8px',
                  }}
                >
                  로그인
                </button>
              </form>

              {/* Footer */}
              <div style={{
                textAlign: 'center',
                marginTop: '28px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.5)',
              }}>
                <p>&copy; PCB Inspection AI Edge System v2.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
