'use client';

import { useState, useCallback } from 'react';

// ========== Mock Data ==========

const equipmentOptions = ['전체', 'PIXEL 5.5', 'PIXEL 2.0', 'ATI 5.5', 'ATI 2.0'];
const modelTypeOptions = ['전체', 'FALSE', 'CLF-AREA', 'CLF-DEFECT', 'CLF-SEG AREA', 'CLF-SEG DEFECT'];
const periodOptions = ['전체', '2025년 1월', '2024년 12월', '2024년 11월'];
const splitRatioOptions = ['70% / 20% / 10%', '80% / 10% / 10%', '60% / 20% / 20%'];
const augmentationOptions = ['적용', '미적용'];

interface FolderItem {
  id: number;
  name: string;
  equipment: string;
  modelType: string;
  imageCount: number;
  size: string;
  sizeGB: number;
  createdAt: string;
  status: 'Ready' | 'Processing' | 'Error';
}

const mockFolders: FolderItem[] = [
  { id: 1, name: 'PIXEL5.5_FALSE_Dataset_2025-01-15', equipment: 'PIXEL 5.5', modelType: 'FALSE', imageCount: 8247, size: '3.2 GB', sizeGB: 3.2, createdAt: '2025-01-15', status: 'Ready' },
  { id: 2, name: 'PIXEL5.5_CLF-AREA_Dataset_2025-01-12', equipment: 'PIXEL 5.5', modelType: 'CLF-AREA', imageCount: 12453, size: '4.8 GB', sizeGB: 4.8, createdAt: '2025-01-12', status: 'Ready' },
  { id: 3, name: 'PIXEL5.5_FALSE_Dataset_2024-12-28', equipment: 'PIXEL 5.5', modelType: 'FALSE', imageCount: 7892, size: '2.9 GB', sizeGB: 2.9, createdAt: '2024-12-28', status: 'Ready' },
  { id: 4, name: 'ATI5.5_FALSE_Dataset_2025-01-10', equipment: 'ATI 5.5', modelType: 'FALSE', imageCount: 6530, size: '2.5 GB', sizeGB: 2.5, createdAt: '2025-01-10', status: 'Ready' },
  { id: 5, name: 'PIXEL2.0_CLF-DEFECT_Dataset_2024-12-20', equipment: 'PIXEL 2.0', modelType: 'CLF-DEFECT', imageCount: 9821, size: '3.8 GB', sizeGB: 3.8, createdAt: '2024-12-20', status: 'Ready' },
];

interface ValidationItem {
  title: string;
  description: string;
  status: 'PASS' | 'WARNING' | 'FAIL';
}

const validationResults: ValidationItem[] = [
  { title: '폴더 구조 검증', description: 'train/val/test 폴더 존재 확인', status: 'PASS' },
  { title: '이미지 파일 검증', description: '손상되거나 읽을 수 없는 파일: 0개', status: 'PASS' },
  { title: '레이블 일치성 검증', description: '모든 이미지에 대응하는 레이블 존재', status: 'PASS' },
  { title: '클래스 분포 검증', description: '일부 클래스 불균형 감지 (NG: 23%, OK: 77%)', status: 'WARNING' },
  { title: '이미지 해상도 검증', description: '모든 이미지 크기 일치 (640x640)', status: 'PASS' },
];

// ========== Types ==========
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface Notification {
  message: string;
  type: NotificationType;
  id: number;
}

// ========== Component ==========
export default function DataValidationPage() {
  // Filter state
  const [equipment, setEquipment] = useState('전체');
  const [modelType, setModelType] = useState('전체');
  const [period, setPeriod] = useState('전체');
  const [dataPath, setDataPath] = useState('D:\\SIMMTECH\\TrainingData\\');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [folders] = useState<FolderItem[]>(mockFolders);

  // Validation state
  const [showValidation, setShowValidation] = useState(false);
  const [validating, setValidating] = useState(false);

  // Merge config
  const [mergedName, setMergedName] = useState('PIXEL5.5_FALSE_Merged_2025-01');
  const [splitRatio, setSplitRatio] = useState(splitRatioOptions[0]);
  const [augmentation, setAugmentation] = useState('적용');
  const [savePath, setSavePath] = useState('D:\\SIMMTECH\\MergedDatasets\\');
  const [merging, setMerging] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  let notifCounter = 0;

  const showNotification = useCallback((message: string, type: NotificationType) => {
    const id = Date.now() + (notifCounter++);
    setNotifications(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Toggle single selection
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle all
  const toggleAll = () => {
    if (selectedIds.size === folders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(folders.map(f => f.id)));
    }
  };

  // Summary calculations
  const selectedFolders = folders.filter(f => selectedIds.has(f.id));
  const totalImages = selectedFolders.reduce((sum, f) => sum + f.imageCount, 0);
  const totalSize = selectedFolders.reduce((sum, f) => sum + f.sizeGB, 0);

  // Scan folders
  const scanFolders = () => {
    showNotification('폴더 스캔 중...', 'info');
    setTimeout(() => {
      showNotification(`스캔 완료! ${folders.length}개의 폴더를 찾았습니다.`, 'success');
    }, 2000);
  };

  // Start validation
  const startValidation = () => {
    if (selectedIds.size === 0) {
      showNotification('검증할 폴더를 선택해주세요.', 'warning');
      return;
    }
    setValidating(true);
    showNotification('데이터 정합성 검증 중...', 'info');
    setTimeout(() => {
      setValidating(false);
      setShowValidation(true);
      showNotification('검증 완료! 1개의 경고 항목이 있습니다.', 'warning');
    }, 2500);
  };

  // Start merge
  const startMerge = () => {
    if (selectedIds.size === 0) {
      showNotification('병합할 폴더를 선택해주세요.', 'warning');
      return;
    }
    if (!mergedName.trim()) {
      showNotification('데이터셋 이름을 입력해주세요.', 'warning');
      return;
    }
    setMerging(true);
    showNotification(`${selectedIds.size}개 폴더 병합 시작...`, 'info');
    setTimeout(() => {
      setMerging(false);
      showNotification('데이터 병합 완료!', 'success');
    }, 4000);
  };

  // Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ready': return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
      case 'Processing': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50';
      case 'Error': return 'bg-red-500/20 text-red-400 border border-red-500/50';
      default: return 'bg-gray-600 text-gray-300';
    }
  };

  const getValidationStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS': return { cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50', icon: '✓', borderColor: 'border-l-emerald-500' };
      case 'WARNING': return { cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50', icon: '⚠', borderColor: 'border-l-yellow-500' };
      case 'FAIL': return { cls: 'bg-red-500/20 text-red-400 border border-red-500/50', icon: '✗', borderColor: 'border-l-red-500' };
      default: return { cls: 'bg-gray-600 text-gray-300', icon: '-', borderColor: 'border-l-gray-500' };
    }
  };

  const getNotifStyle = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'bg-emerald-600 border-emerald-400';
      case 'warning': return 'bg-yellow-600 border-yellow-400';
      case 'error': return 'bg-red-600 border-red-400';
      default: return 'bg-blue-600 border-blue-400';
    }
  };

  // Common styles
  const selectCls = "w-full px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-100";
  const optionCls = "bg-gray-800 text-gray-100";

  return (
    <>
      {/* Notifications - outside space-y-6 to avoid extra margin */}
      <div className="fixed top-5 right-5 z-50 space-y-2">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`px-5 py-3 rounded-lg text-white text-sm font-semibold shadow-lg border-l-4 animate-in slide-in-from-right ${getNotifStyle(n.type)}`}
          >
            {n.message}
          </div>
        ))}
      </div>

      <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">학습 데이터 추가 및 정합성 검증</h1>
          <span className="px-3 py-1 rounded-full text-sm font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/50">
            {selectedIds.size}
          </span>
        </div>
        <p className="text-muted-foreground mt-1">Training Data Addition & Validation System</p>
      </div>

      {/* Process Flow */}
      <div className="bg-card rounded-lg border border-border p-5">
        <div className="flex items-center justify-between">
          {[
            { step: 1, title: '데이터 선택' },
            { step: 2, title: '정합성 검증' },
            { step: 3, title: '데이터 병합' },
            { step: 4, title: '학습셋 생성' },
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

      {/* STEP 1: 학습 데이터 폴더 선택 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">STEP 1. 학습 데이터 폴더 선택</h2>

        <div className="grid grid-cols-4 gap-5">
          {/* Equipment */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">검사 장비</label>
            <select value={equipment} onChange={e => setEquipment(e.target.value)} className={selectCls}>
              {equipmentOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o}</option>
              ))}
            </select>
          </div>

          {/* Model Type */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">AI 모델 타입</label>
            <select value={modelType} onChange={e => setModelType(e.target.value)} className={selectCls}>
              {modelTypeOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o}</option>
              ))}
            </select>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">데이터 기간</label>
            <select value={period} onChange={e => setPeriod(e.target.value)} className={selectCls}>
              {periodOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o}</option>
              ))}
            </select>
          </div>

          {/* Data Path */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">데이터 경로</label>
            <input
              type="text"
              value={dataPath}
              onChange={e => setDataPath(e.target.value)}
              placeholder="D:\SIMMTECH\TrainingData\"
              className={`${selectCls} placeholder:text-gray-500`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={scanFolders}
            className="px-5 py-2.5 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors"
          >
            🔍 폴더 스캔
          </button>
          <button
            onClick={scanFolders}
            className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 border border-gray-600 transition-colors"
          >
            ↻ 새로고침
          </button>
        </div>
      </div>

      {/* 데이터 폴더 목록 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">사용 가능한 데이터 폴더 목록</h2>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-cyan-500/10">
              <tr>
                <th className="px-4 py-3 text-left w-16">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === folders.length && folders.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </th>
                <th className="px-4 py-3 text-left">폴더명</th>
                <th className="px-4 py-3 text-left">검사 장비</th>
                <th className="px-4 py-3 text-left">AI 모델 타입</th>
                <th className="px-4 py-3 text-right">이미지 수</th>
                <th className="px-4 py-3 text-right">용량</th>
                <th className="px-4 py-3 text-left">생성일</th>
                <th className="px-4 py-3 text-center">상태</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(f => (
                <tr
                  key={f.id}
                  className={`border-b border-gray-700 hover:bg-cyan-500/5 transition-colors cursor-pointer ${
                    selectedIds.has(f.id) ? 'bg-cyan-500/10 border-l-4 border-l-cyan-400' : ''
                  }`}
                  onClick={() => toggleSelect(f.id)}
                >
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      className="w-4 h-4 accent-cyan-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-cyan-400 text-xs font-semibold">{f.name}</td>
                  <td className="px-4 py-3">{f.equipment}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/40">
                      {f.modelType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{f.imageCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{f.size}</td>
                  <td className="px-4 py-3">{f.createdAt}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Selection Summary */}
        <div className="mt-5 p-4 bg-blue-500/10 border border-blue-500/30 border-l-4 border-l-blue-500 rounded-lg text-sm text-gray-300">
          <strong>ℹ️ 선택된 폴더: </strong>
          <span className="text-cyan-400 font-bold">{selectedIds.size}</span>개 |{' '}
          <strong>총 이미지: </strong>
          <span className="text-cyan-400 font-bold">{totalImages.toLocaleString()}</span>개 |{' '}
          <strong>총 용량: </strong>
          <span className="text-cyan-400 font-bold">{totalSize.toFixed(1)} GB</span>
        </div>
      </div>

      {/* STEP 2: 데이터 정합성 검증 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">STEP 2. 데이터 정합성 검증</h2>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={startValidation}
            disabled={validating}
            className="px-5 py-2.5 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {validating ? '검증 중...' : '✓ 검증 시작'}
          </button>
          <button
            onClick={() => setShowValidation(!showValidation)}
            className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 border border-gray-600 transition-colors"
          >
            📋 {showValidation ? '상세 숨기기' : '상세 보기'}
          </button>
        </div>

        {/* Validation Panel */}
        {showValidation && (
          <div className="mt-5 bg-gray-900/60 rounded-lg border border-gray-700 p-5 space-y-3">
            {validationResults.map((item, i) => {
              const badge = getValidationStatusBadge(item.status);
              return (
                <div
                  key={i}
                  className={`flex justify-between items-center p-4 bg-gray-800/60 rounded-lg border-l-4 ${badge.borderColor} hover:bg-gray-700/40 transition-colors`}
                >
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {badge.icon} {item.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                    {item.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Warning */}
        <div className="mt-5 p-4 bg-yellow-500/10 border border-yellow-500/30 border-l-4 border-l-yellow-500 rounded-lg text-sm text-gray-300 leading-relaxed">
          <strong>⚠️ 주의사항:</strong><br />
          • 검증 실패 항목이 있는 경우, 데이터 병합 전 반드시 수정이 필요합니다.<br />
          • WARNING 항목은 참고용이며, 필요시 데이터 증강(Augmentation)으로 보완 가능합니다.
        </div>
      </div>

      {/* STEP 3-4: 데이터 병합 및 학습셋 생성 */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-5">STEP 3-4. 데이터 병합 및 학습셋 생성</h2>

        <div className="grid grid-cols-4 gap-5">
          {/* Merged Dataset Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">병합 데이터셋 이름</label>
            <input
              type="text"
              value={mergedName}
              onChange={e => setMergedName(e.target.value)}
              placeholder="PIXEL5.5_FALSE_Merged_2025-01"
              className={`${selectCls} placeholder:text-gray-500`}
            />
          </div>

          {/* Split Ratio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">Train/Val/Test 비율</label>
            <select value={splitRatio} onChange={e => setSplitRatio(e.target.value)} className={selectCls}>
              {splitRatioOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o}</option>
              ))}
            </select>
          </div>

          {/* Augmentation */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">데이터 증강 (Augmentation)</label>
            <select value={augmentation} onChange={e => setAugmentation(e.target.value)} className={selectCls}>
              {augmentationOptions.map(o => (
                <option key={o} value={o} className={optionCls}>{o}</option>
              ))}
            </select>
          </div>

          {/* Save Path */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300">저장 경로</label>
            <input
              type="text"
              value={savePath}
              onChange={e => setSavePath(e.target.value)}
              placeholder="D:\SIMMTECH\MergedDatasets\"
              className={`${selectCls} placeholder:text-gray-500`}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={startMerge}
            disabled={merging}
            className="px-5 py-2.5 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {merging ? '병합 중...' : '🔗 병합 시작'}
          </button>
          <button className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-lg font-semibold hover:bg-gray-600 border border-gray-600 transition-colors">
            📁 저장 폴더 열기
          </button>
        </div>

        {/* Expected Result */}
        <div className="mt-5 p-4 bg-emerald-500/10 border border-emerald-500/30 border-l-4 border-l-emerald-500 rounded-lg text-sm text-gray-300 leading-relaxed">
          <strong>✓ 병합 작업 예상 결과:</strong><br />
          • 총 이미지 수: <span className="text-emerald-400 font-bold">28,592</span>개 (Train: 20,014 | Val: 5,718 | Test: 2,860)<br />
          • 예상 용량: <span className="text-emerald-400 font-bold">10.9 GB</span><br />
          • 증강 적용 시: 이미지 약 <span className="text-emerald-400 font-bold">2~3배</span> 증가 예상
        </div>
      </div>

      {/* Merge Progress (visible during merge) */}
      {merging && (
        <div className="bg-card rounded-lg border border-border p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">병합 진행 상태</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>전체 진행률</span>
                <span className="font-bold text-cyan-400">진행중...</span>
              </div>
              <div className="w-full h-3 bg-gray-900 rounded-full border border-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-3 text-center">
                <p className="text-xs text-gray-400">처리된 이미지</p>
                <p className="text-lg font-bold text-cyan-400">17,155</p>
              </div>
              <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-3 text-center">
                <p className="text-xs text-gray-400">남은 이미지</p>
                <p className="text-lg font-bold text-yellow-400">11,437</p>
              </div>
              <div className="bg-gray-900/60 rounded-lg border border-gray-700 p-3 text-center">
                <p className="text-xs text-gray-400">경과 시간</p>
                <p className="text-lg font-bold text-emerald-400">00:04:32</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
