'use client';

import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { menuItems, MenuItem } from '@/lib/menu-items';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Package,
  Database,
  Settings,
  FileText,
  SlidersHorizontal,
  Ruler,
  Cpu,
  Zap,
  TrendingUp,
  BarChart3,
  LineChart,
  Brain,
  Upload,
  Play,
  Search,
  Scissors,
  Image,
  Grid3X3,
  Server,
  Activity,
  Users,
  Box,
  List,
  Microscope,
  ScanLine,
  ClipboardList,
  ShieldAlert,
  LucideIcon,
} from 'lucide-react';

// 아이콘 매핑
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Package,
  Database,
  Settings,
  FileText,
  SlidersHorizontal,
  Ruler,
  Cpu,
  Zap,
  TrendingUp,
  BarChart3,
  LineChart,
  Brain,
  Upload,
  Play,
  Search,
  Scissors,
  Image,
  Grid3X3,
  Server,
  Activity,
  Users,
  Box,
  List,
  Microscope,
  ScanLine,
  ClipboardList,
  ShieldAlert,
};

// Sidebar context for sharing state
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

// 아이콘 렌더링 헬퍼
function MenuIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = iconMap[name];
  if (!Icon) return <span className={className}>•</span>;
  return <Icon className={className} />;
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState<string[]>(['learning']); // 기본으로 'AI 학습 관리' 열림
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();

  const toggleMenu = (menuId: string) => {
    setOpenMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isMenuOpen = openMenus.includes(item.id);
    const active = isActive(item.href);

    // 접힌 상태에서는 하위 메뉴 표시 안함
    if (isCollapsed && hasChildren) {
      return (
        <li key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center justify-center px-2 py-2.5 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded-lg transition-colors"
            title={item.label}
          >
            <MenuIcon name={item.icon} className="w-5 h-5" />
          </button>
        </li>
      );
    }

    if (hasChildren) {
      return (
        <li key={item.id} className="mb-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <MenuIcon name={item.icon} className="w-5 h-5" />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </div>
            {!isCollapsed && (
              <span className={`text-xs transition-transform ${isMenuOpen ? 'rotate-90' : ''}`}>
                ▶
              </span>
            )}
          </button>

          {isMenuOpen && !isCollapsed && item.children && (
            <ul className="mt-1 ml-4 space-y-1">
              {item.children.map((child) => renderMenuItem(child, level + 1))}
            </ul>
          )}
        </li>
      );
    }

    if (isCollapsed) {
      return (
        <li key={item.id}>
          <Link
            href={item.href || '#'}
            className={`flex items-center justify-center px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-accent-primary text-background-primary font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
            }`}
            title={item.label}
          >
            <MenuIcon name={item.icon} className="w-4 h-4" />
          </Link>
        </li>
      );
    }

    return (
      <li key={item.id}>
        <Link
          href={item.href || '#'}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
            active
              ? 'bg-accent-primary text-background-primary font-medium'
              : 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
          }`}
        >
          <MenuIcon name={item.icon} className="w-4 h-4" />
          <span>{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 left-4 z-50 lg:hidden w-10 h-10 bg-background-card border border-border rounded-lg flex items-center justify-center"
      >
        <span className="text-accent-primary">☰</span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-background-secondary border-r border-border overflow-y-auto scrollbar-thin z-50 transition-all lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'w-16' : 'w-80'}`}
      >
        {/* Logo and Toggle */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-xl font-bold">
              Inspection <span className="text-accent-primary">AI</span>
            </h2>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg bg-background-elevated hover:bg-border transition-colors"
            title={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-text-primary" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-text-primary" />
            )}
          </button>
        </div>

        {/* Menu */}
        <div className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => renderMenuItem(item))}
          </ul>
        </div>
      </nav>
    </>
  );
}
