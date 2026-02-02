'use client';

import { useState } from 'react';
import {
  HardDrive,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';

// AVI 서버 설정 타입
interface AVIServerConfig {
  id: number;
  aviNumber: string;
  fileServerIP: string;
  resultPath: string;
  lossPath: string;
  itsPath: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 목업 데이터
const mockAVIServers: AVIServerConfig[] = [
  {
    id: 1,
    aviNumber: 'AVI_01',
    fileServerIP: '192.168.1.101',
    resultPath: '/data/avi01/result',
    lossPath: '/data/avi01/loss',
    itsPath: '/data/avi01/its',
    isActive: true,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-15 14:30:00'
  },
  {
    id: 2,
    aviNumber: 'AVI_02',
    fileServerIP: '192.168.1.102',
    resultPath: '/data/avi02/result',
    lossPath: '/data/avi02/loss',
    itsPath: '/data/avi02/its',
    isActive: true,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-15 14:30:00'
  },
  {
    id: 3,
    aviNumber: 'AVI_03',
    fileServerIP: '192.168.1.103',
    resultPath: '/data/avi03/result',
    lossPath: '/data/avi03/loss',
    itsPath: '/data/avi03/its',
    isActive: true,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-15 14:30:00'
  },
  {
    id: 4,
    aviNumber: 'AVI_04',
    fileServerIP: '192.168.1.104',
    resultPath: '/data/avi04/result',
    lossPath: '/data/avi04/loss',
    itsPath: '/data/avi04/its',
    isActive: false,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-12 11:20:00'
  },
  {
    id: 5,
    aviNumber: 'AVI_05',
    fileServerIP: '192.168.1.105',
    resultPath: '/data/avi05/result',
    lossPath: '/data/avi05/loss',
    itsPath: '/data/avi05/its',
    isActive: true,
    createdAt: '2025-01-11 10:30:00',
    updatedAt: '2025-01-15 14:30:00'
  },
];

export default function EquipmentSettingsPage() {
  const [servers, setServers] = useState(mockAVIServers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<AVIServerConfig | null>(null);

  // 필터링된 서버 목록
  const filteredServers = servers.filter(server =>
    server.aviNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.fileServerIP.includes(searchTerm)
  );

  const handleEdit = (server: AVIServerConfig) => {
    setEditingServer(server);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setServers(servers.filter(s => s.id !== id));
    }
  };

  const handleToggleActive = (id: number) => {
    setServers(servers.map(s =>
      s.id === id ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') } : s
    ));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">검사 장비 환경 설정</h1>
          <p className="text-gray-400 mt-1">AVI 서버 연결 및 경로 설정을 관리합니다.</p>
        </div>
        <button
          onClick={() => { setEditingServer(null); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 서버 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="AVI 호기 또는 IP로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-100">AVI 서버 설정</h2>
            <span className="text-gray-400 text-sm">({filteredServers.length}개)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">AVI 호기</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">파일 서버 IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Result 경로</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Loss 경로</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ITS 경로</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">활성화</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">생성일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">수정일시</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredServers.map((server) => (
                <tr key={server.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3 text-gray-300">{server.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-100">{server.aviNumber}</span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-900 rounded text-blue-400 text-sm">{server.fileServerIP}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">{server.resultPath}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">{server.lossPath}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm font-mono">{server.itsPath}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(server.id)}
                      className="inline-flex items-center justify-center"
                    >
                      {server.isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{server.createdAt}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{server.updatedAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(server)}
                        className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(server.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl mx-4">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100">
                {editingServer ? 'AVI 서버 수정' : '새 AVI 서버 추가'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">AVI 호기</label>
                  <input
                    type="text"
                    defaultValue={editingServer?.aviNumber || ''}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AVI_XX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">파일 서버 IP</label>
                  <input
                    type="text"
                    defaultValue={editingServer?.fileServerIP || ''}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="192.168.x.x"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Result 경로</label>
                <input
                  type="text"
                  defaultValue={editingServer?.resultPath || ''}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/data/aviXX/result"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Loss 경로</label>
                <input
                  type="text"
                  defaultValue={editingServer?.lossPath || ''}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/data/aviXX/loss"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">ITS 경로</label>
                <input
                  type="text"
                  defaultValue={editingServer?.itsPath || ''}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/data/aviXX/its"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  defaultChecked={editingServer?.isActive ?? true}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">활성화</label>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-gray-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {editingServer ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
