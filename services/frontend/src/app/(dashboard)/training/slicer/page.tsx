'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Folder,
  Grid3x3,
  Save,
  Play,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

export default function ImageSlicerPage() {
  const [imagePath, setImagePath] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0, format: '' });

  const [sliceWidth, setSliceWidth] = useState(512);
  const [sliceHeight, setSliceHeight] = useState(512);
  const [overlapRatio, setOverlapRatio] = useState(0);

  const [outputFolder, setOutputFolder] = useState('');
  const [fileFormat, setFileFormat] = useState('jpg');
  const [namingPattern, setNamingPattern] = useState('slice_{row}_{col}');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');

  const [estimatedCount, setEstimatedCount] = useState(0);
  const [gridSize, setGridSize] = useState({ rows: 0, cols: 0 });

  // 예상 결과 계산
  useEffect(() => {
    if (imageLoaded && imageInfo.width > 0 && imageInfo.height > 0) {
      const overlapPixels = Math.floor(sliceWidth * overlapRatio / 100);
      const effectiveWidth = sliceWidth - overlapPixels;
      const effectiveHeight = sliceHeight - overlapPixels;

      const cols = Math.ceil((imageInfo.width - overlapPixels) / effectiveWidth);
      const rows = Math.ceil((imageInfo.height - overlapPixels) / effectiveHeight);
      const count = rows * cols;

      setEstimatedCount(count);
      setGridSize({ rows, cols });
    }
  }, [imageLoaded, imageInfo, sliceWidth, sliceHeight, overlapRatio]);

  const handleLoadImage = () => {
    // Mock: 이미지 로드
    setImageLoaded(true);
    setImageInfo({
      width: 4096,
      height: 3072,
      format: 'JPEG'
    });
    setImagePath('C:\\Images\\large_pcb_4096x3072.jpg');
  };

  const handleRunSlicer = async () => {
    if (!imageLoaded || !outputFolder) {
      alert('이미지와 출력 폴더를 모두 선택해주세요');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressStatus('슬라이싱 시작...');

    // Mock: 진행 시뮬레이션
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
      setProgressStatus(`${Math.floor(estimatedCount * i / 100)}/${estimatedCount} 타일 처리 중...`);
    }

    setProgressStatus('완료!');
    setIsProcessing(false);
  };

  const adjustValue = (setter: Function, currentValue: number, delta: number, min: number = 1, max: number = 10000) => {
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
            className="px-6 py-3 bg-accent-primary text-background-primary font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            이미지 불러오기
          </button>
        </div>

        {imageLoaded && (
          <div className="bg-background-primary border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="text-sm text-text-secondary">
              <span className="mr-4">크기: <span className="text-accent-primary font-semibold">{imageInfo.width} × {imageInfo.height}</span></span>
              <span>형식: <span className="text-accent-primary font-semibold">{imageInfo.format}</span></span>
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
              <div className="text-2xl font-bold text-text-primary">{(estimatedCount * 0.5).toFixed(1)} MB</div>
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
                onClick={() => setOutputFolder('C:\\Output\\Sliced')}
                className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-text-primary hover:bg-border transition-colors"
              >
                폴더 선택
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
      {isProcessing && (
        <div className="bg-background-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-primary font-semibold">처리 중...</span>
            <span className="text-accent-primary font-bold text-lg">{progress}%</span>
          </div>
          <div className="w-full bg-background-elevated rounded-full h-4 mb-2 overflow-hidden">
            <div
              className="bg-gradient-accent h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-text-secondary">{progressStatus}</div>
        </div>
      )}

      {/* 결과 미리보기 (진행 완료 후) */}
      {progress === 100 && !isProcessing && (
        <div className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-6 h-6 text-accent-primary" />
            <h3 className="text-lg font-bold text-text-primary">슬라이싱 결과 미리보기 (최대 20개)</h3>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {Array.from({ length: Math.min(20, estimatedCount) }, (_, i) => (
              <div
                key={i}
                className="aspect-square bg-background-elevated border border-border rounded flex items-center justify-center text-xs text-text-muted hover:border-accent-primary transition-colors cursor-pointer"
              >
                {i + 1}
              </div>
            ))}
          </div>

          <div className="mt-4 text-center text-sm text-text-muted">
            총 {estimatedCount}개 타일이 생성되었습니다
          </div>
        </div>
      )}
    </>
  );
}
