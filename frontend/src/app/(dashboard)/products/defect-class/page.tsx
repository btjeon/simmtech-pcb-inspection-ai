'use client';

import { useState } from 'react';
import { Search, Plus, RefreshCw, Download, Settings, MoreVertical } from 'lucide-react';

// Mock data based on screenshot (클래스 관리)
const mockDefectClasses = [
  { id: 1, area: 'BONDPAD', defectName: 'ALIGN과검', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 2, area: 'BALLLAND', defectName: 'ALIGN과검', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 3, area: '원소재', defectName: 'ALIGN과검', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 4, area: 'PSR', defectName: 'ALIGN과검', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 5, area: '기타인식키', defectName: '기타인식키_양품', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 6, area: '십자인식키', defectName: '십자인식키_양품', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 7, area: '기타인식키', defectName: '기타인식키_불량', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 8, area: '십자인식키', defectName: '십자인식키_불량', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 9, area: 'BONDPAD', defectName: '영상흔들림', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 10, area: '십자인식키', defectName: '영상흔들림', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 11, area: 'BONDPAD', defectName: 'BRIGHT', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 12, area: 'BALLLAND', defectName: 'BRIGHT', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 13, area: 'BALLLAND', defectName: 'DARK', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 14, area: 'BONDPAD', defectName: 'PSRSHIFT', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 15, area: '십자인식키', defectName: 'PSRSHIFT', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 16, area: 'BONDPAD', defectName: '리드폭미달', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 17, area: 'BONDPAD', defectName: '리드폭초과', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 18, area: '원소재', defectName: 'AOIMARKING', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 19, area: '원소재', defectName: 'RAIL부불량', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
  { id: 20, area: 'BONDPAD', defectName: 'BBTMARKING', description: '-', status: '활성', createdAt: '2026-01-21 17:56:57' },
];

export default function DefectClassPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = mockDefectClasses.filter(item =>
    item.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.defectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = 45; // Total from screenshot
  const totalPages = Math.ceil(totalItems / pageSize);

  const toggleSelectAll = () => {
    if (selectedRows.length === filteredData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map(item => item.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Area별 불량명 클래스 관리</h1>
          <p className="text-muted-foreground mt-1">Defect Class Management by Area</p>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="전체 검색 (영역, 불량명, 설명 등)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-4 h-4" />
              <span>클래스 추가</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              <span>JSON Import</span>
            </button>
            <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            <button className="p-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === filteredData.length && filteredData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    ID
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    영역
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    불량명
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    설명
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    상태
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    생성일시
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    작업
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">{item.id}</td>
                  <td className="px-4 py-3 text-sm">{item.area}</td>
                  <td className="px-4 py-3 text-sm">{item.defectName}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-cyan-400 hover:text-cyan-300 text-sm">수정</button>
                      <button className="text-red-400 hover:text-red-300 text-sm">삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            총 {totalItems}개
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-50"
            >
              &lt;
            </button>
            {[1, 2, 3].map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded ${currentPage === page ? 'bg-cyan-500 text-white' : 'border border-border hover:bg-muted'}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-50"
            >
              &gt;
            </button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="ml-4 px-2 py-1 bg-background border border-border rounded text-sm"
            >
              <option value={20}>20 / 페이지</option>
              <option value={50}>50 / 페이지</option>
              <option value={100}>100 / 페이지</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
