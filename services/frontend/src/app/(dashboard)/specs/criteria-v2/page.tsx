'use client';

import { useState } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  FileJson,
  X,
  FileText,
  Settings
} from 'lucide-react';

// 판정 기준 타입
interface JudgmentCriteria {
  id: number;
  customer: string;
  defectTypeInfo: string;
  measurementItem: string;
  operator: string;
  thresholdValue: number;
  ruleDescription: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 목업 데이터
const mockCriteriaData: JudgmentCriteria[] = [
  { id: 1, customer: 'Samsung', defectTypeInfo: 'TOP - DUMMY - 기타인식키_기타인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 15, ruleDescription: '기타인식키_불량 (TOP UNIT): longest 15 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 2, customer: 'Samsung', defectTypeInfo: 'BTM - UNIT - 기타인식키_기타인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 15, ruleDescription: '기타인식키_불량 (TOP DUMMY): longest 15 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 3, customer: 'Samsung', defectTypeInfo: 'TOP - DUMMY - 기타인식키_기타인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 15, ruleDescription: '기타인식키_불량 (BTM UNIT): longest 15 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 4, customer: 'Samsung', defectTypeInfo: 'TOP - UNIT - 십자인식키_십자인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 15, ruleDescription: '십자인식키_불량 (BTM DUMMY): longest 15 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 5, customer: 'Samsung', defectTypeInfo: 'TOP - DUMMY - 십자인식키_십자인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 3, ruleDescription: '십자인식키_불량 (TOP UNIT): longest 3 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 6, customer: 'Samsung', defectTypeInfo: 'BTM - UNIT - 십자인식키_십자인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 3, ruleDescription: '십자인식키_불량 (TOP DUMMY): longest 3 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 7, customer: 'Samsung', defectTypeInfo: 'BTM - DUMMY - 십자인식키_십자인식키_불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 3, ruleDescription: '십자인식키_불량 (BTM UNIT): longest 3 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 8, customer: 'Samsung', defectTypeInfo: 'TOP - UNIT - BONDPAD - 영상흔들림', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 3, ruleDescription: '십자인식키_불량 (BTM DUMMY): longest 3 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 9, customer: 'Samsung', defectTypeInfo: 'TOP - DUMMY - 판소재 - RAIL부불량', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 500, ruleDescription: 'RAIL부 불량 (TOP DUMMY): longest 500 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 10, customer: 'Samsung', defectTypeInfo: 'BTM - UNIT - 기타인식키 - PSR찍막', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 35, ruleDescription: 'PSR찍막 (기타인식키) TOP UNIT: longest 35 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 11, customer: 'Samsung', defectTypeInfo: 'TOP - UNIT - 십자인식키 - PSR찍막', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 35, ruleDescription: 'PSR찍막 (기타인식키) BTM UNIT: longest 35 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 12, customer: 'Samsung', defectTypeInfo: 'BTM - UNIT - 십자인식키 - PSR찍막', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 35, ruleDescription: 'PSR찍막 (십자인식키) TOP UNIT: longest 35 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 13, customer: 'Samsung', defectTypeInfo: 'TOP - UNIT - PSR - PSR하지얼룩', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 35, ruleDescription: 'PSR찍막 (십자인식키) BTM UNIT: longest 35 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 14, customer: 'Samsung', defectTypeInfo: 'BTM - UNIT - PSR - PSR하지얼룩', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 800, ruleDescription: 'PSR하지얼룩 (TOP UNIT): longest 800 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
  { id: 15, customer: 'Samsung', defectTypeInfo: 'TOP - DUMMY - PSR - PSR하지얼룩', measurementItem: 'longest (micrometer)', operator: '>=', thresholdValue: 800, ruleDescription: 'PSR하지얼룩 (BTM UNIT): longest 800 이상', isActive: true, createdAt: '2025-01-10', updatedAt: '2025-01-15' },
];

// 고객사 옵션
const customerOptions = ['Samsung', 'LG', 'SK', 'Apple'];

// 측정 항목 옵션
const measurementOptions = [
  'longest (micrometer)',
  'shortest (micrometer)',
  'area (sq.micrometer)',
  'count (ea)',
  'color_gray (None)',
];

// 연산자 옵션
const operatorOptions = ['>=', '<=', '>', '<', '==', '!='];

export default function CriteriaV2Page() {
  const [criteria, setCriteria] = useState(mockCriteriaData);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<JudgmentCriteria | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState({
    customer: '',
    defectType: '',
    measurementItem: '',
    operator: '>=',
    thresholdValue: 0,
    ruleDescription: '',
    isActive: true,
  });

  // 필터링된 데이터
  const filteredCriteria = criteria.filter(item =>
    item.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.defectTypeInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ruleDescription.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      customer: '',
      defectType: '',
      measurementItem: '',
      operator: '>=',
      thresholdValue: 0,
      ruleDescription: '',
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleEdit = (item: JudgmentCriteria) => {
    setEditingItem(item);
    setFormData({
      customer: item.customer,
      defectType: item.defectTypeInfo,
      measurementItem: item.measurementItem,
      operator: item.operator,
      thresholdValue: item.thresholdValue,
      ruleDescription: item.ruleDescription,
      isActive: item.isActive,
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      setCriteria(criteria.filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    // 저장 로직 (목업)
    setShowAddModal(false);
  };

  const handleToggleActive = (id: number) => {
    setCriteria(criteria.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    ));
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">불량 판정 기준 관리</h1>
        <p className="text-gray-400 mt-1">AI 모델의 불량 판정 규칙을 설정하고 관리합니다. (Ver 2.0)</p>
      </div>

      {/* 툴바 */}
      <div className="flex items-center justify-between gap-4">
        {/* 검색 */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="고객사, 불량유형, 규칙 등으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            판정 기준 추가
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg border border-gray-600 transition-colors">
            <FileJson className="h-4 w-4" />
            JSON Import
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg border border-gray-600 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg border border-gray-600 transition-colors">
            <FileText className="h-4 w-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg border border-gray-600 transition-colors">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-12">
                  <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">고객사</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">불량 유형 정보</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">측정 항목</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">연산자</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">기준 값</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">규칙 설명</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">활성화</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCriteria.map((item) => (
                <tr key={item.id} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded border-gray-600 bg-gray-800" />
                  </td>
                  <td className="px-4 py-3 text-gray-300">{item.id}</td>
                  <td className="px-4 py-3">
                    <span className="text-cyan-400 hover:underline cursor-pointer">{item.customer}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-cyan-400 hover:underline cursor-pointer text-sm">{item.defectTypeInfo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-cyan-400 hover:underline cursor-pointer text-sm">{item.measurementItem}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-300">{item.operator}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-300">{item.thresholdValue}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">{item.ruleDescription}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(item.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        item.isActive
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-gray-600/20 text-gray-400'
                      }`}
                    >
                      {item.isActive ? '활성' : '비활성'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-2 py-1 text-cyan-400 hover:bg-gray-700 rounded text-xs transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 text-red-400 hover:bg-gray-700 rounded text-xs transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            총 {filteredCriteria.length}개 항목
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">이전</button>
            <span className="px-3 py-1 bg-cyan-500 text-white rounded text-sm">1</span>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">2</button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">3</button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm">다음</button>
          </div>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="w-full max-w-lg mx-4 rounded-lg shadow-2xl" style={{ backgroundColor: '#ffffff' }}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItem ? '불량 판정 기준 수정' : '불량 판정 기준 추가'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-4">
              {/* 고객사 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> 고객사
                </label>
                <select
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <option value="">고객사 선택</option>
                  {customerOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* 불량 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> 불량 유형
                </label>
                <select
                  value={formData.defectType}
                  onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <option value="">불량 유형 선택</option>
                  <option value="TOP - UNIT - 기타인식키_불량">TOP - UNIT - 기타인식키_불량</option>
                  <option value="BTM - UNIT - 기타인식키_불량">BTM - UNIT - 기타인식키_불량</option>
                  <option value="TOP - DUMMY - 십자인식키_불량">TOP - DUMMY - 십자인식키_불량</option>
                  <option value="BTM - DUMMY - 십자인식키_불량">BTM - DUMMY - 십자인식키_불량</option>
                </select>
              </div>

              {/* 측정 항목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> 측정 항목
                </label>
                <select
                  value={formData.measurementItem}
                  onChange={(e) => setFormData({ ...formData, measurementItem: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  <option value="">측정 항목 선택</option>
                  {measurementOptions.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* 연산자 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> 연산자
                </label>
                <select
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  style={{ backgroundColor: '#ffffff' }}
                >
                  {operatorOptions.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              {/* 기준 값 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-red-500">*</span> 기준 값
                </label>
                <input
                  type="number"
                  value={formData.thresholdValue}
                  onChange={(e) => setFormData({ ...formData, thresholdValue: Number(e.target.value) })}
                  placeholder="기준 값 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>

              {/* 규칙 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  규칙 설명
                </label>
                <textarea
                  value={formData.ruleDescription}
                  onChange={(e) => setFormData({ ...formData, ruleDescription: e.target.value })}
                  placeholder="예: scratch가 10마이크로미터보다 큰 경우"
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                  style={{ backgroundColor: '#ffffff' }}
                />
                <p className="text-xs text-gray-500 text-right mt-1">{formData.ruleDescription.length} / 500</p>
              </div>

              {/* 활성화 여부 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">활성화 여부</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  <span className="ml-2 text-sm text-gray-600">{formData.isActive ? '활성' : '비활성'}</span>
                </label>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
