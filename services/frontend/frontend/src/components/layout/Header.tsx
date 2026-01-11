'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const [userName, setUserName] = useState('사용자');
  const [userRole, setUserRole] = useState('작업자');
  const [mounted, setMounted] = useState(false);

  // 역할 한글 변환
  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'operator':
        return '작업자';
      case 'engineer':
        return '엔지니어';
      case 'admin':
        return '관리자';
      default:
        return '작업자';
    }
  };

  // 클라이언트에서만 사용자 이름 로드 (hydration 오류 방지)
  useEffect(() => {
    setMounted(true);

    if (session?.user?.name) {
      setUserName(session.user.name);
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUserName(user.name || user.username || '사용자');
          setUserRole(getRoleLabel(user.role || 'operator'));
        } catch {
          setUserName('사용자');
          setUserRole('작업자');
        }
      }
    }
  }, [session]);

  const handleLogout = () => {
    // localStorage 정리
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');

    // NextAuth 세션도 정리 (세션이 있는 경우에만)
    if (session) {
      signOut({ redirect: false }).then(() => {
        router.push('/login');
      });
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-background-secondary border-b border-border z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
            <span className="text-background-primary font-bold text-xl">AI</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-text-primary">PCB Inspection AI</h1>
            <p className="text-xs text-text-muted">Edge AI Platform v2.0</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-sm text-accent-primary font-medium">{userRole}</span>
            <span className="block text-sm text-text-secondary">{userName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-background-card hover:bg-border border border-border rounded-lg text-sm text-text-primary transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
