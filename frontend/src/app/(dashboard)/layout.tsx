'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Sidebar, SidebarProvider, useSidebar } from '@/components/layout/Sidebar';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const router = useRouter();

  // 인증 체크
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-background-primary">
      <Header />

      <div className="flex pt-16">
        <Sidebar />

        <main className={`flex-1 px-2.5 py-6 transition-all ${isCollapsed ? 'lg:ml-0' : 'lg:ml-0'}`}>
          <div className={`mx-auto ${isCollapsed ? 'max-w-full' : 'max-w-full'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
