'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  RefreshCw,
  FileText,
  TrendingUp,
  Clock,
  AlertTriangle,
  Filter,
  Calendar,
  ChevronDown,
  Activity
} from 'lucide-react';

// 타입 정의
interface SiteAnalysis {
  name: string;
  count: number;
  color: string;
}

interface TimeDataPoint {
  time: string;
  site: string;
  value: number;
  color: string;
}

// Mock 데이터
const mockSiteAnalysis: SiteAnalysis[] = [
  { name: 'New ATI', count: 105, color: '#00D4AA' },
  { name: 'New PIXEL', count: 0, color: '#00BFFF' },
  { name: 'Legacy ATI', count: 8746, color: '#FFA500' },
  { name: 'Legacy PIXEL', count: 4440, color: '#9370DB' },
];

// Mock 시계열 데이터 생성
const generateTimeData = (): TimeDataPoint[] => {
  const data: TimeDataPoint[] = [];
  const sites = [
    { name: 'New ATI', color: '#00D4AA' },
    { name: 'New PIXEL', color: '#00BFFF' },
    { name: 'Legacy ATI', color: '#FFA500' },
    { name: 'Legacy PIXEL', color: '#9370DB' },
  ];

  const startDate = new Date('2026-01-15');
  const endDate = new Date('2026-01-22');

  for (let d = new Date(startDate); d <= endDate; d.setHours(d.getHours() + 2)) {
    sites.forEach(site => {
      if (site.name === 'New PIXEL') return; // New PIXEL은 데이터 없음

      let baseValue = 0;
      if (site.name === 'Legacy ATI') baseValue = 80;
      else if (site.name === 'Legacy PIXEL') baseValue = 60;
      else baseValue = 40;

      // 랜덤 변동 추가
      const variation = Math.random() * 100;
      const spike = Math.random() > 0.95 ? Math.random() * 300 : 0; // 가끔 스파이크

      data.push({
        time: d.toISOString(),
        site: site.name,
        value: baseValue + variation + spike,
        color: site.color,
      });
    });
  }

  return data;
};

export default function TactTimeReportPage() {
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1); // 분
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // 필터 상태
  const [startTime, setStartTime] = useState('2026-01-15T14:17');
  const [endTime, setEndTime] = useState('2026-01-22T14:17');
  const [selectedMachine, setSelectedMachine] = useState('all');
  const [selectedItem, setSelectedItem] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchText, setSearchText] = useState('');

  // 통계 데이터
  const [totalLogs, setTotalLogs] = useState(13291);
  const [avgTactTime, setAvgTactTime] = useState(17.717);
  const [avgTactTimePerImage, setAvgTactTimePerImage] = useState(0.0709);
  const [errorCount, setErrorCount] = useState(7909);
  const [loadedPages, setLoadedPages] = useState(1);

  // 차트 데이터
  const [timeData, setTimeData] = useState<TimeDataPoint[]>([]);

  useEffect(() => {
    setTimeData(generateTimeData());
  }, []);

  // 새로고침
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setTotalLogs(prev => prev + Math.floor(Math.random() * 10));
      setIsLoading(false);
    }, 500);
  };

  // 자동 새로고침
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      handleRefresh();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAutoRefresh, refreshInterval]);

  // 시간 포맷
  const formatTime = (date: Date) => {
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 간단한 차트 렌더링 (SVG)
  const renderChart = () => {
    if (timeData.length === 0) return null;

    const width = 900;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...timeData.map(d => d.value), 600);
    const minTime = new Date(Math.min(...timeData.map(d => new Date(d.time).getTime())));
    const maxTime = new Date(Math.max(...timeData.map(d => new Date(d.time).getTime())));
    const timeRange = maxTime.getTime() - minTime.getTime();

    const getX = (time: string) => {
      const t = new Date(time).getTime();
      return padding.left + ((t - minTime.getTime()) / timeRange) * chartWidth;
    };

    const getY = (value: number) => {
      return padding.top + chartHeight - (value / maxValue) * chartHeight;
    };

    // Y축 라벨
    const yLabels = [0, 150, 300, 450, 600];

    // X축 라벨 (날짜)
    const xLabels = ['01. 15. 오후 11:17', '01. 18. 오전 06:51', '01. 20. 오후 02:24', '01. 22. 오후 10:18'];

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        {/* Y축 그리드 및 라벨 */}
        {yLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={getY(label)}
              x2={width - padding.right}
              y2={getY(label)}
              stroke="#333"
              strokeDasharray="2,2"
            />
            <text
              x={padding.left - 10}
              y={getY(label) + 4}
              textAnchor="end"
              fill="#666"
              fontSize="12"
            >
              {label}s
            </text>
          </g>
        ))}

        {/* 데이터 포인트 */}
        {timeData.map((point, i) => (
          <circle
            key={i}
            cx={getX(point.time)}
            cy={getY(point.value)}
            r={3}
            fill={point.color}
            opacity={0.8}
          />
        ))}

        {/* X축 라벨 */}
        {xLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left + (i / (xLabels.length - 1)) * chartWidth}
            y={height - 10}
            textAnchor="middle"
            fill="#666"
            fontSize="11"
          >
            {label}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <>
      <PageHeader
        title="TACT TIME 현황 리포트"
        subtitle="AI 추론 실행 시간 및 성능 지표 모니터링"
      />

      {/* 상단 상태바 */}
      <div className="bg-background-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 연결 상태 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-text-secondary">Connected</span>
            </div>
            <button className="flex items-center gap-1 px-3 py-1 bg-background-elevated border border-border rounded text-xs text-text-secondary hover:text-text-primary">
              <span>{'>'}_</span> Debug
            </button>
            <span className="text-xs text-text-muted">
              Updated: {formatTime(lastUpdated)}
            </span>
          </div>

          {/* 우측 컨트롤 */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background-elevated border border-border rounded text-sm">
              <FileText className="w-4 h-4 text-text-muted" />
              <span>Total Logs: <strong className="text-accent-primary">{totalLogs.toLocaleString()}</strong></span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-background-elevated border border-border rounded text-sm">
              <span>100 Loaded (Page {loadedPages})</span>
            </div>

            <button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded text-sm ${
                isAutoRefresh
                  ? 'bg-accent-primary/10 border-accent-primary text-accent-primary'
                  : 'bg-background-elevated border-border text-text-secondary'
              }`}
            >
              <Clock className="w-4 h-4" />
              Auto: {isAutoRefresh ? 'ON' : 'OFF'} ({refreshInterval}m)
            </button>

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent-primary text-background-primary rounded text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="bg-background-card border border-border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-accent-primary" />
          <span className="text-sm font-medium text-text-primary">Smart Filters</span>
          <button className="ml-2 text-xs text-text-muted hover:text-text-secondary flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {/* Start Time */}
          <div>
            <label className="block text-xs text-text-muted mb-1">START TIME</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-xs text-text-muted mb-1">END TIME</label>
            <div className="relative">
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary"
              />
            </div>
          </div>

          {/* Machine */}
          <div>
            <label className="block text-xs text-text-muted mb-1">MACHINE</label>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
              className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="all">All Machines</option>
              <option value="machine1">Machine 1</option>
              <option value="machine2">Machine 2</option>
            </select>
          </div>

          {/* Item */}
          <div>
            <label className="block text-xs text-text-muted mb-1">ITEM</label>
            <select
              value={selectedItem}
              onChange={(e) => setSelectedItem(e.target.value)}
              className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="all">All Items</option>
              <option value="item1">Item 1</option>
              <option value="item2">Item 2</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs text-text-muted mb-1">CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="all">All Categories</option>
              <option value="cat1">Category 1</option>
              <option value="cat2">Category 2</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs text-text-muted mb-1">SEARCH</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Lot, Bundle..."
              className="w-full px-3 py-2 bg-background-primary border border-border rounded text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary"
            />
          </div>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {/* Total Logs */}
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">TOTAL LOGS</span>
            <FileText className="w-5 h-5 text-accent-primary" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{totalLogs.toLocaleString()}</div>
          <div className="text-xs text-text-muted mt-1">Matching Filters</div>
        </div>

        {/* Site Analysis */}
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">SITE ANALYSIS</span>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-xs text-text-muted mb-2">Current Page: 100 Items</div>
          <div className="space-y-1">
            {mockSiteAnalysis.map((site, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: site.color }}></div>
                  <span className="text-text-secondary">{site.name}</span>
                </div>
                <span className="text-text-primary font-medium">{site.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AVG TT (250) */}
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">AVG TT (250)</span>
            <Clock className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{avgTactTime.toFixed(3)}s</div>
          <div className="text-xs text-text-muted mt-1">Global Average</div>
        </div>

        {/* AVG TT (1 IMG) */}
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">AVG TT (1 IMG)</span>
            <Activity className="w-5 h-5 text-text-muted" />
          </div>
          <div className="text-3xl font-bold text-text-primary">{avgTactTimePerImage.toFixed(4)}s</div>
          <div className="text-xs text-text-muted mt-1">Global Average</div>
        </div>

        {/* Errors */}
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-text-muted">ERRORS</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-red-400">{errorCount.toLocaleString()}</div>
          <div className="text-xs text-text-muted mt-1">Global Count</div>
        </div>
      </div>

      {/* 시계열 차트 */}
      <div className="bg-background-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          <h3 className="text-lg font-bold text-text-primary">Time Distribution (Global)</h3>
        </div>

        {/* 차트 영역 */}
        <div className="w-full overflow-x-auto">
          {renderChart()}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
          {mockSiteAnalysis.map((site, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: site.color }}></div>
              <span className="text-sm text-text-secondary">{site.name}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
