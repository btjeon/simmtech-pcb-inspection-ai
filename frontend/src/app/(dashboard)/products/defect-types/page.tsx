'use client';

import { useState } from 'react';
import { Search, Plus, RefreshCw, Download, Settings, MoreVertical } from 'lucide-react';

// Mock data based on screenshot (불량 유형 관리)
const mockDefectTypes = [
  { id: 1, side: 'TOP', unitDummy: 'UNIT', classInfo: 'BONDPAD - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 2, side: 'BTM', unitDummy: 'UNIT', classInfo: 'BALLLAND - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 3, side: 'TOP', unitDummy: 'DUMMY', classInfo: '원소재 - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 4, side: 'TOP', unitDummy: 'UNIT', classInfo: 'PSR - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 5, side: 'TOP', unitDummy: 'DUMMY', classInfo: 'PSR - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 6, side: 'BTM', unitDummy: 'UNIT', classInfo: 'PSR - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 7, side: 'BTM', unitDummy: 'DUMMY', classInfo: 'PSR - ALIGN과검', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 8, side: 'TOP', unitDummy: 'UNIT', classInfo: '기타인식키 - 기타인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 9, side: 'TOP', unitDummy: 'DUMMY', classInfo: '기타인식키 - 기타인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 10, side: 'BTM', unitDummy: 'UNIT', classInfo: '기타인식키 - 기타인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 11, side: 'BTM', unitDummy: 'DUMMY', classInfo: '기타인식키 - 기타인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 12, side: 'TOP', unitDummy: 'UNIT', classInfo: '십자인식키 - 십자인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 13, side: 'TOP', unitDummy: 'DUMMY', classInfo: '십자인식키 - 십자인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 14, side: 'BTM', unitDummy: 'UNIT', classInfo: '십자인식키 - 십자인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 15, side: 'BTM', unitDummy: 'DUMMY', classInfo: '십자인식키 - 십자인식키_양품', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 16, side: 'TOP', unitDummy: 'UNIT', classInfo: '기타인식키 - 기타인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 17, side: 'TOP', unitDummy: 'DUMMY', classInfo: '기타인식키 - 기타인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 18, side: 'BTM', unitDummy: 'UNIT', classInfo: '기타인식키 - 기타인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 19, side: 'BTM', unitDummy: 'DUMMY', classInfo: '기타인식키 - 기타인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 20, side: 'TOP', unitDummy: 'UNIT', classInfo: '십자인식키 - 십자인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 21, side: 'TOP', unitDummy: 'DUMMY', classInfo: '십자인식키 - 십자인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 22, side: 'BTM', unitDummy: 'UNIT', classInfo: '십자인식키 - 십자인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 23, side: 'BTM', unitDummy: 'DUMMY', classInfo: '십자인식키 - 십자인식키_불량', judgmentType: '양품/불량', specCondition: 'AND', description: '-', status: '활성' },
  { id: 24, side: 'TOP', unitDummy: 'UNIT', classInfo: 'BONDPAD - 영상흔들림', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 25, side: 'BTM', unitDummy: 'UNIT', classInfo: 'BONDPAD - 영상흔들림', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 26, side: 'TOP', unitDummy: 'UNIT', classInfo: '십자인식키 - 영상흔들림', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 27, side: 'BTM', unitDummy: 'UNIT', classInfo: '십자인식키 - 영상흔들림', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
  { id: 28, side: 'TOP', unitDummy: 'UNIT', classInfo: 'BONDPAD - BRIGHT', judgmentType: '양품', specCondition: 'AND', description: '-', status: '활성' },
];

export default function DefectTypesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = mockDefectTypes.filter(item =>
    item.side.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unitDummy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.classInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.judgmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(item => item.id));
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
          <h1 className="text-2xl font-bold text-foreground">불량 유형 관리</h1>
          <p className="text-muted-foreground mt-1">Defect Type Detail Management</p>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              placeholder="전체 검색 (Class 정보, 유닛/더미, 판정 유형 등)"
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
              <span>불량 유형 추가</span>
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
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
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
                    면
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    유닛/더미
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    Class 정보
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    판정 유형
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">
                    규격 조건
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
                    작업
                    <button className="hover:text-foreground">↕</button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
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
                  <td className="px-4 py-3 text-sm">{item.side}</td>
                  <td className="px-4 py-3 text-sm">{item.unitDummy}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400 hover:underline cursor-pointer">{item.classInfo}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.judgmentType === '양품'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {item.judgmentType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.specCondition}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.description}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      {item.status}
                    </span>
                  </td>
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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
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
