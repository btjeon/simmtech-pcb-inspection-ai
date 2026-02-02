'use client';

import { useState } from 'react';
import {
  Cpu,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Server
} from 'lucide-react';

// AI 추론 서버 설정 타입
interface AIServerConfig {
  id: number;
  serverName: string;
  serverAddress: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 목업 데이터
const mockAIServers: AIServerConfig[] = [
  {
    id: 1,
    serverName: 'AI-Inference-01',
    serverAddress: 'http://192.168.1.201:8080',
    description: '메인 추론 서버 - GPU Tesla V100 x 4',
    isActive: true,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-15 14:30:00'
  },
  {
    id: 2,
    serverName: 'AI-Inference-02',
    serverAddress: 'http://192.168.1.202:8080',
    description: '보조 추론 서버 - GPU RTX 3090 x 2',
    isActive: true,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-15 14:30:00'
  },
  {
    id: 3,
    serverName: 'AI-Inference-03',
    serverAddress: 'http://192.168.1.203:8080',
    description: '테스트 추론 서버 - GPU RTX 3080',
    isActive: false,
    createdAt: '2025-01-10 09:00:00',
    updatedAt: '2025-01-12 11:20:00'
  },
  {
    id: 4,
    serverName: 'AI-Training-01',
    serverAddress: 'http://192.168.1.210:8080',
    description: '학습 전용 서버 - GPU A100 x 8',
    isActive: true,
    createdAt: '2025-01-11 10:30:00',
    updatedAt: '2025-01-15 14:30:00'
  },
  {
    id: 5,
    serverName: 'AI-Inference-Backup',
    serverAddress: 'http://192.168.1.205:8080',
    description: '백업 추론 서버 - GPU RTX 3090 x 2',
    isActive: true,
    createdAt: '2025-01-12 15:00:00',
    updatedAt: '2025-01-15 14:30:00'
  },
];

export default function AIServerSettingsPage() {
  const [servers, setServers] = useState(mockAIServers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState<AIServerConfig | null>(null);

  // 필터링된 서버 목록
  const filteredServers = servers.filter(server =>
    server.serverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.serverAddress.includes(searchTerm) ||
    server.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (server: AIServerConfig) => {
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

  // 통계
  const activeCount = servers.filter(s => s.isActive).length;
  const inactiveCount = servers.filter(s => !s.isActive).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">AI 추론 서버 설정</h1>
          <p className="text-gray-400 mt-1">AI 추론 서버 연결 정보를 관리합니다.</p>
        </div>
        <button
          onClick={() => { setEditingServer(null); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          새 서버 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">전체 서버</p>
              <p className="text-2xl font-bold text-gray-100">{servers.length}</p>
            </div>
            <Server className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">활성 서버</p>
              <p className="text-2xl font-bold text-green-400">{activeCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">비활성 서버</p>
              <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 검색 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="서버 이름, 주소, 설명으로 검색..."
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
            <Cpu className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-100">AI 추론 서버 목록</h2>
            <span className="text-gray-400 text-sm">({filteredServers.length}개)</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">서버 이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">서버 주소</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">설명</th>
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
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-gray-100">{server.serverName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-900 rounded text-blue-400 text-sm">{server.serverAddress}</code>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">{server.description}</td>
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
          <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-xl mx-4">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100">
                {editingServer ? 'AI 서버 수정' : '새 AI 서버 추가'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">서버 이름</label>
                <input
                  type="text"
                  defaultValue={editingServer?.serverName || ''}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="AI-Inference-XX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">서버 주소</label>
                <input
                  type="text"
                  defaultValue={editingServer?.serverAddress || ''}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://192.168.x.x:8080"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">설명</label>
                <textarea
                  defaultValue={editingServer?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="서버 설명을 입력하세요..."
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
