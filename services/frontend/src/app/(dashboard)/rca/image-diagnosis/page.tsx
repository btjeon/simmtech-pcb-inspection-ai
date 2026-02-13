'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Search,
  AlertCircle,
  CheckCircle,
  FileImage,
  Trash2,
  Loader2,
  ChevronRight,
  WifiOff,
  Save,
} from 'lucide-react';

// API 응답 타입
interface APIAnalysisResponse {
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
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: string;
}

// 프론트엔드 분석 결과 타입
interface AnalysisResult {
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
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

// API 기본 URL
const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

// 불량 유형 목록
const defectTypes = [
  '단선 (Open)',
  '쇼트 (Short)',
  '도금 불량',
  '솔더마스크 불량',
  '핀홀 (Pinhole)',
  '스크래치',
  '동박 박리',
  '패턴 불량',
  '오염',
  '기타 외관 불량',
];

export default function RCAImageDiagnosisPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [additionalContext, setAdditionalContext] = useState('');
  const [analysisDepth, setAnalysisDepth] = useState<'standard' | 'detailed'>('standard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<APIAnalysisResponse | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serviceAvailable, setServiceAvailable] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 서비스 상태 확인
  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/rca/status`);
        const data = await response.json();
        setServiceAvailable(data.available);
      } catch {
        setServiceAvailable(false);
      }
    };
    checkServiceStatus();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setRawApiResponse(null);
      setIsSaved(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setAnalysisResult(null);
      setRawApiResponse(null);
      setIsSaved(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setRawApiResponse(null);
    setIsSaved(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);
    setIsSaved(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('additional_context', additionalContext || '');
      formData.append('save_to_history', 'false'); // 분석 시에는 저장하지 않음

      const response = await fetch(`${API_BASE_URL}/api/v1/rca/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '분석 중 오류가 발생했습니다.');
      }

      const data: APIAnalysisResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석에 실패했습니다.');
      }

      // 원본 API 응답 저장 (나중에 저장 시 사용)
      setRawApiResponse(data);

      // API 응답을 프론트엔드 형식으로 변환
      setAnalysisResult({
        id: data.id,
        filename: data.filename,
        timestamp: data.timestamp,
        defectType: data.analysis.defect_type,
        severity: data.analysis.severity,
        confidence: data.analysis.confidence * 100, // 0-1 → 0-100 변환
        location: data.analysis.location,
        analysis: data.analysis.analysis,
        causes: data.analysis.causes,
        solutions: data.analysis.solutions,
        processChecks: data.analysis.process_checks,
        tokenUsage: data.usage ? {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
          total: data.usage.total_tokens,
        } : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setAnalysisResult(null);
      setRawApiResponse(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 분석 결과를 이력에 저장
  const handleSaveToHistory = async () => {
    if (!rawApiResponse) return;

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/rca/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_id: rawApiResponse.id,
          filename: rawApiResponse.filename,
          timestamp: rawApiResponse.timestamp,
          analysis: rawApiResponse.analysis,
          usage: rawApiResponse.usage,
          additional_context: additionalContext || '',
        }),
      });

      if (response.ok) {
        setIsSaved(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '저장에 실패했습니다.');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-400';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400';
      case 'low': return 'text-green-400 bg-green-400/10 border-green-400';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400';
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

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-5">
        <div className="flex items-center gap-3">
          <Search className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-2xl font-light text-white">PCB 불량 이미지 진단 AI</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
              <span>AI 불량 원인 분석 (RCA)</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-cyan-400">이미지 기반 진단</span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-gray-400">
          이미지를 업로드하면 AI가 불량을 자동으로 분석하고 원인 및 해결방안을 제시합니다
        </p>
        {/* 서비스 상태 표시 */}
        {serviceAvailable === false && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <WifiOff className="w-5 h-5 text-red-400" />
            <span className="text-red-400 text-sm">
              AI 서비스에 연결할 수 없습니다. OpenAI API 키를 확인하거나 백엔드 서버가 실행 중인지 확인해주세요.
            </span>
          </div>
        )}
        {serviceAvailable === true && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400 text-sm">
              AI 서비스 연결됨 (GPT-4o Vision)
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-6">
        {/* 좌측: 이미지 업로드 */}
        <div className="space-y-5">
          {/* 이미지 업로드 영역 */}
          <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-6">
            <h3 className="text-base font-medium text-cyan-400 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              이미지 업로드
            </h3>

            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-cyan-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-500/5 transition-all"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <FileImage className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-300 mb-2">PCB 이미지를 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500">지원 형식: PNG, JPG, JPEG, WebP, BMP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-black/30">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="업로드된 이미지"
                      className="w-full h-64 object-contain"
                    />
                  )}
                  <button
                    onClick={handleRemoveFile}
                    className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FileImage className="w-4 h-4" />
                  <span>{selectedFile.name}</span>
                  <span className="text-gray-600">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              </div>
            )}
          </div>

          {/* 추가 정보 입력 */}
          <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-6">
            <h3 className="text-base font-medium text-cyan-400 mb-4">추가 정보 (선택)</h3>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="예: 내층 공정 후 발견됨, 특정 로트에서만 발생, 육안으로 단선 의심 등..."
              rows={3}
              className="w-full px-3 py-2.5 bg-black/30 border border-cyan-500/30 rounded-lg text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
            />

            <div className="mt-4">
              <label className="block text-sm text-gray-300 mb-2">분석 Level</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setAnalysisDepth('standard')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    analysisDepth === 'standard'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  표준 분석
                </button>
                <button
                  onClick={() => setAnalysisDepth('detailed')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    analysisDepth === 'detailed'
                      ? 'bg-cyan-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  상세 분석
                </button>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* 분석 버튼 */}
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing || serviceAvailable === false}
              className="w-full mt-5 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-cyan-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI가 이미지를 분석하고 있습니다...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  분석 시작
                </>
              )}
            </button>
          </div>

          {/* 검출 가능한 불량 유형 */}
          <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-6">
            <h3 className="text-base font-medium text-cyan-400 mb-4">검출 가능한 불량 유형</h3>
            <div className="grid grid-cols-2 gap-2">
              {defectTypes.map((type) => (
                <div key={type} className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {type}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측: 분석 결과 */}
        <div className="bg-gray-800/70 border border-cyan-500/20 rounded-lg p-6 h-fit">
          <h3 className="text-base font-medium text-cyan-400 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            분석 결과
          </h3>

          {!analysisResult && !isAnalyzing && (
            <div className="text-center py-16 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>이미지를 업로드하고 분석을 시작하세요</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="text-center py-16">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-cyan-400 animate-spin" />
              <p className="text-gray-300">AI가 이미지를 분석하고 있습니다...</p>
              <p className="text-sm text-gray-500 mt-2">불량 유형 판별 및 원인 분석 중</p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-6">
              {/* 불량 판정 결과 */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-cyan-400" />
                  불량 판정 결과
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">불량 유형</span>
                    <span className="text-cyan-400 font-medium">{analysisResult.defectType}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">신뢰도</span>
                    <span className="text-white font-medium">{analysisResult.confidence}%</span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-xs text-gray-500 block mb-1">심각도</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(analysisResult.severity)}`}>
                    {getSeverityLabel(analysisResult.severity)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 block mb-1">분석 결과</span>
                  <p className="text-sm text-gray-300 leading-relaxed">{analysisResult.analysis}</p>
                </div>
              </div>

              {/* 원인 분석 */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  원인 분석
                </h4>
                <ul className="space-y-2">
                  {analysisResult.causes.map((cause, index) => (
                    <li key={index} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-yellow-400 font-semibold">{index + 1}.</span>
                      {cause}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <span className="text-xs text-gray-500 block mb-2">공정별 점검 포인트</span>
                  {analysisResult.processChecks.map((item, index) => (
                    <div key={index} className="flex gap-2 text-sm text-gray-400 mb-1">
                      <span className="text-cyan-400">{item.process}:</span>
                      <span>{item.check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 해결방안 */}
              <div className="bg-black/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  해결방안
                </h4>
                <ul className="space-y-2">
                  {analysisResult.solutions.map((solution, index) => (
                    <li key={index} className="flex gap-2 text-sm text-gray-300">
                      <span className="text-green-400 font-semibold">{index + 1}.</span>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 파일 정보 */}
              <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
                <p>파일명: {analysisResult.filename}</p>
                <p>분석 시간: {new Date(analysisResult.timestamp).toLocaleString('ko-KR')}</p>
                <p>분석 ID: {analysisResult.id}</p>
                {analysisResult.tokenUsage && (
                  <p className="mt-1 text-cyan-400/70">
                    토큰 사용: {analysisResult.tokenUsage.total.toLocaleString()}
                    (입력: {analysisResult.tokenUsage.prompt.toLocaleString()}, 출력: {analysisResult.tokenUsage.completion.toLocaleString()})
                  </p>
                )}
              </div>

              {/* 이력 저장 버튼 */}
              <div className="pt-4 border-t border-gray-700">
                {isSaved ? (
                  <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">이력에 저장되었습니다</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveToHistory}
                    disabled={isSaving}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        분석 결과를 이력에 저장
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
