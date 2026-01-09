'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  FolderOpen,
  Settings,
  Sparkles,
  Save,
  Eye,
  FileText,
  Image as ImageIcon
} from 'lucide-react';

export default function DefectSynthesisPage() {
  const [goodImagePath, setGoodImagePath] = useState('');
  const [patchPath, setPatchPath] = useState('');
  const [maskPath, setMaskPath] = useState('');
  const [posX, setPosX] = useState(100);
  const [posY, setPosY] = useState(100);
  const [scaleX, setScaleX] = useState(1.0);
  const [scaleY, setScaleY] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [alpha, setAlpha] = useState(0.8);
  const [blur, setBlur] = useState(1);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleSynthesize = () => {
    addLog('이미지 합성 시작...');
    addLog(`위치: (${posX}, ${posY}), 크기: (${scaleX}, ${scaleY})`);
    addLog(`회전: ${rotation}°, 투명도: ${alpha}, 블러: ${blur}`);

    // TODO: FastAPI 백엔드 호출
    setTimeout(() => {
      addLog('합성 완료! (Mock)');
    }, 1000);
  };

  const handleSave = () => {
    addLog('저장 중...');
    setTimeout(() => {
      addLog('저장 완료! (Mock)');
    }, 500);
  };

  const clearLog = () => {
    setLog([]);
  };

  return (
    <>
      <PageHeader
        title="불량 이미지 합성"
        subtitle="양품 PCB 이미지에 불량 패치를 합성하여 학습용 데이터를 생성합니다"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 좌측: 컨트롤 패널 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 이미지 로드 */}
          <div className="bg-background-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              이미지 로드
            </h3>

            <div className="space-y-4">
              {/* 양품 이미지 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  양품 이미지 폴더
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={goodImagePath}
                    onChange={(e) => setGoodImagePath(e.target.value)}
                    placeholder="C:\Images\Good"
                    className="flex-1 bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={() => addLog('양품 이미지 로드 (Mock)')}
                    className="px-3 py-2 bg-accent-primary text-background-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    로드
                  </button>
                </div>
              </div>

              {/* 패치 폴더 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  패치 폴더
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={patchPath}
                    onChange={(e) => setPatchPath(e.target.value)}
                    placeholder="C:\Output\patches"
                    className="flex-1 bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={() => addLog('패치 로드 (Mock)')}
                    className="px-3 py-2 bg-accent-primary text-background-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    로드
                  </button>
                </div>
              </div>

              {/* 마스크 폴더 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  마스크 폴더
                </label>
                <input
                  type="text"
                  value={maskPath}
                  onChange={(e) => setMaskPath(e.target.value)}
                  placeholder="C:\Output\masks"
                  className="w-full bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                />
              </div>
            </div>
          </div>

          {/* 합성 설정 */}
          <div className="bg-background-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              합성 설정
            </h3>

            <div className="space-y-4">
              {/* 위치 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  위치 (X, Y)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={posX}
                    onChange={(e) => setPosX(parseInt(e.target.value))}
                    placeholder="X"
                    className="bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <input
                    type="number"
                    value={posY}
                    onChange={(e) => setPosY(parseInt(e.target.value))}
                    placeholder="Y"
                    className="bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              {/* 크기 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  크기 배율 (X, Y)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={scaleX}
                    onChange={(e) => setScaleX(parseFloat(e.target.value))}
                    step="0.1"
                    placeholder="Scale X"
                    className="bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                  <input
                    type="number"
                    value={scaleY}
                    onChange={(e) => setScaleY(parseFloat(e.target.value))}
                    step="0.1"
                    placeholder="Scale Y"
                    className="bg-background-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              {/* 회전 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  회전: <span className="text-accent-primary">{rotation}°</span>
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>-180°</span>
                  <span>180°</span>
                </div>
              </div>

              {/* 투명도 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  투명도: <span className="text-accent-primary">{alpha.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="w-full h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* 블러 */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">
                  블러: <span className="text-accent-primary">{blur}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={blur}
                  onChange={(e) => setBlur(parseInt(e.target.value))}
                  className="w-full h-2 bg-background-elevated rounded-lg appearance-none cursor-pointer accent-accent-primary"
                />
              </div>

              {/* 실행 버튼 */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSynthesize}
                  className="w-full bg-gradient-accent text-background-primary font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  합성 실행
                </button>
                <button
                  onClick={handleSave}
                  className="w-full bg-status-success text-background-primary font-bold py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 미리보기 */}
        <div className="lg:col-span-2">
          <div className="bg-background-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              미리보기
            </h3>

            <div className="bg-background-primary border border-border rounded-lg aspect-video flex items-center justify-center">
              <div className="text-center text-text-muted flex flex-col items-center gap-4">
                <ImageIcon className="w-24 h-24" />
                <p>이미지를 로드하고 합성을 실행하세요</p>
              </div>
            </div>

            {/* 이미지 정보 */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">양품 이미지:</span>
                <span className="text-text-primary">-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">패치:</span>
                <span className="text-text-primary">-</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 로그 섹션 */}
      <div className="bg-background-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5" />
            로그
          </h3>
          <button
            onClick={clearLog}
            className="px-3 py-1 bg-background-elevated border border-border rounded text-sm text-text-secondary hover:bg-border transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="bg-background-primary border border-border rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
          {log.length === 0 ? (
            <div className="text-text-muted text-center py-8">
              작업을 시작하면 로그가 여기에 표시됩니다.
            </div>
          ) : (
            <div className="space-y-1">
              {log.map((line, index) => (
                <div key={index} className="text-text-secondary">
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
