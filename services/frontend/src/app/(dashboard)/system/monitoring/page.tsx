'use client';

import { useState } from 'react';
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock
} from 'lucide-react';

// 시스템 상태 타입
type StatusType = 'normal' | 'warning' | 'error';

interface SystemStatus {
  id: string;
  name: string;
  status: StatusType;
  value: string;
  detail: string;
  lastUpdate: string;
}

// 목업 시스템 상태 데이터
const systemStatusData: SystemStatus[] = [
  { id: '1', name: 'AVI 서버 #1', status: 'normal', value: '정상', detail: 'CPU 45%, Memory 62%', lastUpdate: '2025-01-15 14:30:25' },
  { id: '2', name: 'AVI 서버 #2', status: 'normal', value: '정상', detail: 'CPU 38%, Memory 55%', lastUpdate: '2025-01-15 14:30:25' },
  { id: '3', name: 'AVI 서버 #3', status: 'warning', value: '주의', detail: 'CPU 78%, Memory 85%', lastUpdate: '2025-01-15 14:30:25' },
  { id: '4', name: 'AI 추론 서버 #1', status: 'normal', value: '정상', detail: 'GPU 52%, Memory 71%', lastUpdate: '2025-01-15 14:30:25' },
  { id: '5', name: 'AI 추론 서버 #2', status: 'normal', value: '정상', detail: 'GPU 48%, Memory 68%', lastUpdate: '2025-01-15 14:30:25' },
  { id: '6', name: 'AI 추론 서버 #3', status: 'error', value: '오류', detail: '연결 끊김', lastUpdate: '2025-01-15 14:25:10' },
  { id: '7', name: '파일 서버', status: 'normal', value: '정상', detail: '디스크 사용량 45%', lastUpdate: '2025-01-15 14:30:25' },
  { id: '8', name: '데이터베이스 서버', status: 'normal', value: '정상', detail: 'Connection Pool 62/100', lastUpdate: '2025-01-15 14:30:25' },
];

// 서비스 상태 데이터
interface ServiceStatus {
  id: string;
  name: string;
  status: StatusType;
  uptime: string;
  requests: string;
}

const serviceStatusData: ServiceStatus[] = [
  { id: '1', name: 'API Gateway', status: 'normal', uptime: '99.9%', requests: '1,234/min' },
  { id: '2', name: 'Image Processing Service', status: 'normal', uptime: '99.8%', requests: '856/min' },
  { id: '3', name: 'AI Inference Service', status: 'warning', uptime: '98.5%', requests: '423/min' },
  { id: '4', name: 'Data Sync Service', status: 'normal', uptime: '99.9%', requests: '125/min' },
  { id: '5', name: 'Notification Service', status: 'normal', uptime: '99.7%', requests: '45/min' },
];

const getStatusIcon = (status: StatusType) => {
  switch (status) {
    case 'normal':
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
};

const getStatusBadge = (status: StatusType) => {
  const baseClass = 'px-2 py-1 rounded text-xs font-medium';
  switch (status) {
    case 'normal':
      return <span className={`${baseClass} bg-green-500/20 text-green-400`}>정상</span>;
    case 'warning':
      return <span className={`${baseClass} bg-yellow-500/20 text-yellow-400`}>주의</span>;
    case 'error':
      return <span className={`${baseClass} bg-red-500/20 text-red-400`}>오류</span>;
  }
};

export default function SystemMonitoringPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // 통계 계산
  const totalServers = systemStatusData.length;
  const normalServers = systemStatusData.filter(s => s.status === 'normal').length;
  const warningServers = systemStatusData.filter(s => s.status === 'warning').length;
  const errorServers = systemStatusData.filter(s => s.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">시스템 모니터링</h1>
          <p className="text-gray-400 mt-1">시스템 및 서비스 상태를 실시간으로 모니터링합니다.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">전체 서버</p>
              <p className="text-2xl font-bold text-gray-100">{totalServers}</p>
            </div>
            <Server className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">정상</p>
              <p className="text-2xl font-bold text-green-400">{normalServers}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">주의</p>
              <p className="text-2xl font-bold text-yellow-400">{warningServers}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">오류</p>
              <p className="text-2xl font-bold text-red-400">{errorServers}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* 서버 상태 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">서버 상태</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">서버명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">상세</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">마지막 업데이트</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {systemStatusData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-gray-200">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-gray-400">{item.detail}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="h-4 w-4" />
                      <span>{item.lastUpdate}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 서비스 상태 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            <h2 className="text-lg font-semibold text-gray-100">서비스 상태</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">서비스명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">가동률</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">요청수</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {serviceStatusData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.status)}
                      <span className="text-gray-200">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-gray-400">{item.uptime}</td>
                  <td className="px-4 py-3 text-gray-400">{item.requests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
