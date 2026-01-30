'use client';

import { useState, useMemo } from 'react';

// ========== 영역 코드 매핑 (실제 PCB 도메인) ==========
const AREA_CODE_MAP: Record<string, string> = {
  BF: '본드핑거', BL: '볼패드', BP: '범프패드', CP: '쿠폰',
  DM: '마킹', DS: '더미스트립', EB: '에치백', FM: '인식마크',
  LD: '리드라인', MG: '몰드게이트', SR: 'SR',
};

// ========== 장비 그룹 데이터 ==========
const equipmentGroups = [
  {
    id: 'legacy',
    name: 'Legacy AFVI',
    equipments: [
      { id: 'pixel-color-5.5', name: 'Pixel Color 5.5μm', seriesKey: 'PIXEL5.5', imageCount: 12450 },
      { id: 'ati-mono-5.5', name: 'ATI Mono 5.5μm', seriesKey: 'ATI5.5', imageCount: 8920 },
      { id: 'pixel-mono-2.0', name: 'Pixel Mono 2.0μm', seriesKey: 'PIXEL2.0', imageCount: 6540 },
      { id: 'ati-mono-2.0', name: 'ATI Mono 2.0μm', seriesKey: 'ATI2.0', imageCount: 7830 },
    ],
  },
  {
    id: 'new',
    name: 'New AFVI',
    equipments: [
      { id: 'ati-color-2.0', name: 'ATI Color 2.0μm', seriesKey: 'ATI_C2.0', imageCount: 15680 },
      { id: 'pixel-color-2.0', name: 'Pixel Color 2.0μm', seriesKey: 'PIXEL_C2.0', imageCount: 11250 },
    ],
  },
];

// ========== Mock 인덱스 데이터 (영역_불량_YYMMDD 기반) ==========
interface IndexRow {
  area: string;
  areaRaw: string;
  areaCode: string;
  defect: string;
  date: string;
  dirPath: string;
  imageCount: number;
}

const mockIndex: IndexRow[] = [
  { area: '본드핑거', areaRaw: 'BF044', areaCode: 'BF', defect: 'BBT핀찍힘', date: '250125', dirPath: 'BF044_BBT핀찍힘_250125', imageCount: 342 },
  { area: '본드핑거', areaRaw: 'BF044', areaCode: 'BF', defect: 'BBT핀찍힘', date: '250118', dirPath: 'BF044_BBT핀찍힘_250118', imageCount: 287 },
  { area: '본드핑거', areaRaw: 'BF044', areaCode: 'BF', defect: '돌출', date: '250125', dirPath: 'BF044_돌출_250125', imageCount: 156 },
  { area: '볼패드', areaRaw: 'BL010', areaCode: 'BL', defect: 'AuNi미도금', date: '250125', dirPath: 'BL010_AuNi미도금_250125', imageCount: 523 },
  { area: '볼패드', areaRaw: 'BL010', areaCode: 'BL', defect: 'AuNi미도금', date: '250118', dirPath: 'BL010_AuNi미도금_250118', imageCount: 412 },
  { area: '볼패드', areaRaw: 'BL010', areaCode: 'BL', defect: '이물질', date: '250125', dirPath: 'BL010_이물질_250125', imageCount: 891 },
  { area: '볼패드', areaRaw: 'BL010', areaCode: 'BL', defect: '이물질', date: '250118', dirPath: 'BL010_이물질_250118', imageCount: 734 },
  { area: '볼패드', areaRaw: 'BL010', areaCode: 'BL', defect: '과에칭', date: '250125', dirPath: 'BL010_과에칭_250125', imageCount: 267 },
  { area: '범프패드', areaRaw: 'BP020', areaCode: 'BP', defect: '크랙', date: '250125', dirPath: 'BP020_크랙_250125', imageCount: 198 },
  { area: '범프패드', areaRaw: 'BP020', areaCode: 'BP', defect: '오염', date: '250125', dirPath: 'BP020_오염_250125', imageCount: 445 },
  { area: '범프패드', areaRaw: 'BP020', areaCode: 'BP', defect: '부족', date: '250118', dirPath: 'BP020_부족_250118', imageCount: 321 },
  { area: 'SR', areaRaw: 'SR014', areaCode: 'SR', defect: '색상상이', date: '250125', dirPath: 'SR014_색상상이_250125', imageCount: 678 },
  { area: 'SR', areaRaw: 'SR014', areaCode: 'SR', defect: '색상상이', date: '250118', dirPath: 'SR014_색상상이_250118', imageCount: 534 },
  { area: 'SR', areaRaw: 'SR014', areaCode: 'SR', defect: '핀홀', date: '250125', dirPath: 'SR014_핀홀_250125', imageCount: 389 },
  { area: '에치백', areaRaw: 'EB030', areaCode: 'EB', defect: '잔유물', date: '250125', dirPath: 'EB030_잔유물_250125', imageCount: 276 },
  { area: '에치백', areaRaw: 'EB030', areaCode: 'EB', defect: '과에칭', date: '250125', dirPath: 'EB030_과에칭_250125', imageCount: 167 },
  { area: '인식마크', areaRaw: 'FM005', areaCode: 'FM', defect: '미인식', date: '250125', dirPath: 'FM005_미인식_250125', imageCount: 234 },
  { area: '인식마크', areaRaw: 'FM005', areaCode: 'FM', defect: '변색', date: '250118', dirPath: 'FM005_변색_250118', imageCount: 189 },
  { area: '리드라인', areaRaw: 'LD008', areaCode: 'LD', defect: '단선', date: '250125', dirPath: 'LD008_단선_250125', imageCount: 456 },
  { area: '리드라인', areaRaw: 'LD008', areaCode: 'LD', defect: '단선', date: '250118', dirPath: 'LD008_단선_250118', imageCount: 312 },
  { area: '리드라인', areaRaw: 'LD008', areaCode: 'LD', defect: '쇼트', date: '250125', dirPath: 'LD008_쇼트_250125', imageCount: 543 },
  { area: '마킹', areaRaw: 'DM001', areaCode: 'DM', defect: '번짐', date: '250125', dirPath: 'DM001_번짐_250125', imageCount: 178 },
  { area: '몰드게이트', areaRaw: 'MG012', areaCode: 'MG', defect: '버', date: '250125', dirPath: 'MG012_버_250125', imageCount: 356 },
  { area: '몰드게이트', areaRaw: 'MG012', areaCode: 'MG', defect: '플래시', date: '250118', dirPath: 'MG012_플래시_250118', imageCount: 298 },
  { area: '쿠폰', areaRaw: 'CP003', areaCode: 'CP', defect: '크랙', date: '250125', dirPath: 'CP003_크랙_250125', imageCount: 145 },
  { area: '더미스트립', areaRaw: 'DS007', areaCode: 'DS', defect: '이물질', date: '250125', dirPath: 'DS007_이물질_250125', imageCount: 213 },
];

// ========== Mock 썸네일 데이터 ==========
interface ThumbItem {
  id: string;
  area: string;
  areaCode: string;
  defect: string;
  date: string;
  filename: string;
  imageCount: number;
}

function buildRepresentativeSamples(index: IndexRow[]): ThumbItem[] {
  const seen = new Set<string>();
  const samples: ThumbItem[] = [];
  for (const row of index) {
    const key = `${row.area}_${row.defect}`;
    if (!seen.has(key)) {
      seen.add(key);
      samples.push({
        id: `thumb-${samples.length}`,
        area: row.area,
        areaCode: row.areaCode,
        defect: row.defect,
        date: row.date,
        filename: `${row.areaRaw}_${row.defect}_${row.date}_001.png`,
        imageCount: row.imageCount,
      });
    }
  }
  return samples;
}

// ========== Flag 이동 로그 mock ==========
interface MoveLog {
  ts: string;
  operator: string;
  action: string;
  src: string;
  dst: string;
}

// ========== Component ==========
export default function TrainDatasetPage() {
  // Equipment group & equipment state
  const [selectedGroup, setSelectedGroup] = useState('legacy');
  const [selectedEquipment, setSelectedEquipment] = useState('pixel-color-5.5');

  const currentGroup = equipmentGroups.find(g => g.id === selectedGroup);
  const currentEquipments = currentGroup?.equipments || [];
  const maxImageCount = Math.max(...currentEquipments.map(e => e.imageCount));

  // Filter state
  const [selDate, setSelDate] = useState('(전체)');
  const [selArea, setSelArea] = useState('(전체)');
  const [selDefects, setSelDefects] = useState<string[]>([]);
  const [maxThumbs, setMaxThumbs] = useState(96);
  const [operator, setOperator] = useState('');

  // Chart state
  const [chartTab, setChartTab] = useState<'treemap' | 'pareto' | 'sunburst'>('treemap');
  const [treemapScale, setTreemapScale] = useState<'log' | 'linear'>('log');

  // Detail view state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailArea, setDetailArea] = useState('');
  const [detailDefect, setDetailDefect] = useState('');
  const [detailPage, setDetailPage] = useState(1);

  // Flag state
  const [showFlagPanel, setShowFlagPanel] = useState(false);
  const [flaggedImages, setFlaggedImages] = useState<Set<string>>(new Set());
  const [flagTargetArea, setFlagTargetArea] = useState('선택하세요');
  const [flagTargetDefect, setFlagTargetDefect] = useState('선택하세요');

  // Image viewer modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedThumb, setSelectedThumb] = useState<ThumbItem | null>(null);

  // Move logs
  const [moveLogs, setMoveLogs] = useState<MoveLog[]>([]);

  // ====== Derived filter options (cascading) ======
  const dateOptions = useMemo(() => {
    const dates = [...new Set(mockIndex.map(r => r.date))].sort().reverse();
    return ['(전체)', ...dates];
  }, []);

  const filteredByDate = useMemo(() => {
    if (selDate === '(전체)') return mockIndex;
    return mockIndex.filter(r => r.date === selDate);
  }, [selDate]);

  const areaOptions = useMemo(() => {
    const areas = [...new Set(filteredByDate.map(r => r.area))].sort();
    return ['(전체)', ...areas];
  }, [filteredByDate]);

  const defectOptions = useMemo(() => {
    const base = selArea === '(전체)' ? filteredByDate : filteredByDate.filter(r => r.area === selArea);
    return [...new Set(base.map(r => r.defect))].sort();
  }, [filteredByDate, selArea]);

  // Final filtered data
  const filtered = useMemo(() => {
    let data = filteredByDate;
    if (selArea !== '(전체)') data = data.filter(r => r.area === selArea);
    if (selDefects.length > 0) data = data.filter(r => selDefects.includes(r.defect));
    return data;
  }, [filteredByDate, selArea, selDefects]);

  // ====== Summary aggregations ======
  const pairCounts = useMemo(() => {
    const map = new Map<string, { area: string; defect: string; images: number }>();
    for (const r of filtered) {
      const key = `${r.area}_${r.defect}`;
      const existing = map.get(key);
      if (existing) existing.images += r.imageCount;
      else map.set(key, { area: r.area, defect: r.defect, images: r.imageCount });
    }
    return [...map.values()].sort((a, b) => b.images - a.images);
  }, [filtered]);

  const top10 = pairCounts.slice(0, 10);
  const totalImages = pairCounts.reduce((s, p) => s + p.images, 0);

  // Representative samples
  const samples = useMemo(() => buildRepresentativeSamples(filtered), [filtered]);

  // Detail images (mock: repeated for pagination demo)
  const detailImages = useMemo(() => {
    if (!detailOpen) return [];
    const matching = filtered.filter(r => r.area === detailArea && r.defect === detailDefect);
    const total = matching.reduce((s, r) => s + r.imageCount, 0);
    return Array.from({ length: Math.min(total, 120) }, (_, i) => ({
      id: `detail-${i}`,
      filename: `${detailArea}_${detailDefect}_${String(i + 1).padStart(4, '0')}.png`,
    }));
  }, [detailOpen, detailArea, detailDefect, filtered]);

  const detailPageSize = 36;
  const detailMaxPage = Math.max(1, Math.ceil(detailImages.length / detailPageSize));
  const detailSlice = detailImages.slice((detailPage - 1) * detailPageSize, detailPage * detailPageSize);

  // ====== Handlers ======
  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId);
    const group = equipmentGroups.find(g => g.id === groupId);
    if (group && group.equipments.length > 0) setSelectedEquipment(group.equipments[0].id);
  };

  const openDetail = (area: string, defect: string) => {
    setDetailArea(area);
    setDetailDefect(defect);
    setDetailPage(1);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetailArea('');
    setDetailDefect('');
  };

  const toggleFlag = (id: string) => {
    setFlaggedImages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFlagMove = () => {
    if (flagTargetArea === '선택하세요' || flagTargetDefect === '선택하세요') return;
    if (!operator.trim()) return;
    const now = new Date().toISOString().slice(0, 19);
    const newLogs: MoveLog[] = [...flaggedImages].map(id => ({
      ts: now,
      operator: operator.trim(),
      action: 'from_flag',
      src: `flag/${id}`,
      dst: `${flagTargetArea}_${flagTargetDefect}/${id}`,
    }));
    setMoveLogs(prev => [...prev, ...newLogs]);
    setFlaggedImages(new Set());
  };

  const downloadCSV = () => {
    const header = '순위,영역,불량유형,이미지 수\n';
    const rows = pairCounts.map((p, i) => `${i + 1},${p.area},${p.defect},${p.images}`).join('\n');
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'area_defect_counts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Common styles
  const selectCls = 'w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100';
  const optionCls = 'bg-gray-800 text-gray-100';

  // ====== Pareto cumulative ======
  const paretoData = useMemo(() => {
    const byDefect = new Map<string, number>();
    for (const r of filtered) {
      byDefect.set(r.defect, (byDefect.get(r.defect) || 0) + r.imageCount);
    }
    const sorted = [...byDefect.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const total = sorted.reduce((s, [, v]) => s + v, 0) || 1;
    let cum = 0;
    return sorted.map(([defect, images]) => {
      cum += images;
      return { defect, images, cumPct: (cum / total) * 100 };
    });
  }, [filtered]);

  const paretoMax = paretoData.length > 0 ? paretoData[0].images : 1;

  // ====== Treemap layout (simple squarified) ======
  const treemapItems = useMemo(() => {
    const items = pairCounts.slice(0, 12).map(p => ({
      label: `${p.area}_${p.defect}`,
      area: p.area,
      defect: p.defect,
      count: p.images,
      size: treemapScale === 'log' ? Math.log10(p.images + 1) : p.images,
    }));
    return items;
  }, [pairCounts, treemapScale]);

  // Simple treemap row-based layout
  const treemapRects = useMemo(() => {
    const W = 480, H = 300;
    const totalSize = treemapItems.reduce((s, i) => s + i.size, 0) || 1;
    const rects: { x: number; y: number; w: number; h: number; label: string; count: number; color: string }[] = [];
    const colors = ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#083344', '#22d3ee', '#67e8f9', '#a5f3fc', '#0c4a6e', '#0284c7', '#0369a1'];
    let y = 0;
    let i = 0;
    while (i < treemapItems.length && y < H) {
      // Take 2-3 items per row
      const rowItems = treemapItems.slice(i, i + (i % 2 === 0 ? 3 : 2));
      const rowSize = rowItems.reduce((s, it) => s + it.size, 0);
      const rowH = Math.min((rowSize / totalSize) * H * 1.2, H - y);
      let x = 0;
      for (let j = 0; j < rowItems.length; j++) {
        const w = (rowItems[j].size / rowSize) * W;
        rects.push({
          x, y, w, h: rowH,
          label: rowItems[j].label,
          count: rowItems[j].count,
          color: colors[(i + j) % colors.length],
        });
        x += w;
      }
      y += rowH;
      i += rowItems.length;
    }
    return rects;
  }, [treemapItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">학습 데이터셋 조회 및 관리</h1>
          <p className="text-muted-foreground mt-1">Train Set Image Status Viewer</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFlagPanel(!showFlagPanel)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFlagPanel ? 'bg-cyan-500 text-white' : 'bg-card border border-border hover:bg-muted'
            }`}
          >
            <span className="text-lg">🚩</span>
            <span>Flag 검토함</span>
            {flaggedImages.size > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {flaggedImages.size}
              </span>
            )}
          </button>
          <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
            데이터 새로고침
          </button>
        </div>
      </div>

      {/* Equipment Group & Equipment Selection */}
      <div className="bg-card rounded-lg border border-border p-4">
        {/* Equipment Group Tabs */}
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">장비 그룹</h2>
          <div className="flex gap-2">
            {equipmentGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleGroupChange(group.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedGroup === group.id
                    ? 'bg-cyan-500 text-white'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Tabs (Sub-level) */}
        <div className="flex items-center gap-4 mb-4 pl-4 border-l-2 border-cyan-500/30">
          <h3 className="text-sm font-medium text-muted-foreground">장비 선택</h3>
          <div className="flex gap-2 flex-wrap">
            {currentEquipments.map((equip) => (
              <button
                key={equip.id}
                onClick={() => setSelectedEquipment(equip.id)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  selectedEquipment === equip.id
                    ? 'bg-cyan-600 text-white'
                    : 'bg-muted/50 hover:bg-muted text-foreground'
                }`}
              >
                {equip.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-3 mt-4">
          <h3 className="text-sm font-medium text-muted-foreground">장비별 이미지 현황</h3>
          {currentEquipments.map((equip) => (
            <div key={equip.id} className="flex items-center gap-4">
              <div className="w-36 text-sm text-muted-foreground truncate">{equip.name}</div>
              <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden">
                <div
                  className={`h-full rounded-lg transition-all ${
                    equip.id === selectedEquipment ? 'bg-cyan-500' : 'bg-cyan-700'
                  }`}
                  style={{ width: `${(equip.imageCount / maxImageCount) * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm font-mono">{equip.imageCount.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Filter Panel */}
        <div className="col-span-3 bg-card rounded-lg border border-border p-4 space-y-4">
          <h3 className="font-medium text-foreground border-b border-border pb-2">필터</h3>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">날짜</label>
            <select
              value={selDate}
              onChange={(e) => { setSelDate(e.target.value); setSelArea('(전체)'); setSelDefects([]); }}
              className={selectCls}
            >
              {dateOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o === '(전체)' ? '(전체)' : `20${o.slice(0,2)}-${o.slice(2,4)}-${o.slice(4,6)}`}</option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">영역</label>
            <select
              value={selArea}
              onChange={(e) => { setSelArea(e.target.value); setSelDefects([]); }}
              className={selectCls}
            >
              {areaOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o}</option>
              ))}
            </select>
          </div>

          {/* Defect (multi-select via checkboxes) */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">불량 유형 (다중선택)</label>
            <div className="max-h-40 overflow-y-auto bg-gray-900/50 rounded-lg p-2 space-y-1 border border-gray-700">
              {defectOptions.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">옵션 없음</p>
              ) : defectOptions.map(d => (
                <label key={d} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-700/50 rounded cursor-pointer text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={selDefects.includes(d)}
                    onChange={(e) => {
                      if (e.target.checked) setSelDefects(prev => [...prev, d]);
                      else setSelDefects(prev => prev.filter(x => x !== d));
                    }}
                    className="w-4 h-4 accent-cyan-500"
                  />
                  {d}
                </label>
              ))}
            </div>
            {selDefects.length > 0 && (
              <button onClick={() => setSelDefects([])} className="text-xs text-cyan-400 hover:underline">
                선택 초기화
              </button>
            )}
          </div>

          {/* Max Thumbnails */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">최대 썸네일 수</label>
            <input
              type="number" value={maxThumbs}
              onChange={(e) => setMaxThumbs(Math.max(12, Math.min(300, parseInt(e.target.value) || 96)))}
              className={selectCls} min={12} max={300} step={12}
            />
            <p className="text-xs text-gray-500">갤러리 성능 보호를 위해 상한을 둡니다.</p>
          </div>

          {/* Operator */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">작업자 이름</label>
            <input
              type="text" value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="이름 (필수)"
              className={`${selectCls} placeholder:text-gray-500`}
            />
          </div>

          {/* Log download */}
          {moveLogs.length > 0 && (
            <button
              onClick={() => {
                const csv = 'ts,operator,action,src,dst\n' + moveLogs.map(l => `${l.ts},${l.operator},${l.action},${l.src},${l.dst}`).join('\n');
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'flag_moves.csv'; a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full px-3 py-2 bg-gray-700 text-gray-200 rounded-lg text-sm hover:bg-gray-600 border border-gray-600"
            >
              Flag 이동 로그 다운로드
            </button>
          )}
        </div>

        {/* Center: Chart Area */}
        <div className="col-span-5 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">불량유형 요약</h3>
            <div className="flex gap-2">
              {(['treemap', 'pareto', 'sunburst'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setChartTab(tab)}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    chartTab === tab ? 'bg-cyan-500 text-white' : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                >
                  {tab === 'treemap' ? 'Treemap' : tab === 'pareto' ? 'Pareto' : 'Sunburst'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-80">
            {/* ====== TREEMAP ====== */}
            {chartTab === 'treemap' && (
              <div className="h-full flex flex-col">
                <div className="flex gap-3 mb-2">
                  {(['log', 'linear'] as const).map(s => (
                    <button key={s} onClick={() => setTreemapScale(s)}
                      className={`px-2 py-1 rounded text-xs ${treemapScale === s ? 'bg-cyan-500 text-white' : 'bg-muted text-foreground'}`}
                    >
                      {s === 'log' ? '로그' : '선형'}
                    </button>
                  ))}
                </div>
                <svg viewBox="0 0 480 300" className="w-full flex-1">
                  {treemapRects.map((r, i) => (
                    <g key={i}>
                      <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} fill={r.color} rx="4" />
                      {r.w > 50 && r.h > 30 && (
                        <>
                          <text x={r.x + r.w / 2} y={r.y + r.h / 2 - 6} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
                            {r.label.length > 12 ? r.label.slice(0, 12) + '…' : r.label}
                          </text>
                          <text x={r.x + r.w / 2} y={r.y + r.h / 2 + 10} textAnchor="middle" fill="white" fontSize="9">
                            {r.count.toLocaleString()}
                          </text>
                        </>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            )}

            {/* ====== PARETO ====== */}
            {chartTab === 'pareto' && (
              <svg viewBox="0 0 440 300" className="w-full h-full">
                {/* Axes */}
                <line x1="50" y1="20" x2="50" y2="250" stroke="#374151" strokeWidth="1" />
                <line x1="50" y1="250" x2="420" y2="250" stroke="#374151" strokeWidth="1" />
                {/* Y-axis labels (left) */}
                {[0, 250, 500, 750, 1000].map((v, i) => (
                  <text key={i} x="45" y={250 - (v / paretoMax) * 210 + 4} textAnchor="end" fill="#9ca3af" fontSize="8">{v}</text>
                ))}
                {/* Right Y-axis: cumulative % */}
                <line x1="420" y1="20" x2="420" y2="250" stroke="#374151" strokeWidth="1" strokeDasharray="4" />
                {[0, 25, 50, 75, 100].map((v, i) => (
                  <text key={i} x="435" y={250 - (v / 100) * 210 + 4} textAnchor="start" fill="#f97316" fontSize="8">{v}%</text>
                ))}

                {/* Bars */}
                {paretoData.map((item, i) => {
                  const barW = Math.min(40, (370 / paretoData.length) - 5);
                  const x = 60 + i * (370 / paretoData.length);
                  const h = (item.images / paretoMax) * 210;
                  return (
                    <g key={i}>
                      <rect x={x} y={250 - h} width={barW} height={h} fill="#06b6d4" rx="2" />
                      <text x={x + barW / 2} y={265} textAnchor="middle" fill="#9ca3af" fontSize="7"
                        transform={`rotate(-35, ${x + barW / 2}, 265)`}>
                        {item.defect.length > 5 ? item.defect.slice(0, 5) + '…' : item.defect}
                      </text>
                    </g>
                  );
                })}

                {/* Cumulative line */}
                {paretoData.length > 0 && (
                  <polyline
                    fill="none" stroke="#f97316" strokeWidth="2.5"
                    points={paretoData.map((item, i) => {
                      const barW = Math.min(40, (370 / paretoData.length) - 5);
                      const x = 60 + i * (370 / paretoData.length) + barW / 2;
                      const y = 250 - (item.cumPct / 100) * 210;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                )}
                {paretoData.map((item, i) => {
                  const barW = Math.min(40, (370 / paretoData.length) - 5);
                  const x = 60 + i * (370 / paretoData.length) + barW / 2;
                  const y = 250 - (item.cumPct / 100) * 210;
                  return <circle key={i} cx={x} cy={y} r="3.5" fill="#f97316" />;
                })}

                {/* Legend */}
                <rect x="60" y="5" width="10" height="10" fill="#06b6d4" />
                <text x="75" y="14" fill="#9ca3af" fontSize="9">이미지 수</text>
                <line x1="130" y1="10" x2="145" y2="10" stroke="#f97316" strokeWidth="2.5" />
                <text x="150" y="14" fill="#f97316" fontSize="9">누적 비율(%)</text>
              </svg>
            )}

            {/* ====== SUNBURST ====== */}
            {chartTab === 'sunburst' && (
              <div className="h-full flex items-center justify-center">
                <svg viewBox="0 0 300 300" className="w-full h-full max-w-[280px]">
                  {/* Center */}
                  <circle cx="150" cy="150" r="30" fill="#06b6d4" />
                  <text x="150" y="147" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">전체</text>
                  <text x="150" y="160" textAnchor="middle" fill="white" fontSize="8">{totalImages.toLocaleString()}</text>

                  {/* Area segments (inner ring) */}
                  {(() => {
                    const areaCounts = new Map<string, number>();
                    for (const p of pairCounts) {
                      areaCounts.set(p.area, (areaCounts.get(p.area) || 0) + p.images);
                    }
                    const areas = [...areaCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
                    const total = areas.reduce((s, [, v]) => s + v, 0) || 1;
                    const colors = ['#0891b2', '#0e7490', '#155e75', '#164e63', '#083344', '#0c4a6e'];
                    let angle = -90;
                    return areas.map(([area, count], i) => {
                      const sweep = (count / total) * 360;
                      const startRad = (angle * Math.PI) / 180;
                      const endRad = ((angle + sweep) * Math.PI) / 180;
                      const midRad = ((angle + sweep / 2) * Math.PI) / 180;
                      const r = 80;
                      const x1 = 150 + r * Math.cos(startRad);
                      const y1 = 150 + r * Math.sin(startRad);
                      const x2 = 150 + r * Math.cos(endRad);
                      const y2 = 150 + r * Math.sin(endRad);
                      const largeArc = sweep > 180 ? 1 : 0;
                      const textR = 60;
                      const tx = 150 + textR * Math.cos(midRad);
                      const ty = 150 + textR * Math.sin(midRad);
                      const d = `M150,150 L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
                      angle += sweep;
                      return (
                        <g key={area}>
                          <path d={d} fill={colors[i]} stroke="#1a1a2e" strokeWidth="1" />
                          {sweep > 25 && (
                            <text x={tx} y={ty + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{area}</text>
                          )}
                        </g>
                      );
                    });
                  })()}
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Right: Top10 Table */}
        <div className="col-span-4 bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground">영역_불량유형 Top 10</h3>
            <button onClick={downloadCSV} className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-gray-600 border border-gray-600">
              전체 CSV 다운로드
            </button>
          </div>
          <div className="overflow-auto max-h-80">
            <table className="w-full text-sm">
              <thead className="bg-cyan-500/10 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left w-10">#</th>
                  <th className="px-2 py-2 text-left">영역</th>
                  <th className="px-2 py-2 text-left">불량유형</th>
                  <th className="px-2 py-2 text-right">이미지 수</th>
                  <th className="px-2 py-2 text-right">비율</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((item, i) => (
                  <tr key={i} className="border-b border-gray-700 hover:bg-cyan-500/5 transition-colors">
                    <td className="px-2 py-2 font-mono text-gray-400">{i + 1}</td>
                    <td className="px-2 py-2">{item.area}</td>
                    <td className="px-2 py-2">{item.defect}</td>
                    <td className="px-2 py-2 text-right font-mono">{item.images.toLocaleString()}</td>
                    <td className="px-2 py-2 text-right font-mono text-cyan-400">
                      {totalImages > 0 ? ((item.images / totalImages) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====== (영역_불량) 대표 썸네일 6열 그리드 ====== */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-foreground">
            (영역_불량) 대표 이미지 · <span className="text-cyan-400">{samples.length}</span>개 조합
          </h3>
        </div>

        <div className="grid grid-cols-6 gap-3">
          {samples.slice(0, maxThumbs).map((thumb) => (
            <div key={thumb.id} className="relative group">
              {/* Thumbnail */}
              <div
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                  flaggedImages.has(thumb.id) ? 'border-red-500' : 'border-gray-700 hover:border-cyan-500'
                }`}
                onClick={() => { setSelectedThumb(thumb); setShowImageModal(true); }}
              >
                <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <span className="text-2xl opacity-50">🖼️</span>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 rounded-lg">
                  <span className="text-xs text-white font-bold">{thumb.area}_{thumb.defect}</span>
                  <span className="text-xs text-cyan-400">{thumb.imageCount.toLocaleString()}장</span>
                </div>
              </div>

              {/* Caption */}
              <div className="text-center mt-1">
                <p className="text-xs text-gray-400 truncate">{thumb.area}_{thumb.defect}</p>
              </div>

              {/* Detail button */}
              <button
                onClick={() => openDetail(thumb.area, thumb.defect)}
                className="w-full mt-1 px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs hover:bg-cyan-600 hover:text-white transition-colors border border-gray-600"
              >
                전체 이미지 확인
              </button>

              {/* Flag button */}
              <button
                onClick={() => toggleFlag(thumb.id)}
                className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                  flaggedImages.has(thumb.id)
                    ? 'bg-red-500 text-white'
                    : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                }`}
              >
                🚩
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ====== 상세보기 (전체 이미지) ====== */}
      {detailOpen && (
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-foreground">
              🔎 전체 보기: <span className="text-cyan-400">{detailArea}_{detailDefect}</span>
              <span className="text-sm text-gray-400 ml-2">(총 {detailImages.length.toLocaleString()}장)</span>
            </h3>
            <button onClick={closeDetail} className="px-3 py-1.5 bg-muted rounded-lg hover:bg-muted/80 text-sm">
              닫기
            </button>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setDetailPage(p => Math.max(1, p - 1))}
              disabled={detailPage <= 1}
              className="px-3 py-1 bg-muted rounded hover:bg-muted/80 text-sm disabled:opacity-40"
            >
              ◀ 이전
            </button>
            <span className="text-sm font-semibold">
              Page {detailPage} / {detailMaxPage} · 총 {detailImages.length.toLocaleString()}장
            </span>
            <button
              onClick={() => setDetailPage(p => Math.min(detailMaxPage, p + 1))}
              disabled={detailPage >= detailMaxPage}
              className="px-3 py-1 bg-muted rounded hover:bg-muted/80 text-sm disabled:opacity-40"
            >
              다음 ▶
            </button>
          </div>

          {/* 6-col grid */}
          <div className="grid grid-cols-6 gap-3">
            {detailSlice.map((img) => (
              <div key={img.id} className="relative group">
                <div className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  flaggedImages.has(img.id) ? 'border-red-500' : 'border-gray-700 hover:border-cyan-500'
                }`}>
                  <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                    <span className="text-xl opacity-40">🖼️</span>
                  </div>
                </div>
                <p className="text-center text-xs text-gray-500 mt-1 truncate">{img.filename}</p>
                <button
                  onClick={() => toggleFlag(img.id)}
                  className={`absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${
                    flaggedImages.has(img.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
                  }`}
                >
                  🚩
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== Image Viewer Modal ====== */}
      {showImageModal && selectedThumb && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
          <div className="bg-card rounded-lg border border-border max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="font-medium text-foreground">{selectedThumb.filename}</h3>
                <p className="text-sm text-muted-foreground">{selectedThumb.area} / {selectedThumb.defect}</p>
              </div>
              <button onClick={() => setShowImageModal(false)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">✕</button>
            </div>
            <div className="p-4 grid grid-cols-3 gap-4">
              <div className="col-span-2 aspect-square bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-6xl opacity-50">🖼️</span>
              </div>
              <div className="space-y-4">
                <div className="bg-muted rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium">이미지 정보</h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-muted-foreground">파일명:</span><span className="text-xs">{selectedThumb.filename}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">영역:</span><span>{selectedThumb.area}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">영역코드:</span><span className="text-cyan-400 font-mono">{selectedThumb.areaCode}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">불량유형:</span><span>{selectedThumb.defect}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">날짜:</span><span>{selectedThumb.date}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">이미지 수:</span><span className="text-cyan-400">{selectedThumb.imageCount.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">분류 변경</h4>
                  <select className={selectCls}>
                    {Object.entries(AREA_CODE_MAP).map(([code, name]) => (
                      <option key={code} value={code} className={optionCls}>{name} ({code})</option>
                    ))}
                  </select>
                  <select className={selectCls}>
                    {defectOptions.map(d => (
                      <option key={d} value={d} className={optionCls}>{d}</option>
                    ))}
                  </select>
                  <button className="w-full px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">분류 변경 적용</button>
                </div>
                <button
                  onClick={() => { toggleFlag(selectedThumb.id); }}
                  className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    flaggedImages.has(selectedThumb.id) ? 'bg-red-500 text-white' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  🚩 {flaggedImages.has(selectedThumb.id) ? 'Flag 해제' : 'Flag 이동'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== Flag 검토함 (재분류) - Slide Panel ====== */}
      {showFlagPanel && (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-card border-l border-border shadow-xl z-40 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <h3 className="font-medium text-foreground">🚩 Flag 검토함 (재분류)</h3>
            <button onClick={() => setShowFlagPanel(false)}
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">✕</button>
          </div>

          <div className="p-4 space-y-4">
            {flaggedImages.size === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Flag 폴더에 이미지가 없습니다.</p>
                <p className="text-sm mt-2">이미지에서 🚩 버튼으로 추가하세요.</p>
              </div>
            ) : (
              <>
                {/* Target area/defect selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">이동할 영역</label>
                    <select value={flagTargetArea} onChange={e => setFlagTargetArea(e.target.value)} className={selectCls}>
                      <option value="선택하세요" className={optionCls}>선택하세요</option>
                      {Object.entries(AREA_CODE_MAP).map(([code, name]) => (
                        <option key={code} value={name} className={optionCls}>{name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">이동할 불량유형</label>
                    <select value={flagTargetDefect} onChange={e => setFlagTargetDefect(e.target.value)} className={selectCls}>
                      <option value="선택하세요" className={optionCls}>선택하세요</option>
                      {defectOptions.map(d => (
                        <option key={d} value={d} className={optionCls}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Thumbnail grid (6-col within panel → 3-col) */}
                <div className="grid grid-cols-3 gap-2">
                  {[...flaggedImages].map((id) => (
                    <div key={id} className="relative group">
                      <div className={`rounded-lg overflow-hidden border-2 border-red-500/50 cursor-pointer`}
                        onClick={() => toggleFlag(id)}>
                        <div className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <span className="text-lg opacity-50">🖼️</span>
                        </div>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-0.5 truncate">{id}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-gray-400">현재 선택: <span className="text-cyan-400 font-bold">{flaggedImages.size}</span>장</p>

                {!operator.trim() && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-400">
                    작업자 이름을 입력해야 이동할 수 있습니다.
                  </div>
                )}

                <button
                  onClick={handleFlagMove}
                  disabled={!operator.trim() || flagTargetArea === '선택하세요' || flagTargetDefect === '선택하세요' || flaggedImages.size === 0}
                  className="w-full px-4 py-2.5 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  선택 이미지 이동
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
