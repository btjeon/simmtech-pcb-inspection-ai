'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Folder,
  Grid3x3,
  Save,
  Play,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

// API Base URL (backend-core)
const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

// Response 타입 정의
interface ImageSelectResponse {
  success: boolean;
  imagePath?: string;
  imageSize?: { width: number; height: number; format: string };
  imagePreview?: string;
  message?: string;
  error?: string;
}

interface FolderSelectResponse {
  success: boolean;
  folderPath?: string;
  message?: string;
  error?: string;
}

interface SlicingResponse {
  success: boolean;
  totalSlices?: number;
  rows?: number;
  cols?: number;
  elapsedTime?: number;
  outputFolder?: string;
  thumbnails?: Array<{ filename: string; data: string }>;
  error?: string;
}

export default function ImageSlicerPage() {
  // 이미지 관련 상태
  const [imagePath, setImagePath] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0, format: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSelectingImage, setIsSelectingImage] = useState(false);

  // 슬라이스 설정
  const [sliceWidth, setSliceWidth] = useState(512);
  const [sliceHeight, setSliceHeight] = useState(512);
  const [overlapRatio, setOverlapRatio] = useState(0);

  // 출력 설정
  const [outputFolder, setOutputFolder] = useState('');
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [fileFormat, setFileFormat] = useState('jpg');
  const [namingPattern, setNamingPattern] = useState('slice_{row}_{col}');

  // 처리 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  // 결과 상태
  const [slicingResult, setSlicingResult] = useState<SlicingResponse | null>(null);
  const [estimatedCount, setEstimatedCount] = useState(0);
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });

  // 예상 결과 계산
  useEffect(() => {
    if (imageLoaded && imageInfo.width > 0 && imageInfo.height > 0) {
      const overlapPixelsX = Math.floor(sliceWidth * overlapRatio / 100);
      const overlapPixelsY = Math.floor(sliceHeight * overlapRatio / 100);
      const stepX = Math.max(1, sliceWidth - overlapPixelsX);
      const stepY = Math.max(1, sliceHeight - overlapPixelsY);

      const cols = Math.ceil((imageInfo.width - sliceWidth) / stepX) + 1;
      const rows = Math.ceil((imageInfo.height - sliceHeight) / stepY) + 1;
      const count = rows * cols;

      setEstimatedCount(count);
      setGridSize({ rows, cols });
    }
  }, [imageLoaded, imageInfo, sliceWidth, sliceHeight, overlapRatio]);

  // 이미지 선택 핸들러 (실제 API 호출)
  const handleLoadImage = async () => {
    setIsSelectingImage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/slicer/select-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data: ImageSelectResponse = await response.json();

      if (data.success && data.imagePath) {
        setImagePath(data.imagePath);
        setImageLoaded(true);
        if (data.imageSize) {
          setImageInfo({
            width: data.imageSize.width,
            height: data.imageSize.height,
            format: data.imageSize.format
          });
        }
        if (data.imagePreview) {
          setImagePreview(data.imagePreview);
        }
        // 결과 초기화
        setSlicingResult(null);
        setProgress(0);
      } else {
        if (data.message) {
          console.log(data.message);
        }
        if (data.error) {
          alert(`오류: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      alert('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsSelectingImage(false);
    }
  };

  // 폴더 선택 핸들러 (실제 API 호출)
  const handleSelectFolder = async () => {
    setIsSelectingFolder(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/slicer/select-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data: FolderSelectResponse = await response.json();

      if (data.success && data.folderPath) {
        setOutputFolder(data.folderPath);
      } else {
        if (data.message) {
          console.log(data.message);
        }
        if (data.error) {
          alert(`오류: ${data.error}`);
        }
      }
    } catch (error) {
      console.error('폴더 선택 오류:', error);
      alert('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setIsSelectingFolder(false);
    }
  };

  // 슬라이싱 실행 핸들러 (실제 API 호출)
  const handleRunSlicer = async () => {
    if (!imageLoaded || !outputFolder) {
      alert('이미지와 출력 폴더를 모두 선택해주세요');
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setProgressStatus('슬라이싱 시작...');
    setSlicingResult(null);

    try {
      // 진행 상태 시뮬레이션 (실제 API는 진행률 반환하지 않음)
      setProgress(30);
      setProgressStatus('이미지 분석 중...');

      const response = await fetch(`${API_BASE_URL}/api/v1/slicer/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePath,
          outputFolder,
          sliceWidth,
          sliceHeight,
          overlapRatio,
          fileFormat,
          namingPattern
        })
      });

      setProgress(70);
      setProgressStatus('슬라이스 생성 중...');

      const data: SlicingResponse = await response.json();

      if (data.success) {
        setProgress(100);
        setProgressStatus(`완료! ${data.totalSlices}개 타일 생성 (${data.elapsedTime}초)`);
        setSlicingResult(data);

        // 실제 결과로 그리드 크기 업데이트
        if (data.rows && data.cols) {
          setGridSize({ rows: data.rows, cols: data.cols });
        }
        if (data.totalSlices) {
          setEstimatedCount(data.totalSlices);
        }
      } else {
        setProgress(0);
        setProgressStatus('');
        alert(`슬라이싱 실패: ${data.error}`);
      }
    } catch (error) {
      console.error('슬라이싱 오류:', error);
      alert('백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
      setProgress(0);
      setProgressStatus('');
    } finally {
      setIsProcessing(false);
    }
  };

  const adjustValue = (setter: (value: number) => void, currentValue: number, delta: number, min: number = 1, max: number = 10000) => {
    const newValue = Math.max(min, Math.min(max, currentValue + delta));
    setter(newValue);
  };

  return (
    <>
      <PageHeader
        title="이미지 슬라이서"
        subtitle="대용량 이미지를 지정된 크기로 분할하여 AI 학습용 데이터를 생성합니다"
      />

      {/* 이미지 선택 섹션 */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Folder className="w-6 h-6 text-accent-primary" />
          <h3 className="text-lg font-bold text-text-primary">이미지 선택</h3>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={imagePath}
            placeholder="이미지 파일을 선택하세요..."
            readOnly
            className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none"
          />
          <button
            onClick={handleLoadImage}
            disabled={isSelectingImage}
            className="px-6 py-3 bg-accent-primary text-background-primary font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            {isSelectingImage ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                선택 중...
              </>
            ) : (
              '이미지 불러오기'
            )}
          </button>
        </div>

        {imageLoaded && (
          <div className="bg-background-primary border border-border rounded-lg p-4">
            <div className="flex items-start gap-4">
              {/* 이미지 프리뷰 */}
              {imagePreview && (
                <div className="flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-contain border border-border rounded-lg bg-black"
                  />
                </div>
              )}
              {/* 이미지 정보 */}
              <div className="flex-1">
                <div className="text-sm text-text-secondary space-y-1">
                  <div>
                    <span className="text-text-muted">크기:</span>{' '}
                    <span className="text-accent-primary font-semibold">{imageInfo.width} × {imageInfo.height}</span>
                  </div>
                  <div>
                    <span className="text-text-muted">형식:</span>{' '}
                    <span className="text-accent-primary font-semibold">{imageInfo.format}</span>
                  </div>
                  <div className="text-xs text-text-muted mt-2 break-all">
                    {imagePath}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 슬라이스 설정 섹션 */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Grid3x3 className="w-6 h-6 text-accent-primary" />
          <h3 className="text-lg font-bold text-text-primary">슬라이스 설정</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Slice Width */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Slice Width (Px)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustValue(setSliceWidth, sliceWidth, -10)}
                className="w-10 h-10 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors font-bold"
              >
                −
              </button>
              <input
                type="number"
                value={sliceWidth}
                onChange={(e) => setSliceWidth(parseInt(e.target.value) || 1)}
                min="1"
                max="10000"
                step="10"
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-center text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <button
                onClick={() => adjustValue(setSliceWidth, sliceWidth, 10)}
                className="w-10 h-10 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Slice Height */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Slice Height (Px)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustValue(setSliceHeight, sliceHeight, -10)}
                className="w-10 h-10 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors font-bold"
              >
                −
              </button>
              <input
                type="number"
                value={sliceHeight}
                onChange={(e) => setSliceHeight(parseInt(e.target.value) || 1)}
                min="1"
                max="10000"
                step="10"
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-center text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <button
                onClick={() => adjustValue(setSliceHeight, sliceHeight, 10)}
                className="w-10 h-10 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Overlap Ratio */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Overlap Ratio (%)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => adjustValue(setOverlapRatio, overlapRatio, -1, 0, 99)}
                className="w-10 h-10 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors font-bold"
              >
                −
              </button>
              <input
                type="number"
                value={overlapRatio}
                onChange={(e) => setOverlapRatio(Math.min(99, Math.max(0, parseInt(e.target.value) || 0)))}
                min="0"
                max="99"
                step="1"
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-center text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <button
                onClick={() => adjustValue(setOverlapRatio, overlapRatio, 1, 0, 99)}
                className="w-10 h-10 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 예상 결과 정보 */}
        {imageLoaded && (
          <div className="bg-background-elevated border border-border rounded-lg p-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-text-muted mb-1">예상 출력 개수</div>
              <div className="text-2xl font-bold text-accent-primary">{estimatedCount}</div>
            </div>
            <div className="text-center border-l border-r border-border">
              <div className="text-sm text-text-muted mb-1">행 × 열</div>
              <div className="text-2xl font-bold text-text-primary">{gridSize.rows} × {gridSize.cols}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-text-muted mb-1">예상 용량</div>
              <div className="text-2xl font-bold text-text-primary">
                {fileFormat === 'png'
                  ? (estimatedCount * sliceWidth * sliceHeight * 3 / 1024 / 1024 * 0.5).toFixed(1)
                  : (estimatedCount * 0.1).toFixed(1)} MB
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 출력 설정 섹션 */}
      <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Save className="w-6 h-6 text-accent-primary" />
          <h3 className="text-lg font-bold text-text-primary">출력 설정</h3>
        </div>

        <div className="space-y-4">
          {/* 출력 폴더 */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              출력 폴더
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={outputFolder}
                onChange={(e) => setOutputFolder(e.target.value)}
                placeholder="출력 폴더를 선택하세요..."
                className="flex-1 bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <button
                onClick={handleSelectFolder}
                disabled={isSelectingFolder}
                className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSelectingFolder ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    선택 중...
                  </>
                ) : (
                  '폴더 선택'
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 파일 형식 */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                파일 형식
              </label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
              >
                <option value="jpg">JPEG (.jpg)</option>
                <option value="png">PNG (.png)</option>
                <option value="bmp">BMP (.bmp)</option>
              </select>
            </div>

            {/* 파일명 패턴 */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-2">
                파일명 패턴
              </label>
              <input
                type="text"
                value={namingPattern}
                onChange={(e) => setNamingPattern(e.target.value)}
                placeholder="예: slice_{row}_{col}"
                className="w-full bg-background-primary border border-border rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
              />
              <small className="block text-text-muted text-xs mt-1">
                {'{row}'}, {'{col}'}, {'{index}'} 사용 가능
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* 실행 버튼 */}
      <div className="mb-6">
        <button
          onClick={handleRunSlicer}
          disabled={!imageLoaded || !outputFolder || isProcessing}
          className="w-full bg-status-success text-background-primary font-bold py-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Play className="w-6 h-6" />
              슬라이싱 실행
            </>
          )}
        </button>
      </div>

      {/* 진행 상태 */}
      {(isProcessing || progress > 0) && (
        <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {progress === 100 ? (
                <CheckCircle className="w-5 h-5 text-status-success" />
              ) : isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin text-accent-primary" />
              ) : (
                <Clock className="w-5 h-5 text-text-muted" />
              )}
              <span className="text-text-primary font-semibold">
                {progress === 100 ? '완료' : '처리 중...'}
              </span>
            </div>
            <span className="text-accent-primary font-bold text-lg">{progress}%</span>
          </div>
          <div className="w-full bg-background-elevated rounded-full h-4 mb-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                progress === 100 ? 'bg-status-success' : 'bg-gradient-accent'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-text-secondary">{progressStatus}</div>
        </div>
      )}

      {/* 결과 미리보기 (슬라이싱 완료 후) */}
      {slicingResult && slicingResult.success && (
        <div className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-accent-primary" />
              <h3 className="text-lg font-bold text-text-primary">슬라이싱 결과</h3>
            </div>
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span>
                <Clock className="w-4 h-4 inline mr-1" />
                {slicingResult.elapsedTime}초
              </span>
              <span>
                <Grid3x3 className="w-4 h-4 inline mr-1" />
                {slicingResult.rows} × {slicingResult.cols}
              </span>
            </div>
          </div>

          {/* 썸네일 그리드 */}
          {slicingResult.thumbnails && slicingResult.thumbnails.length > 0 ? (
            <>
              <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2 mb-4">
                {slicingResult.thumbnails.map((thumb, i) => (
                  <div
                    key={i}
                    className="aspect-square bg-background-elevated border border-border rounded overflow-hidden hover:border-accent-primary transition-colors cursor-pointer group relative"
                    title={thumb.filename}
                  >
                    <img
                      src={thumb.data}
                      alt={thumb.filename}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                      {thumb.filename}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-text-muted text-center mb-4">
                최대 20개 썸네일 표시
              </p>
            </>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2 mb-4">
              {Array.from({ length: Math.min(20, slicingResult.totalSlices || 0) }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-background-elevated border border-border rounded flex items-center justify-center text-xs text-text-muted hover:border-accent-primary transition-colors cursor-pointer"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          {/* 결과 요약 */}
          <div className="bg-background-elevated border border-border rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-status-success mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">슬라이싱 완료</span>
            </div>
            <p className="text-center text-sm text-text-secondary">
              총 <span className="text-accent-primary font-bold">{slicingResult.totalSlices}</span>개 타일이 생성되었습니다
            </p>
            <p className="text-center text-xs text-text-muted mt-1">
              저장 위치: {slicingResult.outputFolder}
            </p>
          </div>
        </div>
      )}

      {/* 오류 상태 */}
      {slicingResult && !slicingResult.success && (
        <div className="bg-background-card border border-status-error rounded-lg p-6">
          <div className="flex items-center gap-2 text-status-error">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-bold">슬라이싱 실패</h3>
          </div>
          <p className="mt-2 text-text-secondary">{slicingResult.error}</p>
        </div>
      )}
    </>
  );
}
