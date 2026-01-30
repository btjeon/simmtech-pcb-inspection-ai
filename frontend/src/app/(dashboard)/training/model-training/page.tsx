'use client';

import { useState, useRef, useEffect } from 'react';

// ========== Mock Data ==========

const equipmentOptions = [
  { value: '', label: '장비를 선택하세요' },
  { value: 'ATI 2.0', label: 'ATI 2.0' },
  { value: 'ATI 5.5', label: 'ATI 5.5' },
  { value: 'PIXEL 2.0', label: 'PIXEL 2.0' },
  { value: 'PIXEL 5.5', label: 'PIXEL 5.5' },
];

const modelTypeOptions = [
  { value: '', label: '모델을 선택하세요' },
  { value: 'FALSE', label: 'FALSE' },
  { value: 'CLF-AREA', label: 'CLF-AREA' },
  { value: 'CLF-DEFECT', label: 'CLF-DEFECT' },
  { value: 'CLF-SEG AREA', label: 'CLF-SEG AREA' },
  { value: 'CLF-SEG DEFECT', label: 'CLF-SEG DEFECT' },
];

const datasetOptions = [
  'PIXEL5.5_FALSE_Merged_2025-01',
  'PIXEL5.5_FALSE_Dataset_2025-01',
  'PIXEL5.5_FALSE_Dataset_2024-12',
];

const gpuOptions = [
  { value: '0', label: 'GPU 0 (NVIDIA A100 - Available)', disabled: false },
  { value: '1', label: 'GPU 1 (NVIDIA A100 - Available)', disabled: false },
  { value: '2', label: 'GPU 2 (NVIDIA H100 - In Use)', disabled: true },
];

const learningRateOptions = [
  { value: '0.0001', label: '0.0001 (느림, 안정적)' },
  { value: '0.0005', label: '0.0005' },
  { value: '0.001', label: '0.001 (권장)' },
  { value: '0.005', label: '0.005' },
  { value: '0.01', label: '0.01 (빠름, 불안정 위험)' },
];

const modelResults = [
  { epoch: 85, testAcc: 98.2, missRate: 1.2, overRate: 0.6, lr: '0.0001', grade: 'EXCELLENT', file: 'model_epoch_85.pth' },
  { epoch: 92, testAcc: 98.1, missRate: 1.5, overRate: 0.4, lr: '0.0001', grade: 'GOOD', file: 'model_epoch_92.pth' },
  { epoch: 78, testAcc: 97.8, missRate: 1.8, overRate: 0.4, lr: '0.001', grade: 'GOOD', file: 'model_epoch_78.pth' },
];

// ========== Types ==========
type TrainingStatus = 'idle' | 'training' | 'paused' | 'completed';
type LogType = 'info' | 'success' | 'warning' | 'error';

interface LogEntry {
  time: string;
  message: string;
  type: LogType;
}

// ========== Component ==========
export default function ModelTrainingPage() {
  // Config state
  const [equipment, setEquipment] = useState('PIXEL 5.5');
  const [modelType, setModelType] = useState('FALSE');
  const [dataset, setDataset] = useState(datasetOptions[0]);
  const [gpu, setGpu] = useState('0');
  const [batchSize, setBatchSize] = useState(32);
  const [epochs, setEpochs] = useState(100);
  const [learningRate, setLearningRate] = useState('0.001');

  // Training state
  const [status, setStatus] = useState<TrainingStatus>('idle');
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const [remainingTime, setRemainingTime] = useState('--:--:--');

  // Metrics state
  const [trainLoss, setTrainLoss] = useState('0.0000');
  const [valLoss, setValLoss] = useState('0.0000');
  const [accuracy, setAccuracy] = useState('0.0%');
  const [gpuUsage, setGpuUsage] = useState('0%');

  // Log state
  const [logs, setLogs] = useState<LogEntry[]>([
    { time: '--:--:--', message: '[시스템] 학습 대기 중...', type: 'info' },
  ]);

  // Model selection
  const [selectedModel, setSelectedModel] = useState(0);

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const epochRef = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const addLog = (message: string, type: LogType = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString('ko-KR');
    setLogs(prev => [...prev, { time, message, type }]);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor((ms / 1000) % 60);
    const m = Math.floor((ms / (1000 * 60)) % 60);
    const h = Math.floor(ms / (1000 * 60 * 60));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startTraining = () => {
    if (batchSize < 16 || batchSize > 64) {
      addLog('[오류] Batch Size가 허용 범위(16-64)를 벗어났습니다.', 'error');
      return;
    }
    if (epochs < 50 || epochs > 200) {
      addLog('[오류] Epochs가 허용 범위(50-200)를 벗어났습니다.', 'error');
      return;
    }

    setStatus('training');
    startTimeRef.current = Date.now();
    epochRef.current = 0;
    setCurrentEpoch(0);
    setProgress(0);

    addLog('[시스템] 학습 시작...', 'info');
    addLog(`[설정] Batch Size: ${batchSize}, Epochs: ${epochs}, LR: ${learningRate}, Optimizer: Adam`, 'info');
    addLog('[시스템] 데이터셋 로딩 중...', 'info');

    setTimeout(() => {
      addLog('[성공] 데이터셋 로딩 완료 - Train: 20,014 | Val: 5,718 | Test: 2,860', 'success');
      addLog('[시스템] 모델 초기화 중...', 'info');

      setTimeout(() => {
        addLog(`[성공] 모델 초기화 완료 (GPU ${gpu})`, 'success');
        addLog(`[시스템] Epoch 1/${epochs} 시작...`, 'info');

        intervalRef.current = setInterval(() => {
          epochRef.current += 1;
          const ep = epochRef.current;

          if (ep > epochs) {
            completeTraining();
            return;
          }

          const prog = parseFloat((ep / epochs * 100).toFixed(1));
          setCurrentEpoch(ep);
          setProgress(prog);

          const elapsed = Date.now() - (startTimeRef.current || 0);
          setElapsedTime(formatTime(elapsed));
          const avgTime = elapsed / ep;
          setRemainingTime(formatTime(avgTime * (epochs - ep)));

          const tl = (0.5 - ep * 0.004 + Math.random() * 0.01).toFixed(4);
          const vl = (0.55 - ep * 0.0038 + Math.random() * 0.01).toFixed(4);
          const acc = (85 + ep * 0.12 + Math.random() * 2).toFixed(1);
          const gpuU = (75 + Math.random() * 20).toFixed(0);

          setTrainLoss(tl);
          setValLoss(vl);
          setAccuracy(`${acc}%`);
          setGpuUsage(`${gpuU}%`);

          if (ep % 10 === 0) {
            addLog(`[정보] Epoch ${ep}/${epochs} - Loss: ${tl}, Val Loss: ${vl}, Acc: ${acc}%`, 'info');
          }
        }, 800);
      }, 1000);
    }, 1000);
  };

  const pauseTraining = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('paused');
    addLog('[시스템] 학습 일시정지', 'warning');
  };

  const stopTraining = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    completeTraining();
  };

  const completeTraining = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStatus('completed');
    addLog('[시스템] 학습 완료!', 'success');
  };

  const clearLogs = () => {
    setLogs([{ time: '--:--:--', message: '[시스템] 로그가 지워졌습니다.', type: 'info' }]);
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'idle': return { text: '대기중', cls: 'bg-gray-600 text-gray-300' };
      case 'training': return { text: '학습중', cls: 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50 animate-pulse' };
      case 'paused': return { text: '일시정지', cls: 'bg-orange-500/30 text-orange-400 border border-orange-500/50' };
      case 'completed': return { text: '완료', cls: 'bg-green-500/30 text-green-400 border border-green-500/50' };
    }
  };

  const getGradeBadge = (grade: string) => {
    if (grade === 'EXCELLENT') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
    return 'bg-blue-500/20 text-blue-400 border border-blue-500/50';
  };

  const getLogColor = (type: LogType) => {
    switch (type) {
      case 'info': return 'text-blue-400';
      case 'success': return 'text-emerald-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
    }
  };

  const badge = getStatusBadge();
  const isTraining = status === 'training';
  const showMonitor = status !== 'idle';

  // Select/Input common class
  const selectCls = "w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100";
  const optionCls = "bg-gray-800 text-gray-100";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">모델 학습 및 결과 분석</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${badge.cls}`}>
            {badge.text}
          </span>
        </div>
        <p className="text-muted-foreground mt-1">Model Training & Performance Analysis System</p>
      </div>

      {/* Process Flow */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: '장비/모델 선택' },
            { step: 2, title: '데이터 선택' },
            { step: 3, title: '학습 시작' },
            { step: 4, title: '결과 분석' },
          ].map((item, i) => (
            <div key={item.step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-cyan-500/30">
                  {item.step}
                </div>
                <span className="text-sm font-medium text-foreground mt-2">{item.title}</span>
              </div>
              {i < 3 && (
                <span className="text-cyan-400 text-2xl font-bold mx-6">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1-2: 학습 구성 설정 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">STEP 1-2. 학습 구성 설정</h2>

        <div className="grid grid-cols-4 gap-5">
          {/* Equipment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">검사 장비 선택</label>
            <select value={equipment} onChange={e => setEquipment(e.target.value)} className={selectCls}>
              {equipmentOptions.map(o => (
                <option key={o.value} value={o.value} className={optionCls}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Model Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">AI 모델 타입</label>
            <select value={modelType} onChange={e => setModelType(e.target.value)} className={selectCls}>
              {modelTypeOptions.map(o => (
                <option key={o.value} value={o.value} className={optionCls}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Dataset */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">학습 데이터 폴더</label>
            <select value={dataset} onChange={e => setDataset(e.target.value)} className={selectCls}>
              {datasetOptions.map(d => (
                <option key={d} value={d} className={optionCls}>{d}</option>
              ))}
            </select>
          </div>

          {/* GPU */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">GPU 선택</label>
            <select value={gpu} onChange={e => setGpu(e.target.value)} className={selectCls}>
              {gpuOptions.map(o => (
                <option key={o.value} value={o.value} disabled={o.disabled} className={optionCls}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Batch Size */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Batch Size
              <span className="ml-2 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">허용: 16 - 64</span>
            </label>
            <input
              type="number"
              value={batchSize}
              onChange={e => setBatchSize(parseInt(e.target.value) || 32)}
              min={16} max={64} step={8}
              className={selectCls}
            />
            <p className="text-xs text-gray-500 italic">권장: 32 | 최소: 16 | 최대: 64</p>
          </div>

          {/* Epochs */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Epochs
              <span className="ml-2 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">허용: 50 - 200</span>
            </label>
            <input
              type="number"
              value={epochs}
              onChange={e => setEpochs(parseInt(e.target.value) || 100)}
              min={50} max={200} step={10}
              className={selectCls}
            />
            <p className="text-xs text-gray-500 italic">권장: 100 | 최소: 50 | 최대: 200</p>
          </div>

          {/* Learning Rate */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Learning Rate
              <span className="ml-2 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">허용: 0.0001 - 0.01</span>
            </label>
            <select value={learningRate} onChange={e => setLearningRate(e.target.value)} className={selectCls}>
              {learningRateOptions.map(o => (
                <option key={o.value} value={o.value} className={optionCls}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 italic">권장: 0.001</p>
          </div>

          {/* Optimizer (Fixed) */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">
              Optimizer
              <span className="ml-2 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/30">고정</span>
            </label>
            <select disabled className={`${selectCls} opacity-60 cursor-not-allowed`}>
              <option className={optionCls}>Adam (시스템 고정)</option>
            </select>
            <p className="text-xs text-gray-500 italic">모델 안정성을 위해 고정됨</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/30 border-l-4 border-l-blue-500 rounded-lg text-sm text-gray-300 leading-relaxed">
          <strong>ℹ️ 하이퍼파라미터 설정 안내:</strong><br />
          • <strong>Batch Size</strong>: 메모리 사용량과 학습 속도에 영향 (권장: 32)<br />
          • <strong>Epochs</strong>: 학습 반복 횟수, 많을수록 정확하지만 과적합 위험 (권장: 100)<br />
          • <strong>Learning Rate</strong>: 학습 속도, 너무 크면 불안정, 너무 작으면 느림 (권장: 0.001)<br />
          • <strong>모델 구조 및 아키텍처는 시스템 최적화를 위해 고정</strong>되어 있습니다.
        </div>

        {/* Warning Box */}
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 border-l-4 border-l-yellow-500 rounded-lg text-sm text-gray-300 leading-relaxed">
          <strong>⚠️ 주의사항:</strong><br />
          • 하이퍼파라미터는 <strong>허용된 범위 내에서만</strong> 조정 가능합니다.<br />
          • 모델 구조, 레이어 수, 활성화 함수 등 아키텍처 설정은 <strong>변경할 수 없습니다</strong>.<br />
          • 권장 값에서 크게 벗어나면 학습 성능이 저하될 수 있습니다.
        </div>
      </div>

      {/* STEP 3: 학습 실행 및 모니터링 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">STEP 3. 학습 실행 및 모니터링</h2>

        {/* Buttons */}
        <div className="flex gap-3 mb-5">
          <button
            onClick={startTraining}
            disabled={isTraining}
            className="px-5 py-2.5 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ▶ 학습 시작
          </button>
          <button
            onClick={pauseTraining}
            disabled={!isTraining}
            className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 transition-colors"
          >
            ⏸ 일시정지
          </button>
          <button
            onClick={stopTraining}
            disabled={!isTraining && status !== 'paused'}
            className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600 transition-colors"
          >
            ⏹ 중지
          </button>
        </div>

        {/* Training Status Panel */}
        {showMonitor && (
          <>
            <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-5 space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-sm text-gray-400">학습 상태</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.cls}`}>{badge.text}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-sm text-gray-400">현재 Epoch</span>
                <span className="text-sm font-bold text-foreground">{currentEpoch} / {epochs}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-700">
                <span className="text-sm text-gray-400">경과 시간</span>
                <span className="text-sm font-bold text-foreground">{elapsedTime}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-400">예상 남은 시간</span>
                <span className="text-sm font-bold text-foreground">{remainingTime}</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>전체 학습 진행률</span>
                  <span className="font-bold text-cyan-400">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Real-time Metrics */}
            <div className="grid grid-cols-4 gap-4 mt-5">
              {[
                { title: '현재 Train Loss', value: trainLoss, sub: '--' },
                { title: '현재 Val Loss', value: valLoss, sub: '--' },
                { title: '현재 Accuracy', value: accuracy, sub: '--' },
                { title: 'GPU 사용률', value: gpuUsage, sub: `GPU ${gpu}` },
              ].map((m, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-4 hover:border-cyan-500/50 transition-colors">
                  <p className="text-xs text-gray-400 mb-2">{m.title}</p>
                  <p className="text-2xl font-bold text-cyan-400">{m.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* Training Log */}
            <div className="mt-5 bg-gray-900/60 rounded-lg border border-gray-700 p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-cyan-400">학습 로그</span>
                <button onClick={clearLogs} className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 border border-gray-600">
                  🗑 로그 지우기
                </button>
              </div>
              <div className="bg-black/60 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs border border-gray-700">
                {logs.map((log, i) => (
                  <div key={i} className={`py-1 ${getLogColor(log.type)}`}>
                    [{log.time}] {log.message}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* STEP 4: 학습 결과 분석 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">STEP 4. 학습 결과 분석 및 모델 선정</h2>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-cyan-400 mb-4">Loss Curve (Train vs Validation)</h3>
            <div className="h-64 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center">
              {status === 'completed' ? (
                <svg viewBox="0 0 400 200" className="w-full h-full p-4">
                  <line x1="40" y1="10" x2="40" y2="180" stroke="#374151" strokeWidth="1" />
                  <line x1="40" y1="180" x2="380" y2="180" stroke="#374151" strokeWidth="1" />
                  <polyline fill="none" stroke="#06b6d4" strokeWidth="2" points="40,30 80,50 120,65 160,80 200,95 240,110 280,125 320,140 360,150" />
                  <polyline fill="none" stroke="#f97316" strokeWidth="2" points="40,35 80,55 120,70 160,88 200,100 240,115 280,130 320,148 360,155" />
                  <rect x="280" y="10" width="8" height="8" fill="#06b6d4" />
                  <text x="294" y="18" fill="#9ca3af" fontSize="10">Train Loss</text>
                  <rect x="280" y="25" width="8" height="8" fill="#f97316" />
                  <text x="294" y="33" fill="#9ca3af" fontSize="10">Val Loss</text>
                </svg>
              ) : (
                <>
                  <span className="text-gray-500 text-sm">Training Loss / Validation Loss 비교 그래프</span>
                  <span className="text-gray-600 text-xs mt-2">(학습 완료 후 표시됩니다)</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-cyan-400 mb-4">Accuracy Curve</h3>
            <div className="h-64 rounded-lg border-2 border-dashed border-gray-700 flex flex-col items-center justify-center">
              {status === 'completed' ? (
                <svg viewBox="0 0 400 200" className="w-full h-full p-4">
                  <line x1="40" y1="10" x2="40" y2="180" stroke="#374151" strokeWidth="1" />
                  <line x1="40" y1="180" x2="380" y2="180" stroke="#374151" strokeWidth="1" />
                  <polyline fill="none" stroke="#10b981" strokeWidth="2" points="40,170 80,145 120,120 160,100 200,80 240,60 280,45 320,35 360,25" />
                  <rect x="300" y="10" width="8" height="8" fill="#10b981" />
                  <text x="314" y="18" fill="#9ca3af" fontSize="10">Accuracy</text>
                  <text x="365" y="20" fill="#10b981" fontSize="11" fontWeight="bold">98.2%</text>
                </svg>
              ) : (
                <>
                  <span className="text-gray-500 text-sm">Epoch별 정확도 변화 그래프</span>
                  <span className="text-gray-600 text-xs mt-2">(학습 완료 후 표시됩니다)</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Model Comparison Table */}
        <div className="mt-6">
          <h3 className="text-base font-semibold text-cyan-400 mb-4">FALSE 모델 성능 비교 및 선택</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-cyan-500/10">
                <tr>
                  <th className="px-4 py-3 text-left w-16">선택</th>
                  <th className="px-4 py-3 text-left">Epoch</th>
                  <th className="px-4 py-3 text-left">Test Acc</th>
                  <th className="px-4 py-3 text-left">미검율 (불량→양품)</th>
                  <th className="px-4 py-3 text-left">과검율 (양품→불량)</th>
                  <th className="px-4 py-3 text-left">Learning Rate</th>
                  <th className="px-4 py-3 text-left">성능 등급</th>
                  <th className="px-4 py-3 text-left">모델 파일</th>
                </tr>
              </thead>
              <tbody>
                {modelResults.map((m, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-700 hover:bg-cyan-500/5 transition-colors ${
                      selectedModel === i ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="model"
                        checked={selectedModel === i}
                        onChange={() => setSelectedModel(i)}
                        className="w-4 h-4 accent-cyan-500"
                      />
                    </td>
                    <td className="px-4 py-3">{m.epoch}</td>
                    <td className="px-4 py-3 font-bold">{m.testAcc}%</td>
                    <td className={`px-4 py-3 font-bold ${m.missRate <= 1.2 ? 'text-emerald-400' : ''}`}>{m.missRate}%</td>
                    <td className="px-4 py-3">{m.overRate}%</td>
                    <td className="px-4 py-3">{m.lr}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getGradeBadge(m.grade)}`}>
                        {m.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-400 text-xs">{m.file}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Warning */}
          <div className="mt-5 p-4 bg-yellow-500/10 border border-yellow-500/30 border-l-4 border-l-yellow-500 rounded-lg text-sm text-gray-300 leading-relaxed">
            <strong>⚠️ FALSE 모델 선정 기준:</strong><br />
            • Test Accuracy보다 <strong>미검율(불량→양품 오분류)</strong>를 최소화하는 것이 중요합니다.<br />
            • 동일 성능 시, 높은 Learning Rate를 사용한 모델을 우선 선정합니다.<br />
            • 선택한 모델은 TestSet 결과 기준이므로, <strong>실제 검증 Lot 결과 확인 후 최종 적용</strong>해야 합니다.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 border border-gray-600 transition-colors">
            💾 결과 저장
          </button>
          <button className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 border border-gray-600 transition-colors">
            📊 Excel 리포트 생성
          </button>
          <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors font-semibold">
            ✓ 선택한 모델 배포
          </button>
        </div>
      </div>

      {/* Bottom Notice */}
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 border-l-4 border-l-yellow-500 rounded-lg text-sm text-gray-300 leading-relaxed">
        <strong>🔔 중요 공지사항:</strong><br />
        재학습 단계에서의 모델 결과는 TestSet 기준입니다. <strong>실제 성능은 양산 Flow 탑재 후 검증 Lot 결과를 통해 확인</strong>해야 하며, 필요시 FALSE 모델 조합을 변경할 수 있습니다.
      </div>
    </div>
  );
}
