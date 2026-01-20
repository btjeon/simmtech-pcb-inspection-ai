'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Settings,
  Folder,
  FolderOutput,
  Play,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  Save,
  RotateCcw,
  Circle
} from 'lucide-react';
import * as ExtractionAPI from '@/lib/api/extraction';
import { ImageCanvas, BoundingBox, PolygonPoint } from '@/components/canvas/ImageCanvas';

type ExtractionMode = 'yolo' | 'box_auto' | 'polygon';
type BoxAutoMethod = 'grabcut' | 'watershed' | 'threshold' | 'canny' | 'kmeans';

export default function DefectExtractionPage() {
  // Extraction mode
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('yolo');

  // === 통합 이미지 관리 (레거시 방식) ===
  // 모든 모드에서 공유하는 단일 이미지 소스
  const [currentImageSrc, setCurrentImageSrc] = useState<string>('');
  const [imageList, setImageList] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]); // 실제 파일 객체 저장
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // File paths
  const [defectImagePath, setDefectImagePath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [yoloModelPath, setYoloModelPath] = useState('');
  const [patchSavePath, setPatchSavePath] = useState('');
  const [maskSavePath, setMaskSavePath] = useState('');

  const [confidence, setConfidence] = useState(0.25);
  const [isProcessing, setIsProcessing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Contour navigation state (YOLO 모드)
  const [currentContourIndex, setCurrentContourIndex] = useState(0);
  const [totalContours, setTotalContours] = useState(0);

  // 파일 선택 핸들러 (YOLO 모델)
  const handleSelectModelFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pt,.pth,.weights'; // YOLO 모델 파일 형식
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setYoloModelPath(file.name);
        addLog(`모델 파일 선택: ${file.name}`);
      }
    };
    input.click();
  };

  // 폴더 선택 핸들러
  const handleSelectDefectFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        // 이미지 파일만 필터링
        const filteredImageFiles = Array.from(files).filter(file =>
          file.type.startsWith('image/')
        );

        if (filteredImageFiles.length === 0) {
          addLog('✗ 폴더에 이미지 파일이 없습니다');
          return;
        }

        // 폴더 경로 설정
        const filePath = files[0].webkitRelativePath || '';
        const folderPath = filePath.split('/')[0];
        setDefectImagePath(folderPath);

        // 이미지 목록과 파일 객체 저장
        const imagePaths = filteredImageFiles.map(f => f.name);
        setImageList(imagePaths);
        setImageFiles(filteredImageFiles); // 파일 객체 저장
        setCurrentImageIndex(0);

        // 첫 번째 이미지 로드
        const firstFile = filteredImageFiles[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target?.result as string;
          setCurrentImageSrc(imageSrc);
          setImageLoaded(true);
          addLog(`✓ 불량 이미지 폴더 선택: ${folderPath} (${filteredImageFiles.length}개 이미지)`);
          addLog(`✓ 첫 번째 이미지 로드: ${firstFile.name}`);
        };
        reader.readAsDataURL(firstFile);
      }
    };
    input.click();
  };

  const handleSelectPatchFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const filePath = files[0].webkitRelativePath || '';
        const folderPath = filePath.split('/')[0];
        setPatchSavePath(folderPath);
        addLog(`패치 저장 폴더 선택: ${folderPath}`);
      }
    };
    input.click();
  };

  const handleSelectMaskFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const filePath = files[0].webkitRelativePath || '';
        const folderPath = filePath.split('/')[0];
        setMaskSavePath(folderPath);
        addLog(`마스크 저장 폴더 선택: ${folderPath}`);
      }
    };
    input.click();
  };

  // Mask post-processing state
  const [gvOffset, setGvOffset] = useState(0);
  const [morphologyType, setMorphologyType] = useState<'none' | 'open' | 'close'>('none');
  const [maskInverted, setMaskInverted] = useState(false);
  const [otsuValue, setOtsuValue] = useState(0);

  // Operation parameters
  const [kernelSize, setKernelSize] = useState(3);
  const [iterations, setIterations] = useState(1);
  const [minArea, setMinArea] = useState(100);
  const [thresholdRatio, setThresholdRatio] = useState(0.7);

  // BOX AUTO mode state
  const [boxAutoMethod, setBoxAutoMethod] = useState<BoxAutoMethod>('grabcut');
  const [drawnBox, setDrawnBox] = useState<BoundingBox | null>(null);

  // POLYGON mode state
  const [polygonPoints, setPolygonPoints] = useState<PolygonPoint[]>([]);

  // === 4-View Layout State (레거시 방식) ===
  // 원본 이미지: currentImageSrc 사용
  const [workImageSrc, setWorkImageSrc] = useState<string>('');  // 작업 영역 (박스/폴리곤 그려진 이미지)
  const [maskPreviewSrc, setMaskPreviewSrc] = useState<string>('');  // 마스크 프리뷰
  const [patchPreviewSrc, setPatchPreviewSrc] = useState<string>('');  // 패치 프리뷰

  // Advanced mask operations UI state
  const [showAdvancedMaskOps, setShowAdvancedMaskOps] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'morphology' | 'threshold' | 'filter' | 'contour' | 'advanced'>('morphology');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 이미지 인덱스 변경 시 해당 이미지 로드
  useEffect(() => {
    if (imageFiles.length > 0 && currentImageIndex >= 0 && currentImageIndex < imageFiles.length) {
      const file = imageFiles[currentImageIndex];
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageSrc = event.target?.result as string;
        setCurrentImageSrc(imageSrc);
        setImageLoaded(true);
      };
      reader.readAsDataURL(file);
    }
  }, [currentImageIndex, imageFiles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch(e.key) {
        // Image navigation
        case '1':
          handlePreviousImage();
          break;
        case '2':
          handleNextImage();
          break;
        // Contour navigation
        case '3':
          handlePreviousContour();
          break;
        case '4':
          handleNextContour();
          break;
        // GV Offset adjustment
        case 'u':
        case 'U':
          handleDecreaseOffset();
          break;
        case 'd':
        case 'D':
          handleIncreaseOffset();
          break;
        case 'r':
        case 'R':
          handleResetOffset();
          break;
        // Morphology
        case 'o':
        case 'O':
          handleApplyOpen();
          break;
        case 'l':
        case 'L':
          handleApplyClose();
          break;
        // Mask operations
        case 'm':
        case 'M':
          handleSelectCenterContour();
          break;
        case 'i':
        case 'I':
          handleInvertMask();
          break;
        case 'y':
        case 'Y':
          handleSaveMaskAndPatch();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentImageIndex, currentContourIndex, imageList.length, totalContours, gvOffset]);

  // Image navigation handlers
  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
      setCurrentContourIndex(0);
      addLog(`이미지 이동: ${currentImageIndex} / ${imageList.length}`);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < imageList.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
      setCurrentContourIndex(0);
      addLog(`이미지 이동: ${currentImageIndex + 2} / ${imageList.length}`);
    }
  };

  // Contour navigation handlers
  const handlePreviousContour = () => {
    if (currentContourIndex > 0) {
      setCurrentContourIndex(prev => prev - 1);
      addLog(`Contour 이동: ${currentContourIndex} / ${totalContours}`);
    }
  };

  const handleNextContour = () => {
    if (currentContourIndex < totalContours - 1) {
      setCurrentContourIndex(prev => prev + 1);
      addLog(`Contour 이동: ${currentContourIndex + 2} / ${totalContours}`);
    }
  };

  // GV Offset handlers
  const handleDecreaseOffset = () => {
    setGvOffset(prev => Math.max(-255, prev - 5));
    addLog(`GV Offset: ${gvOffset - 5}`);
  };

  const handleIncreaseOffset = () => {
    setGvOffset(prev => Math.min(255, prev + 5));
    addLog(`GV Offset: ${gvOffset + 5}`);
  };

  const handleResetOffset = () => {
    setGvOffset(0);
    addLog('GV Offset 리셋: 0');
  };

  // Morphology handlers
  const handleApplyOpen = async () => {
    setMorphologyType('open');
    addLog('Morphology: Opening 적용');

    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'morphology_open'
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleApplyClose = async () => {
    setMorphologyType('close');
    addLog('Morphology: Closing 적용');

    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'morphology_close'
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // Mask operation handlers
  const handleSelectCenterContour = async () => {
    addLog('중앙 Contour 선택');

    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'select_center'
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleInvertMask = async () => {
    setMaskInverted(prev => !prev);
    addLog(`Mask 반전: ${!maskInverted ? 'ON' : 'OFF'}`);

    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'invert'
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleSaveMaskAndPatch = async () => {
    addLog('Mask 및 Patch 저장 중...');

    try {
      const result = await ExtractionAPI.saveMaskAndPatch();
      addLog(`✓ 저장 완료: ${result.savedFiles.join(', ')}`);
    } catch (error) {
      addLog(`✗ 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // Advanced Mask Post-processing handlers
  const handleApplyMaskOperation = async (operation: string, params?: Record<string, any>) => {
    addLog(`Mask 연산 적용: ${operation}`);

    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: operation as any,
        params
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // BOX AUTO handlers
  const handleBoxDrawn = (box: BoundingBox) => {
    setDrawnBox(box);
    addLog(`박스 그리기 완료: (${box.x}, ${box.y}) ${box.w}x${box.h}`);
  };

  const handleBoxAutoExtract = async () => {
    if (!drawnBox) {
      addLog('먼저 이미지에 박스를 그려주세요');
      return;
    }

    setIsProcessing(true);
    addLog(`BOX AUTO 추출 시작 (${boxAutoMethod})...`);

    try {
      const result = await ExtractionAPI.extractWithBoxAuto({
        x: Math.round(drawnBox.x),
        y: Math.round(drawnBox.y),
        w: Math.round(drawnBox.w),
        h: Math.round(drawnBox.h),
        method: boxAutoMethod
      });

      addLog(`✓ ${result.message}`);
      addLog(`알고리즘: ${result.method}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // === 통합 이미지 로드 (레거시 방식) ===
  // 모든 모드에서 공통으로 사용
  const handleLoadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageSrc = event.target?.result as string;
          setCurrentImageSrc(imageSrc);
          setImageLoaded(true);
          addLog(`이미지 로드 완료: ${file.name}`);

          // 모드별 상태 초기화
          setDrawnBox(null);
          setPolygonPoints([]);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // POLYGON handlers
  const handlePolygonDrawn = (points: PolygonPoint[]) => {
    setPolygonPoints(points);
    addLog(`폴리곤 완성: ${points.length}개 점`);
  };

  const handlePolygonExtract = async () => {
    if (!polygonPoints || polygonPoints.length < 3) {
      addLog('최소 3개 이상의 점으로 폴리곤을 그려주세요');
      return;
    }

    setIsProcessing(true);
    addLog('POLYGON 추출 시작...');

    try {
      const result = await ExtractionAPI.extractWithPolygon({
        points: polygonPoints.map(p => [p.x, p.y])
      });

      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPolygon = () => {
    setPolygonPoints([]);
    addLog('폴리곤 리셋');
  };

  const handleStartExtraction = async () => {
    if (!defectImagePath || !outputPath || !yoloModelPath) {
      addLog('필수 입력 항목을 확인해주세요');
      return;
    }

    setIsProcessing(true);
    addLog('YOLO 불량 추출 시작...');
    addLog(`입력 경로: ${defectImagePath}`);
    addLog(`출력 경로: ${outputPath}`);
    addLog(`YOLO 모델: ${yoloModelPath}`);
    addLog(`신뢰도 임계값: ${confidence}`);

    try {
      // 1. YOLO 모델 로드
      addLog('YOLO 모델 로딩 중...');
      const loadResult = await ExtractionAPI.loadYOLOModel({
        modelPath: yoloModelPath
      });

      addLog(`모델 로드 완료: ${loadResult.modelType}`);

      // 2. 불량 추출 실행
      addLog('불량 영역 추출 중...');
      const extractResult = await ExtractionAPI.extractWithYOLO({
        defectImagePath,
        outputPath,
        confidence
      });

      // 3. 결과 업데이트
      setImageLoaded(true);
      setTotalContours(extractResult.totalContours);

      addLog(`✓ 추출 완료: ${extractResult.totalContours}개 contour`);
      addLog(extractResult.message);

    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      console.error('Extraction error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLog = () => {
    setLog([]);
  };

  // === 추가 핸들러 함수들 (레거시 UI용) ===
  const handleApplyOpening = handleApplyOpen;
  const handleApplyClosing = handleApplyClose;

  const handleApplyErode = async () => {
    addLog('Morphology: Erode 적용');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'erode' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleApplyDilate = async () => {
    addLog('Morphology: Dilate 적용');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'dilate' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleDecreaseGvOffset = handleDecreaseOffset;
  const handleIncreaseGvOffset = handleIncreaseOffset;
  const handleResetGvOffset = handleResetOffset;

  const handleApplyGaussian = async () => {
    addLog('Filter: Gaussian Blur 적용');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'gaussian_blur' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleApplyMedian = async () => {
    addLog('Filter: Median Blur 적용');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'median_blur' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleApplyBilateral = async () => {
    addLog('Filter: Bilateral Filter 적용');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'bilateral_filter' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleSelectLargestContour = async () => {
    addLog('가장 큰 Contour 선택');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'select_largest' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleMergeContours = async () => {
    addLog('모든 Contour 병합');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'merge_all' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleFillHoles = async () => {
    addLog('구멍 메우기 적용');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'fill_holes' as any
      });
      addLog(`✓ ${result.message}`);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleResetMask = async () => {
    addLog('마스크 초기화');
    try {
      const result = await ExtractionAPI.postProcessMask({
        operation: 'reset' as any
      });
      addLog(`✓ ${result.message}`);
      setMorphologyType('none');
      setMaskInverted(false);
      setGvOffset(0);
    } catch (error) {
      addLog(`✗ 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <>
      <PageHeader
        title="Patch/Mask 추출 페이지 V2"
        subtitle="3가지 추출 모드를 통한 유연한 불량 추출 시스템"
      />

      {/* === 레거시 PyQt 3x2 그리드 레이아웃 === */}
      <div className="space-y-4">

        {/* Row 0: 상단 네비게이션 바 (3열) */}
        <div className="grid grid-cols-3 gap-4">
          {/* 이미지 NAV */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-secondary">이미지 NAV</h3>
              <span className="text-sm text-accent-primary font-mono px-2 py-1 bg-background-elevated rounded">
                {currentImageIndex + 1}/{imageList.length || 0}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousImage}
                disabled={currentImageIndex === 0}
                className="flex-1 px-3 py-2 bg-background-primary border border-border rounded text-sm font-medium text-text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← 이전(1)
              </button>
              <button
                onClick={handleNextImage}
                disabled={currentImageIndex >= (imageList.length - 1)}
                className="flex-1 px-3 py-2 bg-background-primary border border-border rounded text-sm font-medium text-text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 →(2)
              </button>
            </div>
          </div>

          {/* Contour NAV (YOLO) */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-secondary">Contour NAV (YOLO)</h3>
              <span className="text-sm text-accent-primary font-mono px-2 py-1 bg-background-elevated rounded">
                {currentContourIndex + 1}/{totalContours || 0}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousContour}
                disabled={extractionMode !== 'yolo' || currentContourIndex === 0}
                className="flex-1 px-3 py-2 bg-background-primary border border-border rounded text-sm font-medium text-text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← 이전(3)
              </button>
              <button
                onClick={handleNextContour}
                disabled={extractionMode !== 'yolo' || currentContourIndex >= (totalContours - 1)}
                className="flex-1 px-3 py-2 bg-background-primary border border-border rounded text-sm font-medium text-text-primary hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음 →(4)
              </button>
            </div>
          </div>

          {/* 페이지메뉴 */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-bold text-text-secondary mb-3">페이지메뉴</h3>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold transition-colors"
            >
              홈 (H)
            </button>
          </div>
        </div>

        {/* Row 1: 모드 선택 (3열 병합) */}
        <div className="bg-background-card border border-border rounded-lg p-6">
          <h3 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Layers className="w-6 h-6" />
            추출 모드 선택
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <label className={`cursor-pointer ${extractionMode === 'yolo' ? 'ring-2 ring-accent-primary' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="yolo"
                checked={extractionMode === 'yolo'}
                onChange={() => setExtractionMode('yolo')}
                className="sr-only"
              />
              <div className={`py-4 px-6 rounded-lg border-2 transition-all ${
                extractionMode === 'yolo'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border bg-background-elevated hover:border-accent-primary/50'
              }`}>
                <div className="text-center">
                  <div className={`font-bold text-base mb-2 ${extractionMode === 'yolo' ? 'text-accent-primary' : 'text-text-primary'}`}>
                    모드 1: YOLO 모델 자동 추출
                  </div>
                  <div className="text-xs text-text-muted">
                    YOLOv8-seg 모델 기반 완전 자동 검출. 대량의 동일 패턴 불량에 적합.
                  </div>
                </div>
              </div>
            </label>

            <label className={`cursor-pointer ${extractionMode === 'box_auto' ? 'ring-2 ring-accent-primary' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="box_auto"
                checked={extractionMode === 'box_auto'}
                onChange={() => setExtractionMode('box_auto')}
                className="sr-only"
              />
              <div className={`py-4 px-6 rounded-lg border-2 transition-all ${
                extractionMode === 'box_auto'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border bg-background-elevated hover:border-accent-primary/50'
              }`}>
                <div className="text-center">
                  <div className={`font-bold text-base mb-2 ${extractionMode === 'box_auto' ? 'text-accent-primary' : 'text-text-primary'}`}>
                    모드 2: 박스 지정 → 자동 Segmentation
                  </div>
                  <div className="text-xs text-text-muted">
                    사용자가 ROI 박스 지정. Otsu 이진화 + 형태학 연산으로 자동 추출. 복잡한 배경에 적합.
                  </div>
                </div>
              </div>
            </label>

            <label className={`cursor-pointer ${extractionMode === 'polygon' ? 'ring-2 ring-accent-primary' : ''}`}>
              <input
                type="radio"
                name="mode"
                value="polygon"
                checked={extractionMode === 'polygon'}
                onChange={() => setExtractionMode('polygon')}
                className="sr-only"
              />
              <div className={`py-4 px-6 rounded-lg border-2 transition-all ${
                extractionMode === 'polygon'
                  ? 'border-accent-primary bg-accent-primary/10'
                  : 'border-border bg-background-elevated hover:border-accent-primary/50'
              }`}>
                <div className="text-center">
                  <div className={`font-bold text-base mb-2 ${extractionMode === 'polygon' ? 'text-accent-primary' : 'text-text-primary'}`}>
                    모드 3: 수동 폴리곤 드로잉
                  </div>
                  <div className="text-xs text-text-muted">
                    마우스 클릭으로 정밀 영역 지정. 불규칙한 형태 추출. YOLO 미검출 미세 불량에 적합.
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Row 2: 메인 작업 영역 (3열) */}
        <div className="grid grid-cols-3 gap-4" style={{minHeight: '500px'}}>

          {/* 좌측: 원본 이미지 */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              원본 이미지
            </h3>
            <div className="aspect-square bg-background-elevated rounded border-2 border-border flex items-center justify-center overflow-hidden">
              {currentImageSrc ? (
                <img src={currentImageSrc} alt="Original" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-text-muted p-8">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-sm font-medium">이미지 폴더를 지정하세요</p>
                  <p className="text-xs mt-2 opacity-75">불량 이미지 폴더를 선택하여 시작</p>
                </div>
              )}
            </div>
          </div>

          {/* 중앙: 작업 영역 */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              {extractionMode === 'yolo' && '작업 영역'}
              {extractionMode === 'box_auto' && '박스 선택 영역'}
              {extractionMode === 'polygon' && '폴리곤 영역'}
            </h3>

            <div className="aspect-square bg-background-elevated rounded border-2 border-border overflow-hidden">
              {extractionMode === 'box_auto' && currentImageSrc ? (
                <ImageCanvas
                  imageSrc={currentImageSrc}
                  onBoxDrawn={handleBoxDrawn}
                  mode="box"
                  className="w-full h-full"
                />
              ) : extractionMode === 'polygon' && currentImageSrc ? (
                <ImageCanvas
                  imageSrc={currentImageSrc}
                  onPolygonDrawn={handlePolygonDrawn}
                  mode="polygon"
                  className="w-full h-full"
                />
              ) : workImageSrc ? (
                <img src={workImageSrc} alt="Work Area" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-muted text-sm p-8 text-center">
                  {extractionMode === 'yolo' && '추출을 시작하면 YOLO 검출 결과가 표시됩니다'}
                  {extractionMode === 'box_auto' && '마우스로 박스를 그려서 영역을 지정하세요'}
                  {extractionMode === 'polygon' && '마우스 클릭으로 다각형을 그리세요 (우클릭 또는 더블클릭으로 완성)'}
                </div>
              )}
            </div>

            {/* BOX AUTO: 박스 정보 표시 */}
            {extractionMode === 'box_auto' && drawnBox && (
              <div className="mt-3 p-3 bg-background-elevated rounded-lg border border-border">
                <p className="text-xs text-text-secondary mb-1 font-semibold">선택된 영역:</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-text-primary">
                  <div>위치: ({drawnBox.x.toFixed(0)}, {drawnBox.y.toFixed(0)})</div>
                  <div>크기: {drawnBox.w.toFixed(0)} × {drawnBox.h.toFixed(0)}</div>
                </div>
              </div>
            )}
          </div>

          {/* 우측: 경로 설정 + 모드별 설정 */}
          <div className="bg-background-card border border-border rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              경로 설정
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {/* YOLO 모델 경로 */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  YOLO 모델 경로
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={yoloModelPath}
                    onChange={(e) => setYoloModelPath(e.target.value)}
                    placeholder="defect.pt"
                    className="flex-1 bg-background-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={handleSelectModelFile}
                    className="px-2 py-1.5 bg-background-elevated border border-border rounded text-text-primary hover:bg-border transition-colors"
                    title="파일 선택"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 불량 이미지 폴더 */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  불량 이미지 폴더
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={defectImagePath}
                    onChange={(e) => setDefectImagePath(e.target.value)}
                    placeholder="C:\images\defect_img"
                    className="flex-1 bg-background-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={handleSelectDefectFolder}
                    className="px-2 py-1.5 bg-background-elevated border border-border rounded text-text-primary hover:bg-border transition-colors"
                    title="폴더 선택"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 패치 저장 폴더 */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  패치 저장 폴더
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patchSavePath}
                    onChange={(e) => setPatchSavePath(e.target.value)}
                    placeholder="C:\output\patches"
                    className="flex-1 bg-background-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={handleSelectPatchFolder}
                    className="px-2 py-1.5 bg-background-elevated border border-border rounded text-text-primary hover:bg-border transition-colors"
                    title="폴더 선택"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 마스크 저장 폴더 */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  마스크 저장 폴더
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={maskSavePath}
                    onChange={(e) => setMaskSavePath(e.target.value)}
                    placeholder="C:\output\masks"
                    className="flex-1 bg-background-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={handleSelectMaskFolder}
                    className="px-2 py-1.5 bg-background-elevated border border-border rounded text-text-primary hover:bg-border transition-colors"
                    title="폴더 선택"
                  >
                    <Folder className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 모드별 추가 설정 */}
              {extractionMode === 'yolo' && (
                <>
                  <div className="pt-3 border-t border-border">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      신뢰도 임계값: <span className="text-accent-primary">{confidence.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={confidence}
                      onChange={(e) => setConfidence(parseFloat(e.target.value))}
                      className="w-full h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
                    />
                  </div>

                  <button
                    onClick={handleStartExtraction}
                    disabled={isProcessing}
                    className="w-full bg-gradient-accent text-background-primary font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        YOLO 추출 시작
                      </>
                    )}
                  </button>
                </>
              )}

              {extractionMode === 'box_auto' && (
                <>
                  <div className="pt-3 border-t border-border">
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      분할 알고리즘
                    </label>
                    <select
                      value={boxAutoMethod}
                      onChange={(e) => setBoxAutoMethod(e.target.value as BoxAutoMethod)}
                      className="w-full bg-background-primary border border-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary"
                    >
                      <option value="grabcut">GrabCut (반복 개선) - 권장</option>
                      <option value="watershed">Watershed (Distance Transform)</option>
                      <option value="threshold">Adaptive Threshold (다중 병합)</option>
                      <option value="canny">Canny Edge 기반</option>
                      <option value="kmeans">K-Means Clustering (색상 기반)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleBoxAutoExtract}
                    disabled={isProcessing || !drawnBox}
                    className="w-full bg-gradient-accent text-background-primary font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        BOX AUTO 추출
                      </>
                    )}
                  </button>
                </>
              )}

              {extractionMode === 'polygon' && (
                <>
                  {polygonPoints.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-text-muted mb-2">
                        폴리곤 점: {polygonPoints.length}개
                      </p>
                      <button
                        onClick={handleResetPolygon}
                        className="w-full px-3 py-2 bg-background-elevated border border-border rounded text-xs text-text-primary hover:bg-border transition-colors mb-2"
                      >
                        폴리곤 리셋
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handlePolygonExtract}
                    disabled={isProcessing || polygonPoints.length < 3}
                    className="w-full bg-gradient-accent text-background-primary font-bold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        POLYGON 추출
                      </>
                    )}
                  </button>
                </>
              )}

              {/* 저장 버튼 (공통) */}
              <div className="pt-3 border-t border-border mt-auto">
                <button
                  onClick={handleSaveMaskAndPatch}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  저장 (Y)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: 결과 미리보기 + 마스크 후처리 (3열) */}
        <div className="grid grid-cols-3 gap-4" style={{minHeight: '500px'}}>

          {/* 좌측: 마스크 Preview */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <Circle className="w-5 h-5" />
              마스크 Preview
            </h3>
            <div className="aspect-square bg-background-elevated rounded border-2 border-border flex items-center justify-center overflow-hidden">
              {maskPreviewSrc ? (
                <img src={maskPreviewSrc} alt="Mask" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-text-muted text-sm p-8">
                  <Circle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>마스크 프리뷰</p>
                </div>
              )}
            </div>
          </div>

          {/* 중앙: 패치 Preview */}
          <div className="bg-background-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              패치 Preview
            </h3>
            <div className="aspect-square bg-background-elevated rounded border-2 border-border flex items-center justify-center overflow-hidden">
              {patchPreviewSrc ? (
                <img src={patchPreviewSrc} alt="Patch" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center text-text-muted text-sm p-8">
                  <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>패치 프리뷰</p>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 마스크 후처리 */}
          <div className="bg-background-card border border-border rounded-lg p-4 flex flex-col">
            <h3 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              🔧 마스크 후처리
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {/* Morphology 연산 */}
              <div className="p-3 bg-background-elevated rounded-lg border border-border">
                <h4 className="text-xs font-bold text-text-secondary mb-2">Morphology 연산</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleApplyOpening}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="노이즈 제거 (Erode → Dilate)"
                  >
                    Opening (O)
                  </button>
                  <button
                    onClick={handleApplyClosing}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="구멍 메우기 (Dilate → Erode)"
                  >
                    Closing (L)
                  </button>
                  <button
                    onClick={handleApplyErode}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                  >
                    Erode
                  </button>
                  <button
                    onClick={handleApplyDilate}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                  >
                    Dilate
                  </button>
                </div>
              </div>

              {/* Threshold 조정 */}
              <div className="p-3 bg-background-elevated rounded-lg border border-border">
                <h4 className="text-xs font-bold text-text-secondary mb-2">Threshold 조정</h4>
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="bg-background-primary rounded px-2 py-1 border border-border">
                    <span className="text-text-muted">Otsu:</span>
                    <span className="ml-1 text-text-primary font-mono">{otsuValue || '---'}</span>
                  </div>
                  <div className="bg-background-primary rounded px-2 py-1 border border-border">
                    <span className="text-text-muted">Offset:</span>
                    <span className="ml-1 text-accent-primary font-mono">{gvOffset}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={handleDecreaseGvOffset}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                  >
                    Offset - (U)
                  </button>
                  <button
                    onClick={handleIncreaseGvOffset}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                  >
                    Offset + (D)
                  </button>
                </div>
                <button
                  onClick={handleResetGvOffset}
                  className="w-full px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                >
                  Reset Offset (R)
                </button>
              </div>

              {/* Filter */}
              <div className="p-3 bg-background-elevated rounded-lg border border-border">
                <h4 className="text-xs font-bold text-text-secondary mb-2">Filter</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleApplyGaussian}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="Gaussian Blur (부드럽게)"
                  >
                    Gaussian
                  </button>
                  <button
                    onClick={handleApplyMedian}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="Median Blur (노이즈 제거)"
                  >
                    Median
                  </button>
                  <button
                    onClick={handleApplyBilateral}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="Bilateral Filter (경계 보존)"
                  >
                    Bilateral
                  </button>
                </div>
              </div>

              {/* Contour 선택 */}
              <div className="p-3 bg-background-elevated rounded-lg border border-border">
                <h4 className="text-xs font-bold text-text-secondary mb-2">Contour 선택</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleSelectLargestContour}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="면적이 가장 큰 Contour만 선택"
                  >
                    가장 큰 것
                  </button>
                  <button
                    onClick={handleSelectCenterContour}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="중심에 가장 가까운 Contour 선택"
                  >
                    중앙 것 (M)
                  </button>
                  <button
                    onClick={handleMergeContours}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                    title="모든 Contour를 Convex Hull로 병합"
                  >
                    모두 병합
                  </button>
                </div>
              </div>

              {/* 기타 */}
              <div className="p-3 bg-background-elevated rounded-lg border border-border">
                <h4 className="text-xs font-bold text-text-secondary mb-2">기타</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleInvertMask}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                  >
                    반전 (I)
                  </button>
                  <button
                    onClick={handleFillHoles}
                    className="px-2 py-1.5 bg-background-primary border border-border rounded text-xs text-text-primary hover:bg-border transition-colors"
                  >
                    구멍 메우기
                  </button>
                  <button
                    onClick={handleResetMask}
                    className="px-2 py-1.5 bg-background-primary border border-accent-primary text-accent-primary rounded text-xs hover:bg-accent-primary/10 transition-colors"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 로그 (하단 전체 너비) */}
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5" />
              실행 로그
            </h3>
            <button
              onClick={clearLog}
              className="px-3 py-1.5 bg-background-elevated border border-border rounded text-xs text-text-secondary hover:bg-border hover:text-text-primary transition-colors"
            >
              로그 지우기
            </button>
          </div>
          <div className="bg-background-elevated rounded border border-border p-3 h-32 overflow-y-auto font-mono text-xs text-text-muted">
            {log.length > 0 ? (
              log.map((entry, index) => (
                <div key={index} className="mb-1">
                  {entry}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-muted">
                로그가 여기에 표시됩니다...
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
