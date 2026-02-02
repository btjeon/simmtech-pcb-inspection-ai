'use client';

import { useState } from 'react';
import { Calendar, RefreshCw, Settings, MoreVertical } from 'lucide-react';

// 다크 테마용 공통 스타일
const selectStyle = "px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = "px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500";

// Mock data based on screenshot
const mockCollectionData = [
  { imageId: 24336, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'BTM', unitDummy: 'Unit', camId: 'CAM31', itsNo: '0375', unitCoord: '(01, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR부유이물', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24335, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM22', itsNo: '0375', unitCoord: '(18, 05)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR금속이물', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24334, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM22', itsNo: '0375', unitCoord: '(15, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR금속이물', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24333, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM22', itsNo: '0375', unitCoord: '(03, 06)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR금속이물', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24332, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM22', itsNo: '0375', unitCoord: '(02, 02)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR금속이물', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24331, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(18, 05)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24330, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(18, 05)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24329, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(18, 05)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24328, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(18, 05)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24327, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(18, 05)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24326, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(15, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24325, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(15, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24324, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(15, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24323, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(15, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24322, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(15, 03)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24321, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(05, 06)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24320, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(02, 02)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24319, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(02, 02)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24318, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(02, 02)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
  { imageId: 24317, requestId: '260128001', model: 'B1313F2ST1-2D', lot: '200192226', side: 'TOP', unitDummy: 'Unit', camId: 'CAM21', itsNo: '0375', unitCoord: '(02, 02)', imageType: 'DEF', refImage: '임용', aviDefect: 'PSR핀홀', collectDate: '2026-01-28 10:40:29' },
];

export default function InferenceStatusPage() {
  const [startDate, setStartDate] = useState('2026-01-23');
  const [endDate, setEndDate] = useState('2026-01-30');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const toggleSelectAll = () => {
    if (selectedRows.length === mockCollectionData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(mockCollectionData.map(item => item.imageId));
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
          <p className="text-sm text-muted-foreground">AI 추론 관리 / 데이터 수집 현황</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">데이터 수집 현황</h1>
        </div>
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

      {/* Data Collection Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium">데이터 수집 현황 목록</h3>
          <div className="flex items-center gap-2">
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === mockCollectionData.length && mockCollectionData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">이미지 ID <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">요청 ID <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">제품명 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">Lot명 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">Side <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">Unit/Dummy <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">CAM ID <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">ITS 번호 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">Unit 좌표 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">이미지 타입 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">REF 이미지 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">AVI 불량명 <span>↕</span></div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  <div className="flex items-center gap-2">수집 일시 <span>↕</span></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {mockCollectionData.map((item) => (
                <tr key={item.imageId} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.imageId)}
                      onChange={() => toggleSelect(item.imageId)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">{item.imageId}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400 hover:underline cursor-pointer">{item.requestId}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.model}</td>
                  <td className="px-4 py-3 text-sm">{item.lot}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-0.5 rounded text-xs ${item.side === 'TOP' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {item.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400">{item.unitDummy}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.camId}</td>
                  <td className="px-4 py-3 text-sm">{item.itsNo}</td>
                  <td className="px-4 py-3 text-sm">{item.unitCoord}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400">{item.imageType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400">{item.refImage}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{item.aviDefect}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.collectDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div className="text-sm text-muted-foreground">
            총 {mockCollectionData.length}개
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
    </div>
  );
}
