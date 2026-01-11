'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  BarChart3,
  Search,
  CheckCircle,
  TrendingUp,
  Info,
  Folder,
  FolderSearch,
  Save,
  Settings,
  Play,
  Square,
  Loader2,
  RotateCw,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

type SearchMethod = 'clip' | 'hog' | 'cnn';
type FileAction = 'copy' | 'move';

export default function ImageSearchPage() {
  // 통계
  const [stats, setStats] = useState({
    totalImages: 0,
    searchedImages: 0,
    matchedImages: 0,
    averageSimilarity: 0
  });

  // 경로
  const [refFolderPath, setRefFolderPath] = useState('');
  const [searchFolderPath, setSearchFolderPath] = useState('');
  const [outputFolderPath, setOutputFolderPath] = useState('');

  // 검색 설정
  const [searchMethod, setSearchMethod] = useState<SearchMethod>('clip');
  const [textPrompt, setTextPrompt] = useState('');
  const [threshold, setThreshold] = useState(0.70);
  const [shapeWeight, setShapeWeight] = useState(0.50);
  const [fileAction, setFileAction] = useState<FileAction>('copy');

  // 진행 상태
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('0 / 0 (0%)');

  // 로그
  const [logs, setLogs] = useState<string[]>([]);

  // 결과
  const [results, setResults] = useState<any[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLog = () => {
    setLogs([]);
  };

  const handleStartSearch = async () => {
    if (!searchFolderPath || !outputFolderPath) {
      alert('검색 대상 폴더와 결과 저장 폴더는 필수입니다');
      return;
    }

    setIsSearching(true);
    setProgress(0);
    setLogs([]);
    setResults([]);

    addLog('이미지 검색 시작...');
    addLog(`기준 폴더: ${refFolderPath || '(텍스트 프롬프트 사용)'}`);
    addLog(`검색 대상: ${searchFolderPath}`);
    addLog(`결과 저장: ${outputFolderPath}`);
    addLog(`검색 방법: ${searchMethod.toUpperCase()}`);
    addLog(`임계값: ${threshold}`);

    // Mock: 검색 시뮬레이션
    const totalImages = 50;
    for (let i = 0; i <= totalImages; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const percent = Math.floor((i / totalImages) * 100);
      setProgress(percent);
      setProgressText(`${i} / ${totalImages} (${percent}%)`);

      if (i % 10 === 0 && i > 0) {
        addLog(`${i}개 이미지 처리 완료`);
      }
    }

    // Mock 결과 생성
    const mockResults = Array.from({ length: 12 }, (_, i) => ({
      id: `result-${i + 1}`,
      refImage: `reference_${i % 3 + 1}.jpg`,
      matchImage: `matched_${i + 1}.jpg`,
      similarity: (0.95 - i * 0.03).toFixed(3),
      method: searchMethod
    }));

    setResults(mockResults);
    setStats({
      totalImages: totalImages,
      searchedImages: totalImages,
      matchedImages: mockResults.length,
      averageSimilarity: 85.2
    });

    addLog(`검색 완료! ${mockResults.length}개의 유사 이미지를 찾았습니다`);
    setIsSearching(false);
  };

  const handleStopSearch = () => {
    setIsSearching(false);
    addLog('검색이 중지되었습니다');
  };

  return (
    <>
      <PageHeader
        title="이미지 검색"
        subtitle="AI 기반 유사 이미지 검색 시스템 (CLIP, HOG, CNN+Color)"
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <BarChart3 className="w-8 h-8 text-accent-primary" />
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-primary">{stats.totalImages}</div>
              <div className="text-sm text-text-muted">기준 이미지</div>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <Search className="w-8 h-8 text-accent-primary" />
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-primary">{stats.searchedImages}</div>
              <div className="text-sm text-text-muted">검색 완료</div>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <CheckCircle className="w-8 h-8 text-status-success" />
            <div className="text-right">
              <div className="text-2xl font-bold text-status-success">{stats.matchedImages}</div>
              <div className="text-sm text-text-muted">매칭된 이미지</div>
            </div>
          </div>
        </div>
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-8 h-8 text-accent-primary" />
            <div className="text-right">
              <div className="text-2xl font-bold text-accent-primary">{stats.averageSimilarity}%</div>
              <div className="text-sm text-text-muted">평균 유사도</div>
            </div>
          </div>
        </div>
      </div>

      {/* 경로 입력 안내 */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <Folder className="w-4 h-4" />
              폴더 경로 입력 방법
            </div>
            <div className="text-sm opacity-95">
              <strong>Live Server (브라우저):</strong> 전체 경로를 직접 입력하세요<br />
              <code className="bg-white/20 px-2 py-1 rounded mt-1 inline-block">예: C:\Users\gogot\PCBVisionPro\simtech\볼패드 옵션1(녹색)</code><br />
              <span className="text-xs opacity-85">※ 브라우저 보안 제한으로 '찾아보기' 버튼은 Electron 앱에서만 동작합니다</span>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 설정 */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          검색 설정
        </h3>

        <div className="space-y-6">
          {/* 기준 이미지 폴더 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              기준 이미지 폴더
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={refFolderPath}
                onChange={(e) => setRefFolderPath(e.target.value)}
                placeholder="경로 입력 또는 찾아보기 (예: C:\Images\Reference)"
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <button className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors flex items-center gap-2">
                <Folder className="w-4 h-4" />
                찾아보기
              </button>
            </div>
          </div>

          {/* 검색 대상 폴더 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              검색 대상 폴더 <span className="text-status-error">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchFolderPath}
                onChange={(e) => setSearchFolderPath(e.target.value)}
                placeholder="경로 입력 또는 찾아보기 (예: C:\Images\Search)"
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                required
              />
              <button className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors flex items-center gap-2">
                <FolderSearch className="w-4 h-4" />
                찾아보기
              </button>
            </div>
          </div>

          {/* 결과 저장 폴더 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              결과 저장 폴더 <span className="text-status-error">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputFolderPath}
                onChange={(e) => setOutputFolderPath(e.target.value)}
                placeholder="경로 입력 또는 찾아보기 (예: C:\Images\Output)"
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
                required
              />
              <button className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
                찾아보기
              </button>
            </div>
          </div>

          {/* 검색 방법 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-3">
              검색 방법
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 bg-background-elevated border border-border rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                <input
                  type="radio"
                  name="searchMethod"
                  value="clip"
                  checked={searchMethod === 'clip'}
                  onChange={(e) => setSearchMethod(e.target.value as SearchMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">CLIP (텍스트+이미지)</div>
                  <div className="text-sm text-text-muted">AI 기반 의미론적 유사도</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 bg-background-elevated border border-border rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                <input
                  type="radio"
                  name="searchMethod"
                  value="hog"
                  checked={searchMethod === 'hog'}
                  onChange={(e) => setSearchMethod(e.target.value as SearchMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">HOG (형태)</div>
                  <div className="text-sm text-text-muted">형태 기반 특징 추출</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 bg-background-elevated border border-border rounded-lg cursor-pointer hover:border-accent-primary transition-colors">
                <input
                  type="radio"
                  name="searchMethod"
                  value="cnn"
                  checked={searchMethod === 'cnn'}
                  onChange={(e) => setSearchMethod(e.target.value as SearchMethod)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-semibold text-text-primary">CNN + Color</div>
                  <div className="text-sm text-text-muted">딥러닝 + 색상 히스토그램</div>
                </div>
              </label>
            </div>
          </div>

          {/* 텍스트 프롬프트 (CLIP 전용) */}
          {searchMethod === 'clip' && (
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                텍스트 프롬프트 (선택사항)
              </label>
              <input
                type="text"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="예: 'a photo of scratch defect'"
                className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <small className="block text-text-muted text-xs mt-1">
                CLIP 모드에서 텍스트만으로 검색하려면 기준 이미지 폴더를 비워두고 텍스트만 입력하세요
              </small>
            </div>
          )}

          {/* 유사도 임계값 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              유사도 임계값: <span className="text-accent-primary">{threshold.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
            />
            <small className="block text-text-muted text-xs mt-1">
              이 값 이상의 유사도를 가진 이미지만 검색
            </small>
          </div>

          {/* 형태 가중치 (CNN 전용) */}
          {searchMethod === 'cnn' && (
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                형태 가중치: <span className="text-accent-primary">{shapeWeight.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={shapeWeight}
                onChange={(e) => setShapeWeight(parseFloat(e.target.value))}
                className="w-full h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
              />
              <small className="block text-text-muted text-xs mt-1">
                형태(shape)와 색상(color)의 비율 (1.0 = 100% 형태)
              </small>
            </div>
          )}

          {/* 파일 처리 방식 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              파일 처리
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fileAction"
                  value="copy"
                  checked={fileAction === 'copy'}
                  onChange={(e) => setFileAction(e.target.value as FileAction)}
                />
                <span className="text-text-primary">복사</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="fileAction"
                  value="move"
                  checked={fileAction === 'move'}
                  onChange={(e) => setFileAction(e.target.value as FileAction)}
                />
                <span className="text-text-primary">이동</span>
              </label>
            </div>
          </div>

          {/* 실행 버튼 */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleStartSearch}
              disabled={isSearching}
              className="flex-1 bg-gradient-accent text-background-primary font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  검색 시작
                </>
              )}
            </button>
            <button
              onClick={handleStopSearch}
              disabled={!isSearching}
              className="px-8 bg-status-error text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Square className="w-5 h-5" />
              중지
            </button>
          </div>
        </div>
      </div>

      {/* 진행 상태 */}
      {isSearching && (
        <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <RotateCw className="w-5 h-5 animate-spin" />
            검색 진행 상태
          </h3>
          <div className="mb-2">
            <div className="w-full bg-background-elevated rounded-full h-6 overflow-hidden">
              <div
                className="bg-gradient-accent h-full flex items-center justify-center text-background-primary text-sm font-bold transition-all duration-300"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
          </div>
          <div className="text-center text-text-secondary">{progressText}</div>
        </div>
      )}

      {/* 검색 로그 */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            검색 로그
          </h3>
          <button
            onClick={clearLog}
            className="px-3 py-1 bg-background-elevated border border-border rounded text-sm text-text-secondary hover:bg-border transition-colors"
          >
            Clear
          </button>
        </div>
        <div className="bg-background-primary border border-border rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-text-muted text-center py-8">
              검색을 시작하면 로그가 여기에 표시됩니다.
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-text-secondary">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 */}
      {results.length > 0 && (
        <div className="bg-background-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            검색 결과 ({results.length}개)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-background-elevated border border-border rounded-lg p-4 hover:border-accent-primary transition-colors"
              >
                <div className="aspect-video bg-background-primary rounded mb-3 flex items-center justify-center text-text-muted gap-2">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-xs">{result.matchImage}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">기준 이미지:</span>
                    <span className="text-text-primary font-mono text-xs">{result.refImage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">유사도:</span>
                    <span className="text-accent-primary font-bold">{(parseFloat(result.similarity) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">방법:</span>
                    <span className="text-text-primary uppercase text-xs">{result.method}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
