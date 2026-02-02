'use client';

import { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Monitor,
  Moon,
  Sun,
  Globe,
  Save,
  RefreshCw
} from 'lucide-react';

interface UserSettings {
  displayName: string;
  email: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    browser: boolean;
    sound: boolean;
  };
  display: {
    itemsPerPage: number;
    showThumbnails: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

const defaultSettings: UserSettings = {
  displayName: '관리자',
  email: 'admin@simmtech.com',
  language: 'ko',
  theme: 'dark',
  notifications: {
    email: true,
    browser: true,
    sound: false,
  },
  display: {
    itemsPerPage: 20,
    showThumbnails: true,
    autoRefresh: true,
    refreshInterval: 30,
  },
};

export default function UserSettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = () => {
    setIsSaving(true);
    setSaveMessage('');
    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('설정이 저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1000);
  };

  const handleReset = () => {
    if (confirm('설정을 기본값으로 초기화하시겠습니까?')) {
      setSettings(defaultSettings);
      setSaveMessage('설정이 초기화되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">사용자 환경 설정</h1>
          <p className="text-gray-400 mt-1">사용자 정보 및 애플리케이션 환경을 설정합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className="text-green-400 text-sm">{saveMessage}</span>
          )}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-gray-100 border border-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            초기화
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors"
          >
            <Save className={`h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 사용자 정보 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-gray-100">사용자 정보</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">표시 이름</label>
              <input
                type="text"
                value={settings.displayName}
                onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">이메일</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">언어</label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>
        </div>

        {/* 테마 설정 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-gray-100">테마 설정</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                  settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Sun className="h-6 w-6 text-yellow-400" />
                <span className="text-sm text-gray-300">라이트</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Moon className="h-6 w-6 text-blue-400" />
                <span className="text-sm text-gray-300">다크</span>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'system' })}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                  settings.theme === 'system'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Monitor className="h-6 w-6 text-gray-400" />
                <span className="text-sm text-gray-300">시스템</span>
              </button>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-400" />
              <h2 className="text-lg font-semibold text-gray-100">알림 설정</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200">이메일 알림</p>
                <p className="text-sm text-gray-500">중요 이벤트 발생 시 이메일로 알림</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, email: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200">브라우저 알림</p>
                <p className="text-sm text-gray-500">브라우저 푸시 알림 수신</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.browser}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, browser: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200">알림음</p>
                <p className="text-sm text-gray-500">알림 발생 시 소리 재생</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.sound}
                  onChange={(e) => setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, sound: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 화면 설정 */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-green-400" />
              <h2 className="text-lg font-semibold text-gray-100">화면 설정</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">페이지당 항목 수</label>
              <select
                value={settings.display.itemsPerPage}
                onChange={(e) => setSettings({
                  ...settings,
                  display: { ...settings.display, itemsPerPage: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10개</option>
                <option value={20}>20개</option>
                <option value={50}>50개</option>
                <option value={100}>100개</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200">썸네일 표시</p>
                <p className="text-sm text-gray-500">목록에서 이미지 미리보기 표시</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.showThumbnails}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, showThumbnails: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-200">자동 새로고침</p>
                <p className="text-sm text-gray-500">데이터 자동 갱신 활성화</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.display.autoRefresh}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, autoRefresh: e.target.checked }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {settings.display.autoRefresh && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">새로고침 간격</label>
                <select
                  value={settings.display.refreshInterval}
                  onChange={(e) => setSettings({
                    ...settings,
                    display: { ...settings.display, refreshInterval: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10초</option>
                  <option value={30}>30초</option>
                  <option value={60}>1분</option>
                  <option value={300}>5분</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
