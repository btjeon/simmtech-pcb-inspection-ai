'use client';

import { useState } from 'react';
import { Calendar, RefreshCw, Settings, MoreVertical, Search, Download, Check, X, AlertCircle } from 'lucide-react';

// 다크 테마용 공통 스타일
const selectStyle = "px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500";
const inputStyle = "px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500";

// Mock inference results data
const mockInferenceResults = [
  { inferenceId: 42, requestId: '260107003', imageId: 5713, model: 'B1313F2ST1-2D', lot: '200191320', side: 'BTM', unitDummy: 'Unit', area: '십자인식키', defect: 'PSR Shift', aiJudgment: 'Class 미학습', humanJudgment: 'OK', humanClass: '십자인식키 - PSRSHIFT', aiVersion: 'v1.0.0', metrics: { area: 250.3, longest: 7.5, color_gray: 148 }, inferStart: '2026-01-26 12:55:51', inferEnd: '2026-01-26 12:55:51' },
  { inferenceId: 41, requestId: '260107003', imageId: 5712, model: 'B1313F2ST1-2D', lot: '200191320', side: 'TOP', unitDummy: 'Unit', area: '십자인식키', defect: 'PSR Shift', aiJudgment: 'Class 미학습', humanJudgment: 'OK', humanClass: '십자인식키 - PSRSHIFT', aiVersion: 'v1.0.0', metrics: { area: 180.5, longest: 6.8, color_gray: 135 }, inferStart: '2026-01-26 12:55:51', inferEnd: '2026-01-26 12:55:51' },
  { inferenceId: 40, requestId: '260107003', imageId: 5711, model: 'B1313F2ST1-2D', lot: '200191320', side: 'TOP', unitDummy: 'Unit', area: '십자인식키', defect: 'PSR Shift', aiJudgment: 'Class 미학습', humanJudgment: 'OK', humanClass: '십자인식키 - PSRSHIFT', aiVersion: 'v1.0.0', metrics: { area: 50.2, longest: 2.1, color_gray: 118 }, inferStart: '2026-01-26 12:55:51', inferEnd: '2026-01-26 12:55:51' },
  { inferenceId: 39, requestId: '260107003', imageId: 5710, model: 'B1313F2ST1-2D', lot: '200191320', side: 'TOP', unitDummy: 'Unit', area: '십자인식키', defect: 'PSR Shift', aiJudgment: 'Class 미학습', humanJudgment: 'OK', humanClass: '십자인식키 - PSRSHIFT', aiVersion: 'v1.0.0', metrics: { area: 280.5, longest: 9.2, color_gray: 148 }, inferStart: '2026-01-26 12:55:51', inferEnd: '2026-01-26 12:55:51' },
];

export default function InferenceDetailPage() {
  const [startDate, setStartDate] = useState('2026-01-23');
  const [endDate, setEndDate] = useState('2026-01-30');
  const [displayMode, setDisplayMode] = useState<'image' | 'unit'>('image');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [selectedItem, setSelectedItem] = useState<typeof mockInferenceResults[0] | null>(null);
  const [showInspectMode, setShowInspectMode] = useState(false);

  // Summary stats
  const totalImages = 20;
  const okImages = 0;
  const ngImages = 0;
  const failImages = 20;

  const toggleSelectAll = () => {
    if (selectedRows.length === mockInferenceResults.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(mockInferenceResults.map(item => item.inferenceId));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openDetail = (item: typeof mockInferenceResults[0]) => {
    setSelectedItem(item);
    setShowDetailPanel(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">AI 추론 관리 / 추론 결과 분석</p>
          <h1 className="text-2xl font-bold text-foreground mt-1">추론 결과 분석</h1>
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

      {/* Request Filter */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center text-white text-sm font-bold">2</span>
          <h3 className="font-medium">추론 요청 필터</h3>
          <span className="text-sm text-muted-foreground">선택사항</span>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">AVI 호기</label>
            <select className={`w-full ${selectStyle}`}>
              <option className="bg-gray-800 text-gray-100">AVI 호기 선택</option>
              <option className="bg-gray-800 text-gray-100">AVI-21</option>
              <option className="bg-gray-800 text-gray-100">AVI-22</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">추론 서버</label>
            <select className={`w-full ${selectStyle}`}>
              <option className="bg-gray-800 text-gray-100">추론 서버 선택</option>
              <option className="bg-gray-800 text-gray-100">BGA_AI1</option>
              <option className="bg-gray-800 text-gray-100">BGA_AI2</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">제품명</label>
            <select className={`w-full ${selectStyle}`}>
              <option className="bg-gray-800 text-gray-100">제품명 선택</option>
              <option className="bg-gray-800 text-gray-100">B1313F2ST1-2D</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Lot명</label>
            <select className={`w-full ${selectStyle}`}>
              <option className="bg-gray-800 text-gray-100">Lot명 선택</option>
              <option className="bg-gray-800 text-gray-100">200191320</option>
            </select>
          </div>
        </div>

        <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-yellow-400">팁: 필터를 선택하면 해당 조건에 맞는 요청만 표시됩니다</span>
        </div>
      </div>

      {/* Request List Filter */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-6 h-6 bg-cyan-500 rounded flex items-center justify-center text-white text-sm font-bold">3</span>
          <h3 className="font-medium">추론 요청 목록</h3>
        </div>

        <select className={`w-72 ${selectStyle}`}>
          <option className="bg-gray-800 text-gray-100">추론 요청 선택 (다중 선택 가능)</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Search className="w-4 h-4" />
            <span className="text-sm">전체 (Image)</span>
          </div>
          <p className="text-3xl font-bold">{totalImages}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Check className="w-4 h-4" />
            <span className="text-sm">OK (Image)</span>
          </div>
          <p className="text-3xl font-bold">{okImages} <span className="text-lg text-muted-foreground">({((okImages / totalImages) * 100).toFixed(1)}%)</span></p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <X className="w-4 h-4" />
            <span className="text-sm">NG (Image)</span>
          </div>
          <p className="text-3xl font-bold">{ngImages} <span className="text-lg text-muted-foreground">({((ngImages / totalImages) * 100).toFixed(1)}%)</span></p>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center gap-2 text-yellow-400 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">FAIL (Image)</span>
          </div>
          <p className="text-3xl font-bold">{failImages} <span className="text-lg text-muted-foreground">({((failImages / totalImages) * 100).toFixed(1)}%)</span></p>
        </div>
      </div>

      {/* Display Mode Toggle */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">표시 모드:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setDisplayMode('image')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              displayMode === 'image' ? 'bg-cyan-500 text-white' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Image 단위
          </button>
          <button
            onClick={() => setDisplayMode('unit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              displayMode === 'unit' ? 'bg-cyan-500 text-white' : 'bg-muted hover:bg-muted/80'
            }`}
          >
            Unit 단위
          </button>
        </div>
        <span className="text-sm text-muted-foreground">(각 추론 결과를 개별 행으로 표시)</span>
      </div>

      {/* Results Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-medium">추론 결과 목록 (Image 단위)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInspectMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
            >
              <Check className="w-4 h-4" />
              <span>검수 모드</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted">
              <Download className="w-4 h-4" />
              <span>Excel 내보내기</span>
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

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === mockInferenceResults.length && mockInferenceResults.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">추론 ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">요청 ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">이미지 ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">제품명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Lot명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Side</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Unit/Dummy</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">영역</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">불량명</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">이미지</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">AI 판정</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Human 판정</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Human Class</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">AI 모델 버전</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">측정 메트릭</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">추론 시작</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">추론 종료</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">작업</th>
              </tr>
            </thead>
            <tbody>
              {mockInferenceResults.map((item) => (
                <tr key={item.inferenceId} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(item.inferenceId)}
                      onChange={() => toggleSelect(item.inferenceId)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm">{item.inferenceId}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400 hover:underline cursor-pointer">{item.requestId}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-cyan-400 hover:underline cursor-pointer">{item.imageId}</span>
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
                  <td className="px-4 py-3 text-sm">{item.area}</td>
                  <td className="px-4 py-3 text-sm">{item.defect}</td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 bg-gray-700 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">IMG</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                      {item.aiJudgment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                      {item.humanJudgment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.humanClass}</td>
                  <td className="px-4 py-3 text-sm">{item.aiVersion}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>area: {item.metrics.area}</div>
                    <div>longest: {item.metrics.longest}</div>
                    <div>color_gray: {item.metrics.color_gray}</div>
                    <div className="text-cyan-400 cursor-pointer">+5개 더...</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.inferStart}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{item.inferEnd}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(item)}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {showDetailPanel && selectedItem && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowDetailPanel(false)}
          />
          <div className="fixed right-0 top-0 h-full w-[450px] bg-gray-900 border-l border-border shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-gray-900 z-10">
            <h3 className="font-medium">추론 결과 상세 정보</h3>
            <button onClick={() => setShowDetailPanel(false)} className="p-1 hover:bg-muted rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* Select */}
            <div>
              <select className={`w-full ${selectStyle}`}>
                <option className="bg-gray-800 text-gray-100">PSRSHIFT</option>
              </select>
            </div>

            {/* Memo */}
            <div>
              <label className="text-sm text-muted-foreground block mb-1">메모(옵션)</label>
              <textarea
                placeholder="메모를 입력하세요(선택)"
                className={`w-full h-20 ${inputStyle} resize-none`}
              />
              <p className="text-xs text-muted-foreground mt-1">현재 저장된 기간: OK / ClassId: 15</p>
            </div>

            {/* Image Tabs */}
            <div>
              <h4 className="font-medium mb-3">이미지</h4>
              <div className="flex gap-2 mb-3">
                <button className="px-3 py-1 bg-yellow-500 text-white rounded text-sm flex items-center gap-1">
                  DEF 이미지
                  <span className="w-4 h-4 bg-yellow-600 rounded text-xs flex items-center justify-center">DEF</span>
                </button>
                <button className="p-1 hover:bg-muted rounded"><RefreshCw className="w-4 h-4" /></button>
                <button className="px-3 py-1 bg-muted rounded text-sm flex items-center gap-1">
                  REF 이미지
                  <span className="w-4 h-4 bg-cyan-600 rounded text-xs flex items-center justify-center">REF</span>
                </button>
                <button className="p-1 hover:bg-muted rounded"><RefreshCw className="w-4 h-4" /></button>
                <button className="px-3 py-1 bg-muted rounded text-sm flex items-center gap-1">
                  SEG 이미지
                  <span className="w-4 h-4 bg-green-600 rounded text-xs flex items-center justify-center">SEG</span>
                </button>
              </div>
              {/* DEF Image - PCB Defect Mockup */}
              <div className="aspect-square bg-gradient-to-br from-amber-900 via-orange-800 to-yellow-900 rounded-lg relative overflow-hidden">
                {/* PCB Grid Pattern */}
                <div className="absolute inset-0 opacity-30">
                  <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="pcbGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="3" fill="#c97" />
                        <rect x="8" y="0" width="4" height="20" fill="#a75" opacity="0.5" />
                        <rect x="0" y="8" width="20" height="4" fill="#a75" opacity="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#pcbGrid)" />
                  </svg>
                </div>
                {/* Defect Highlight Area */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16">
                  <div className="w-full h-full border-2 border-red-500 rounded animate-pulse" />
                  <div className="absolute inset-2 bg-red-500/30 rounded" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                    PSR Shift
                  </div>
                </div>
                {/* Corner Info */}
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  2015, 596
                </div>
                <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded">
                  DEF
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-sm">
                <span>Side: <span className="text-yellow-400">BTM</span></span>
                <span>Unit/Dummy: <span className="text-cyan-400">Unit</span></span>
                <span className="text-muted-foreground">불량 좌표: (2015, 596) | 크기: 41</span>
              </div>
            </div>

            {/* AI Inference Info */}
            <div>
              <h4 className="font-medium mb-3">AI 추론 정보</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Keyin:</span>
                  <span className="text-yellow-400">Class 미학습</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">불량명:</span>
                  <span>PSR Shift</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">영역:</span>
                  <span>십자인식키</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">False Defect:</span>
                  <span className="text-cyan-400">false_positive</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">False Score:</span>
                  <span>0.20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Classification Defect:</span>
                  <span className="text-cyan-400">scratch</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Classification Score:</span>
                  <span>0.93</span>
                </div>
              </div>
            </div>

            {/* Judgment Rules */}
            <div>
              <h4 className="font-medium mb-3">판정 규칙</h4>
              <div className="grid grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground block">영역</span>
                  <span>십자인식키</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">불량명</span>
                  <span>PSRSHIFT</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">면</span>
                  <span>BTM</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">유닛/더미</span>
                  <span>UNIT</span>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">판정 유형:</span>
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs">양품/불량</span>
                  <span className="text-muted-foreground">(측정값 기준 판정)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">규격 조건:</span>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">AND 조건</span>
                  <span className="text-muted-foreground">(모든 기준을 만족해야 합격)</span>
                </div>
                <div className="text-muted-foreground">판정 가능: 측정값 기준 판정 없음</div>
              </div>
            </div>

            {/* Measurement Metrics */}
            <div>
              <h4 className="font-medium mb-3">측정 메트릭</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block">area</span>
                  <span className="text-lg font-bold text-cyan-400">{selectedItem.metrics.area}</span>
                  <span className="text-xs text-muted-foreground block">단위: micrometer_square</span>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block">longest</span>
                  <span className="text-lg font-bold text-cyan-400">{selectedItem.metrics.longest}</span>
                  <span className="text-xs text-muted-foreground block">단위: micrometer</span>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <span className="text-xs text-muted-foreground block">color_gray</span>
                  <span className="text-lg font-bold text-red-400">{selectedItem.metrics.color_gray}</span>
                  <span className="text-xs text-muted-foreground block">단위: None</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Inspect Mode Modal */}
      {showInspectMode && (
        <div className="fixed inset-0 bg-[#0a0a0b] z-50 flex">
          {/* Left Panel - Image List */}
          <div className="w-[380px] bg-[#1a1b1e] border-r border-gray-700 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-[#1a1b1e]">
              <h3 className="font-medium text-gray-100">검수 모드 (Image) 1/10</h3>
              <button onClick={() => setShowInspectMode(false)} className="p-1 hover:bg-gray-700 rounded text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#1a1b1e]">
              <h4 className="text-sm font-medium mb-2 text-gray-400">검수 대기열</h4>
              <select className={`w-full mb-2 ${selectStyle}`}>
                <option className="bg-gray-800 text-gray-100">260107001 (AVI-21 | B1313F2ST1-2D | 200191320 | BGA_AI1)</option>
              </select>

              {/* Keyboard shortcuts */}
              <p className="text-xs text-gray-500 mb-4">
                단축키: Q/W/E 판정 · Space 저장 후 다음 · ←→ 이전 · →다음(미처리) · Esc 닫기
              </p>

              <div className="space-y-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      i === 0
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-gray-600 hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-100">
                          ImageId: {10 - i} [CAM11_ID{200191320}_002] X={12 - i} Y={4 + i}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          DEF P=0{1450 + i * 100},0{3037 - i * 50} S={96.98 - i * 0.5} BPMB BP 0 R 원소재품
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          _J_75_90_{i + 1} · · · 0 0 0.00.png)
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                        i < 3
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {i < 3 ? '완료(OK)' : '완료(NG)'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">260107001</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-gray-700 flex items-center justify-between bg-[#1a1b1e]">
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-gray-700 text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <input type="text" value="1" className="w-10 text-center text-sm border border-gray-600 rounded bg-gray-800 text-gray-100" readOnly />
                <span className="text-sm text-gray-400">/</span>
                <span className="text-sm text-gray-400">1</span>
                <button className="p-1 rounded hover:bg-gray-700 text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <select className={`text-sm ${selectStyle} w-auto`}>
                <option className="bg-gray-800 text-gray-100">20 / 페이지</option>
              </select>
            </div>
          </div>

          {/* Center - Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1012]">
            {/* Image Header */}
            <div className="p-4 border-b border-gray-700 bg-[#1a1b1e]">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">이미지</span>
                <span className="text-cyan-400 text-sm font-medium">ImageId: 10</span>
              </div>
            </div>

            {/* Images Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-[#0f1012]">
              <div className="flex gap-6">
                {/* DEF Image */}
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-gray-100">DEF 이미지</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400">AI</span>
                    <span className="px-2 py-0.5 bg-yellow-500 text-yellow-900 text-xs font-medium rounded">Class 미학습</span>
                    <span className="text-sm text-gray-400">십자인식키 - PSR Shift</span>
                  </div>
                  {/* DEF Image Placeholder */}
                  <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                    <span className="text-gray-500 text-sm">DEF 이미지 영역</span>
                  </div>
                </div>

                {/* REF Image */}
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-gray-100">REF 이미지</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400">Human</span>
                    <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">OK</span>
                    <span className="text-sm text-gray-400">십자인식키 - PSRSHIFT</span>
                  </div>
                  {/* REF Image Placeholder */}
                  <div className="aspect-square bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                    <span className="text-gray-500 text-sm">REF 이미지 영역</span>
                  </div>
                </div>

                {/* SEG Image */}
                <div className="flex-1">
                  <h4 className="font-medium mb-2 text-gray-100">SEG 이미지</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-400 invisible">placeholder</span>
                  </div>
                  {/* SEG Image Placeholder */}
                  <div className="aspect-square bg-gray-800 rounded-lg flex flex-col items-center justify-center border border-gray-600">
                    <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500">SEG 이미지 없음</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom - Human Key-in Section */}
            <div className="p-4 bg-[#1a1b1e] border-t border-gray-700">
              <h4 className="text-sm font-medium mb-3 text-gray-100">사람 키인</h4>

              {/* Judgment Buttons */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-gray-400 w-12">판정</span>
                <div className="flex gap-2 flex-1">
                  <button className="flex-1 px-4 py-2.5 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">
                    OK (Q)
                  </button>
                  <button className="flex-1 px-4 py-2.5 bg-gray-800 border-2 border-orange-400 rounded-lg font-medium text-gray-100 hover:bg-orange-500 hover:text-white transition-colors">
                    NG (W)
                  </button>
                  <button className="flex-1 px-4 py-2.5 bg-gray-800 border-2 border-red-400 rounded-lg font-medium text-gray-100 hover:bg-red-500 hover:text-white transition-colors">
                    ERROR (E)
                  </button>
                </div>
              </div>

              {/* Area and Defect Selection */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">영역</label>
                  <select className={`w-full ${selectStyle}`}>
                    <option className="bg-gray-800 text-gray-100">십자인식키</option>
                    <option className="bg-gray-800 text-gray-100">BONDPAD</option>
                    <option className="bg-gray-800 text-gray-100">BALLLAND</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">불량명</label>
                  <select className={`w-full ${selectStyle}`}>
                    <option className="bg-gray-800 text-gray-100">PSRSHIFT</option>
                    <option className="bg-gray-800 text-gray-100">BRIGHT</option>
                    <option className="bg-gray-800 text-gray-100">DARK</option>
                  </select>
                </div>
              </div>

              {/* Memo */}
              <div className="mb-4">
                <label className="text-sm text-gray-400 block mb-1">메모(옵션)</label>
                <textarea
                  placeholder="메모(옵션)"
                  className={`w-full h-16 ${inputStyle} resize-none`}
                />
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2 mb-3">
                <button className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 hover:bg-gray-700 transition-colors">
                  이전(←)
                </button>
                <button className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 hover:bg-gray-700 transition-colors">
                  다음(→)
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
                  초기화(Delete)
                </button>
                <button className="flex-1 px-4 py-2.5 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">
                  저장(Space)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
