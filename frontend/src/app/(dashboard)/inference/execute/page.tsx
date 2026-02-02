'use client';

import { useState } from 'react';
import { Search, Plus, RefreshCw, Settings, MoreVertical, Calendar, X } from 'lucide-react';

// Mock server data
const mockServers = [
  { id: 'BGA_AI1', ip: '192.168.1.100:8000', status: '활성', collecting: 0, collectingInProgress: 0, inferring: 0, inferringInProgress: 0, complete: 2, failed: 5 },
  { id: 'BGA_AI2', ip: '192.168.1.100:8000', status: '활성', collecting: 0, collectingInProgress: 0, inferring: 0, inferringInProgress: 2, complete: 0, failed: 0 },
  { id: 'BGA_AI3', ip: '192.168.1.100:8000', status: '활성', collecting: 0, collectingInProgress: 0, inferring: 0, inferringInProgress: 0, complete: 0, failed: 0 },
  { id: 'BGA_AI4', ip: '192.168.1.100:8000', status: '비활성', collecting: 0, collectingInProgress: 0, inferring: 0, inferringInProgress: 0, complete: 0, failed: 0 },
];

// Mock request data
const mockRequests = [
  { id: '260128001', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200192226', inputCount: 1, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '1920/1920', inferProgress: 100, inferTotal: '1920/1920', createdAt: '2026-01-28 10:40:18', updatedAt: '2026-01-28 10:40:52' },
  { id: '260119001', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 8, server: 'BGA_AI2', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-19 13:33:18', updatedAt: '2026-01-19 13:34:31' },
  { id: '260113001', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 7, server: 'BGA_AI2', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-13 14:38:56', updatedAt: '2026-01-19 13:34:00' },
  { id: '260109001', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 6, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-09 10:46:13', updatedAt: '2026-01-09 10:47:14' },
  { id: '260108002', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 5, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 0, inferTotal: '-', createdAt: '2026-01-08 10:14:36', updatedAt: '2026-01-08 10:15:54' },
  { id: '260108001', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 4, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-08 10:14:28', updatedAt: '2026-01-08 10:15:23' },
  { id: '260107003', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 3, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '추론 완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-07 17:40:23', updatedAt: '2026-01-16 10:04:32' },
  { id: '260107002', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 2, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-07 17:40:13', updatedAt: '2026-01-07 17:41:06' },
  { id: '260107001', avi: 'AVI-21', model: 'B1313F2ST1-2D', lot: '200191320', inputCount: 1, server: 'BGA_AI1', serverIp: '192.168.1.100:8000', status: '추론 완료', collectProgress: 100, collectTotal: '2802/2802', inferProgress: 100, inferTotal: '2802/2802', createdAt: '2026-01-07 10:10:23', updatedAt: '2026-01-07 10:11:53' },
];

// 다크 테마용 공통 스타일
const selectStyle = "w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = "px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500";

export default function InferenceExecutePage() {
  const [startDate, setStartDate] = useState('2025-12-31');
  const [endDate, setEndDate] = useState('2026-01-30');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal form state
  const [aviSetting, setAviSetting] = useState('');
  const [productInfo, setProductInfo] = useState('');
  const [lotNumber, setLotNumber] = useState('');
  const [aiServer, setAiServer] = useState('');

  const filteredRequests = mockRequests.filter(req =>
    req.id.includes(searchTerm) ||
    req.avi.includes(searchTerm) ||
    req.lot.includes(searchTerm) ||
    req.model.includes(searchTerm)
  );

  const toggleSelectAll = () => {
    if (selectedRequests.length === filteredRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(filteredRequests.map(r => r.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedRequests(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '완료':
        return 'bg-green-500/20 text-green-400';
      case '추론 완료':
        return 'bg-cyan-500/20 text-cyan-400';
      case '진행중':
        return 'bg-yellow-500/20 text-yellow-400';
      case '실패':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getServerStatusColor = (status: string) => {
    return status === '활성' ? 'bg-green-500' : 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">AI 추론 관리 / 추론 실행 관리</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">추론 실행 관리</h1>
        </div>
      </div>

      {/* Server Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        {mockServers.map((server) => (
          <div key={server.id} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getServerStatusColor(server.status)}`} />
                <span className="font-medium">{server.id}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${server.status === '활성' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {server.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{server.ip}</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">수집 대기</span>
                <span>{server.collecting}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수집 중</span>
                <span className="text-cyan-400">{server.collectingInProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">추론 대기</span>
                <span className="text-yellow-400">{server.inferring}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">추론 중</span>
                <span className="text-cyan-400">{server.inferringInProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">추론 완료</span>
                <span>{server.complete}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">실패</span>
                <span className="text-red-400">{server.failed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center text-white text-sm font-bold">1</span>
          <h3 className="font-medium">기간 선택</h3>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">시작일</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${inputStyle} pr-10 [color-scheme:dark]`}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">종료일</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputStyle} pr-10 [color-scheme:dark]`}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground block mb-1">빠른 선택</label>
            <div className="flex gap-2">
              <button className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80">최근 7일</button>
              <button className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80">최근 30일</button>
              <button className="px-3 py-2 bg-muted rounded-lg text-sm hover:bg-muted/80">오늘</button>
            </div>
          </div>
        </div>
      </div>

      {/* Request List Filter */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center text-white text-sm font-bold">2</span>
          <h3 className="font-medium">추론 요청 목록</h3>
        </div>

        <select className={`w-72 ${selectStyle}`}>
          <option className="bg-gray-800 text-gray-100">추론 요청 선택 (다중 선택 가능)</option>
        </select>
      </div>

      {/* Request Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {/* Table Header Actions */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div />
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="전체 검색 (요청 ID, AVI 번호, Lot번호, 모델명...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-80 pl-10 pr-4 ${inputStyle} placeholder:text-gray-500`}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <button className="p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              <span>Lot 추가</span>
            </button>
            <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted">
              <MoreVertical className="w-4 h-4" />
            </button>
            <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === filteredRequests.length && filteredRequests.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">요청 ID <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">AVI 호기 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">모델명 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">Lot 번호 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">투입 횟수 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">추론 서버 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">상태 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">수집 진척률 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">추론 진척률</div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">생성일시</div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">수정일시 <span>↕</span></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRequests.includes(req.id)}
                      onChange={() => toggleSelect(req.id)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">{req.id}</td>
                  <td className="px-4 py-3 text-sm">{req.avi}</td>
                  <td className="px-4 py-3 text-sm">{req.model}</td>
                  <td className="px-4 py-3 text-sm">{req.lot}</td>
                  <td className="px-4 py-3 text-sm">{req.inputCount}</td>
                  <td className="px-4 py-3 text-sm">
                    <div>
                      <span className="text-cyan-400">{req.server}</span>
                      <p className="text-xs text-muted-foreground">{req.serverIp}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${req.collectProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{req.collectTotal}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{req.collectProgress}%</span>
                  </td>
                  <td className="px-4 py-3">
                    {req.inferTotal !== '-' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${req.inferProgress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{req.inferTotal}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{req.inferProgress}%</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{req.createdAt}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{req.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            총 9개 중 1-9개
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-50" disabled>
              &lt;
            </button>
            <span className="px-3 py-1 bg-cyan-500 text-white rounded">1</span>
            <button className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-50" disabled>
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Add Lot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-card rounded-lg border border-border w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-medium text-lg">Lot 추가</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  <span className="text-red-400">*</span> AVI 설정
                </label>
                <select
                  value={aviSetting}
                  onChange={(e) => setAviSetting(e.target.value)}
                  className={selectStyle}
                >
                  <option value="" className="bg-gray-800 text-gray-100">AVI 설정 선택</option>
                  <option value="AVI-21" className="bg-gray-800 text-gray-100">AVI-21</option>
                  <option value="AVI-22" className="bg-gray-800 text-gray-100">AVI-22</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  <span className="text-red-400">*</span> 제품 정보
                </label>
                <select
                  value={productInfo}
                  onChange={(e) => setProductInfo(e.target.value)}
                  className={selectStyle}
                >
                  <option value="" className="bg-gray-800 text-gray-100">제품 정보 선택</option>
                  <option value="B1313F2ST1-2D" className="bg-gray-800 text-gray-100">B1313F2ST1-2D</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  <span className="text-red-400">*</span> Lot 번호
                </label>
                <select
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className={selectStyle}
                >
                  <option value="" className="bg-gray-800 text-gray-100">먼저 제품 정보를 선택해주세요</option>
                  <option value="200192226" className="bg-gray-800 text-gray-100">200192226</option>
                  <option value="200191320" className="bg-gray-800 text-gray-100">200191320</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  <span className="text-red-400">*</span> AI 추론 서버 <span className="text-xs text-muted-foreground">(i)</span>
                </label>
                <select
                  value={aiServer}
                  onChange={(e) => setAiServer(e.target.value)}
                  className={selectStyle}
                >
                  <option value="" className="bg-gray-800 text-gray-100">AI 추론 서버 선택 (필수)</option>
                  <option value="BGA_AI1" className="bg-gray-800 text-gray-100">BGA_AI1 (192.168.1.100:8000)</option>
                  <option value="BGA_AI2" className="bg-gray-800 text-gray-100">BGA_AI2 (192.168.1.100:8000)</option>
                  <option value="BGA_AI3" className="bg-gray-800 text-gray-100">BGA_AI3 (192.168.1.100:8000)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-muted rounded-lg hover:bg-muted/80"
              >
                취소
              </button>
              <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
