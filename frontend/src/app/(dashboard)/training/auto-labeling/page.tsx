'use client';

import { useState } from 'react';
import {
  Zap,
  Check,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';

// 이미지 카드 타입
interface LabeledImage {
  id: string;
  imageUrl: string;
  label: string;
  labelType: 'OK' | 'NG';
  confidence: number;
  status: 'auto' | 'review';
  bundle: string;
  timestamp: string;
}

// 목업 데이터
const mockImages: LabeledImage[] = [
  { id: 'IMG_001_045', imageUrl: '', label: '정상', labelType: 'OK', confidence: 98.7, status: 'auto', bundle: 'BUNDLE-001', timestamp: '2024-12-04 14:23' },
  { id: 'IMG_001_046', imageUrl: '', label: '스크래치', labelType: 'NG', confidence: 96.2, status: 'auto', bundle: 'BUNDLE-001', timestamp: '2024-12-04 14:23' },
  { id: 'IMG_001_047', imageUrl: '', label: '정상', labelType: 'OK', confidence: 94.5, status: 'auto', bundle: 'BUNDLE-001', timestamp: '2024-12-04 14:24' },
  { id: 'IMG_001_048', imageUrl: '', label: '보이드 의심', labelType: 'NG', confidence: 87.3, status: 'review', bundle: 'BUNDLE-001', timestamp: '2024-12-04 14:24' },
  { id: 'IMG_001_049', imageUrl: '', label: '쇼트', labelType: 'NG', confidence: 99.1, status: 'auto', bundle: 'BUNDLE-002', timestamp: '2024-12-04 14:24' },
  { id: 'IMG_001_050', imageUrl: '', label: '정상', labelType: 'OK', confidence: 97.8, status: 'auto', bundle: 'BUNDLE-002', timestamp: '2024-12-04 14:25' },
  { id: 'IMG_001_051', imageUrl: '', label: '오염 의심', labelType: 'NG', confidence: 82.6, status: 'review', bundle: 'BUNDLE-002', timestamp: '2024-12-04 14:25' },
  { id: 'IMG_001_052', imageUrl: '', label: '정상', labelType: 'OK', confidence: 95.4, status: 'auto', bundle: 'BUNDLE-002', timestamp: '2024-12-04 14:26' },
];

// LOT 옵션
const lotOptions = ['LOT-2024-12-001', 'LOT-2024-12-002', 'LOT-2024-12-003', 'LOT-2024-12-004', 'LOT-2024-12-005'];

// Bundle 옵션
const bundleOptions = ['BUNDLE-001', 'BUNDLE-002', 'BUNDLE-003', 'BUNDLE-004'];

// 모델 옵션
const modelOptions = [
  { value: 'v1.3.0_dev', label: 'v1.3.0_dev (정확도: 98.1%)' },
  { value: 'v1.2.0_prod', label: 'v1.2.0_prod (정확도: 97.3%)' },
  { value: 'v1.1.5_prod', label: 'v1.1.5_prod (정확도: 96.8%)' },
  { value: 'v1.0.8_prod', label: 'v1.0.8_prod (정확도: 95.9%)' },
];

export default function AutoLabelingPage() {
  const [selectedLot, setSelectedLot] = useState('LOT-2024-12-004');
  const [selectedBundles, setSelectedBundles] = useState<string[]>(['BUNDLE-001', 'BUNDLE-002']);
  const [labelingMethod, setLabelingMethod] = useState<'ai-model' | 'rule-based' | 'hybrid'>('ai-model');
  const [selectedModel, setSelectedModel] = useState('v1.2.0_prod');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.90);
  const [activeTab, setActiveTab] = useState<'auto' | 'review' | 'history'>('auto');

  // 진행 상황
  const [progress] = useState({
    current: 1250,
    total: 2000,
    autoApproved: 987,
    needsReview: 263,
    processing: 750,
  });

  const progressPercent = ((progress.current / progress.total) * 100).toFixed(1);

  const handleBundleChange = (bundle: string) => {
    setSelectedBundles(prev =>
      prev.includes(bundle)
        ? prev.filter(b => b !== bundle)
        : [...prev, bundle]
    );
  };

  const handleStartLabeling = () => {
    alert(`자동 레이블링을 시작합니다!\n\n선택된 설정:\n- LOT: ${selectedLot}\n- Bundle: ${selectedBundles.join(', ')}\n- 방식: ${labelingMethod}\n- 모델: ${selectedModel}\n- 임계값: ${confidenceThreshold}`);
  };

  const filteredImages = mockImages.filter(img => {
    if (activeTab === 'auto') return img.status === 'auto';
    if (activeTab === 'review') return img.status === 'review';
    return true;
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-400';
    if (confidence >= 85) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-light text-white">자동 레이블링 (Auto-Labeling)</h1>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
              <span>AI 학습 관리</span>
              <ChevronRight className="w-4 h-4" />
              <span>학습 데이터 추가 및 정합성 검증</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-cyan-400">자동 레이블링</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 레이아웃 */}
      <div className="grid grid-cols-[400px_1fr] gap-5 h-[calc(100vh-220px)]">
        {/* 좌측 패널: 설정 */}
        <div className="space-y-5 overflow-y-auto">
          {/* 레이블링 대상 설정 */}
          <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-6">
            <h3 className="text-base font-medium text-cyan-400 mb-5 pb-3 border-b border-cyan-500/20">
              레이블링 대상 설정
            </h3>

            {/* LOT 선택 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-300 mb-2 font-medium">LOT 선택</label>
              <select
                value={selectedLot}
                onChange={(e) => setSelectedLot(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/30 border border-cyan-500/30 rounded text-gray-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              >
                {lotOptions.map(lot => (
                  <option key={lot} value={lot}>{lot}</option>
                ))}
              </select>
            </div>

            {/* Bundle 선택 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-300 mb-2 font-medium">Bundle 선택 (복수 선택 가능)</label>
              <div className="space-y-2">
                {bundleOptions.map(bundle => (
                  <label
                    key={bundle}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all ${
                      selectedBundles.includes(bundle)
                        ? 'bg-cyan-500/20 border border-cyan-500'
                        : 'bg-black/20 border border-cyan-500/20 hover:bg-cyan-500/10'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedBundles.includes(bundle)}
                      onChange={() => handleBundleChange(bundle)}
                      className="accent-cyan-400"
                    />
                    <span className="text-sm text-gray-200">{bundle}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 레이블링 방식 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-300 mb-2 font-medium">레이블링 방식</label>
              <div className="space-y-2">
                {[
                  { value: 'ai-model', label: 'AI 모델 기반 (Pre-labeling)' },
                  { value: 'rule-based', label: 'Rule 기반' },
                  { value: 'hybrid', label: '하이브리드 (AI + Rule)' },
                ].map(option => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-all ${
                      labelingMethod === option.value
                        ? 'bg-cyan-500/20 border border-cyan-500'
                        : 'bg-black/20 border border-cyan-500/20 hover:bg-cyan-500/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={option.value}
                      checked={labelingMethod === option.value}
                      onChange={(e) => setLabelingMethod(e.target.value as typeof labelingMethod)}
                      className="accent-cyan-400"
                    />
                    <span className="text-sm text-gray-200">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI 모델 선택 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-300 mb-2 font-medium">사용할 AI 모델</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/30 border border-cyan-500/30 rounded text-gray-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30"
              >
                {modelOptions.map(model => (
                  <option key={model.value} value={model.value}>{model.label}</option>
                ))}
              </select>
            </div>

            {/* Confidence 임계값 */}
            <div className="mb-5">
              <label className="block text-sm text-gray-300 mb-2 font-medium">자동 레이블링 임계값</label>
              <div className="py-2">
                <input
                  type="range"
                  min="0.70"
                  max="0.99"
                  step="0.01"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-cyan-500/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>0.70</span>
                  <span className="text-cyan-400 font-semibold text-sm">
                    Confidence &ge; {confidenceThreshold.toFixed(2)}
                  </span>
                  <span>0.99</span>
                </div>
              </div>
              <div className="mt-2 p-2 bg-cyan-500/5 border-l-2 border-cyan-400 rounded text-xs text-gray-400">
                <p>임계값 이상: 자동 레이블</p>
                <p>임계값 미만: 수동 검수 대기</p>
              </div>
            </div>

            {/* 실행 버튼 */}
            <button
              onClick={handleStartLabeling}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5"
            >
              <Zap className="w-4 h-4" />
              자동 레이블링 실행
            </button>
          </div>

          {/* 진행 상황 */}
          <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-6">
            <h3 className="text-base font-medium text-cyan-400 mb-5 pb-3 border-b border-cyan-500/20">
              진행 상황
            </h3>

            {/* 프로그레스 바 */}
            <div className="bg-black/30 rounded-lg h-8 overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-xs font-semibold text-white transition-all"
                style={{ width: `${progressPercent}%` }}
              >
                {progress.current.toLocaleString()} / {progress.total.toLocaleString()} 이미지 ({progressPercent}%)
              </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-black/30 border border-white/10 rounded-lg p-3.5 text-center">
                <div className="text-2xl font-bold text-green-400">{progress.autoApproved.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wide">자동 레이블</div>
              </div>
              <div className="bg-black/30 border border-white/10 rounded-lg p-3.5 text-center">
                <div className="text-2xl font-bold text-yellow-400">{progress.needsReview.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wide">수동 검수</div>
              </div>
              <div className="bg-black/30 border border-white/10 rounded-lg p-3.5 text-center">
                <div className="text-2xl font-bold text-cyan-400 animate-pulse">{progress.processing.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500 uppercase tracking-wide">처리 중</div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 패널: 결과 */}
        <div className="flex flex-col overflow-hidden">
          {/* 탭 */}
          <div className="flex gap-0.5 bg-black/30 rounded-t-lg p-1">
            <button
              onClick={() => setActiveTab('auto')}
              className={`flex-1 py-3 px-5 rounded-t-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'auto'
                  ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:bg-cyan-500/10 hover:text-gray-300'
              }`}
            >
              <Check className="w-4 h-4" />
              자동 레이블 결과 ({progress.autoApproved})
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-3 px-5 rounded-t-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'review'
                  ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:bg-cyan-500/10 hover:text-gray-300'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              수동 검수 대기 ({progress.needsReview})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-5 rounded-t-md text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500/20 text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-gray-500 hover:bg-cyan-500/10 hover:text-gray-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              레이블링 이력
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 bg-gray-800/70 border border-cyan-500/20 border-t-0 rounded-b-lg p-5 overflow-y-auto">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="bg-black/30 border border-cyan-500/20 rounded-lg overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40 hover:border-cyan-400"
                >
                  {/* 이미지 영역 */}
                  <div className="relative w-full pt-[100%] bg-black/50">
                    <div className="absolute inset-0 flex items-center justify-center text-cyan-400 text-sm">
                      PCB Image {image.id.split('_').pop()}
                    </div>
                    <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/70 backdrop-blur ${getConfidenceColor(image.confidence)}`}>
                      {image.confidence}%
                    </div>
                  </div>

                  {/* 정보 영역 */}
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        image.status === 'auto'
                          ? 'bg-green-400/20 text-green-400 border border-green-400'
                          : 'bg-yellow-400/20 text-yellow-400 border border-yellow-400'
                      }`}>
                        {image.status === 'auto' ? '자동' : '검수'}
                      </span>
                      <span className="text-sm font-semibold text-cyan-400">
                        {image.label} ({image.labelType})
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mb-3">
                      {image.id} &bull; {image.bundle} &bull; {image.timestamp}
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-1.5 px-3 bg-green-400/10 border border-green-400 text-green-400 rounded text-xs font-medium hover:bg-green-400/20 transition-colors">
                        승인
                      </button>
                      {image.status === 'review' && (
                        <button className="flex-1 py-1.5 px-3 bg-red-400/10 border border-red-400 text-red-400 rounded text-xs font-medium hover:bg-red-400/20 transition-colors">
                          거부
                        </button>
                      )}
                      <button className="flex-1 py-1.5 px-3 bg-cyan-400/10 border border-cyan-400 text-cyan-400 rounded text-xs font-medium hover:bg-cyan-400/20 transition-colors">
                        수정
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
