'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

// API 응답 타입
interface APIAnalysisHistory {
  success: boolean;
  id: string;
  filename: string;
  timestamp: string;
  analysis: {
    defect_detected: boolean;
    defect_type: string;
    severity: 'high' | 'medium' | 'low';
    confidence: number;
    location: string;
    analysis: string;
    causes: string[];
    solutions: string[];
    process_checks: { process: string; check: string }[];
  };
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// 프론트엔드 이력 타입
interface AnalysisHistory {
  id: string;
  filename: string;
  timestamp: string;
  defectType: string;
  severity: 'high' | 'medium' | 'low';
  confidence: number;
  location: string;
  analysis: string;
  causes: string[];
  solutions: string[];
  processChecks: { process: string; check: string }[];
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// 통계 타입
interface Statistics {
  total: number;
  high: number;
  medium: number;
  low: number;
}

export default function RCAHistoryPage() {
  const [historyData, setHistoryData] = useState<AnalysisHistory[]>([]);
  const [stats, setStats] = useState<Statistics>({ total: 0, high: 0, medium: 0, low: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // 상세 보기 모달
  const [selectedDetail, setSelectedDetail] = useState<AnalysisHistory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 데이터 로드
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 이력 조회
      const historyRes = await fetch(`${API_BASE_URL}/api/v1/rca/history?limit=100`);
      if (historyRes.ok) {
        const data: APIAnalysisHistory[] = await historyRes.json();
        const converted = data.map(item => ({
          id: item.id,
          filename: item.filename,
          timestamp: item.timestamp,
          defectType: item.analysis.defect_type,
          severity: item.analysis.severity,
          confidence: item.analysis.confidence * 100,
          location: item.analysis.location,
          analysis: item.analysis.analysis,
          causes: item.analysis.causes || [],
          solutions: item.analysis.solutions || [],
          processChecks: item.analysis.process_checks || [],
          tokenUsage: {
            prompt: item.usage.prompt_tokens,
            completion: item.usage.completion_tokens,
            total: item.usage.total_tokens,
          },
        }));
        setHistoryData(converted);
      }

      // 통계 조회
      const statsRes = await fetch(`${API_BASE_URL}/api/v1/rca/statistics`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredHistory = historyData.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.defectType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = selectedSeverity === 'all' || item.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'low': return 'text-green-400 bg-green-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return '심각';
      case 'medium': return '보통';
      case 'low': return '경미';
      default: return '미정';
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredHistory.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const dataToExport = selectedItems.length > 0
      ? filteredHistory.filter(item => selectedItems.includes(item.id))
      : filteredHistory;

    // CSV 생성
    const headers = ['분석ID', '파일명', '불량유형', '심각도', '신뢰도', '분석시간'];
    const rows = dataToExport.map(item => [
      item.id,
      item.filename,
      item.defectType,
      getSeverityLabel(item.severity),
      `${item.confidence.toFixed(1)}%`,
      item.timestamp,
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rca_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleViewDetail = (item: AnalysisHistory) => {
    setSelectedDetail(item);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(`분석 ID: ${id}를 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/rca/history/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistoryData(prev => prev.filter(item => item.id !== id));
        setStats(prev => {
          const deleted = historyData.find(item => item.id === id);
          if (deleted) {
            return {
              ...prev,
              total: prev.total - 1,
              [deleted.severity]: prev[deleted.severity] - 1,
            };
          }
          return prev;
        });
      }
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-light text-white">분석 이력 조회</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                <span>AI 불량 원인 분석 (RCA)</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-cyan-400">분석 이력 조회</span>
              </div>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-cyan-400">{stats.total}</div>
          <div className="text-sm text-gray-400">총 분석 건수</div>
        </div>
        <div className="bg-gray-800/70 border border-red-500/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-400">{stats.high}</div>
          <div className="text-sm text-gray-400">심각 불량</div>
        </div>
        <div className="bg-gray-800/70 border border-yellow-500/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-yellow-400">{stats.medium}</div>
          <div className="text-sm text-gray-400">보통 불량</div>
        </div>
        <div className="bg-gray-800/70 border border-green-500/20 rounded-lg p-4">
          <div className="text-3xl font-bold text-green-400">{stats.low}</div>
          <div className="text-sm text-gray-400">경미/정상</div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="파일명, 불량 유형, ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-gray-100 text-sm focus:outline-none focus:border-cyan-400"
              >
                <option value="all">전체 심각도</option>
                <option value="high">심각</option>
                <option value="medium">보통</option>
                <option value="low">경미</option>
              </select>
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      {/* 로딩 */}
      {isLoading ? (
        <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
          <p className="text-gray-400">데이터를 불러오는 중...</p>
        </div>
      ) : (
        /* 테이블 */
        <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredHistory.length && filteredHistory.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-gray-800 accent-cyan-400"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">분석 ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">파일명</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">불량 유형</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">심각도</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">신뢰도</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">분석 시간</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>분석 이력이 없습니다.</p>
                    <p className="text-sm mt-1">이미지 진단 페이지에서 분석을 시작해보세요.</p>
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-600 bg-gray-800 accent-cyan-400"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-cyan-400 font-mono">{item.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-[200px] truncate" title={item.filename}>
                      {item.filename}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{item.defectType}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(item.severity)}`}>
                        {getSeverityLabel(item.severity)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-300">{item.confidence.toFixed(1)}%</td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(item.timestamp).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewDetail(item)}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded transition-colors"
                          title="상세 보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredHistory.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                총 {filteredHistory.length}개 항목
              </div>
            </div>
          )}
        </div>
      )}

      {/* 상세 보기 모달 */}
      {isDetailOpen && selectedDetail && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-cyan-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">분석 상세 정보</h2>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 block mb-1">분석 ID</span>
                  <span className="text-cyan-400 font-mono">{selectedDetail.id}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">파일명</span>
                  <span className="text-gray-300">{selectedDetail.filename}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">불량 유형</span>
                  <span className="text-white font-medium">{selectedDetail.defectType}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">심각도</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getSeverityColor(selectedDetail.severity)}`}>
                    {getSeverityLabel(selectedDetail.severity)}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">신뢰도</span>
                  <span className="text-white">{selectedDetail.confidence.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block mb-1">분석 시간</span>
                  <span className="text-gray-400">{new Date(selectedDetail.timestamp).toLocaleString('ko-KR')}</span>
                </div>
              </div>

              {/* 분석 결과 */}
              <div>
                <span className="text-xs text-gray-500 block mb-2">분석 결과</span>
                <p className="text-gray-300 text-sm leading-relaxed bg-black/30 rounded-lg p-3">
                  {selectedDetail.analysis}
                </p>
              </div>

              {/* 원인 분석 */}
              {selectedDetail.causes.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 block mb-2">원인 분석</span>
                  <ul className="space-y-2 bg-black/30 rounded-lg p-3">
                    {selectedDetail.causes.map((cause, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-yellow-400 font-semibold">{idx + 1}.</span>
                        {cause}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 해결방안 */}
              {selectedDetail.solutions.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 block mb-2">해결방안</span>
                  <ul className="space-y-2 bg-black/30 rounded-lg p-3">
                    {selectedDetail.solutions.map((solution, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-gray-300">
                        <span className="text-green-400 font-semibold">{idx + 1}.</span>
                        {solution}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 공정별 점검 포인트 */}
              {selectedDetail.processChecks.length > 0 && (
                <div>
                  <span className="text-xs text-gray-500 block mb-2">공정별 점검 포인트</span>
                  <div className="bg-black/30 rounded-lg p-3 space-y-1">
                    {selectedDetail.processChecks.map((check, idx) => (
                      <div key={idx} className="flex gap-2 text-sm text-gray-400">
                        <span className="text-cyan-400">{check.process}:</span>
                        <span>{check.check}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 토큰 사용량 */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
                토큰 사용: {selectedDetail.tokenUsage.total.toLocaleString()}
                (입력: {selectedDetail.tokenUsage.prompt.toLocaleString()},
                출력: {selectedDetail.tokenUsage.completion.toLocaleString()})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
