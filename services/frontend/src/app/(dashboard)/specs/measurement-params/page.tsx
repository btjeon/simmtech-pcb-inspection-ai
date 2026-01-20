'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

// Types
interface MeasurementParameter {
  id: string;
  name: string;
  unit: string;
  description: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedBy: string | null;
  updatedAt: string;
}

interface DistinctParam {
  name: string;
  unit: string;
}

export default function MeasurementParamsPage() {
  // State
  const [parameters, setParameters] = useState<MeasurementParameter[]>([]);
  const [distinctParams, setDistinctParams] = useState<DistinctParam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingParam, setEditingParam] = useState<MeasurementParameter | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    description: ''
  });

  // 데이터 로드
  const fetchParameters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (!showInactive) params.append('isActive', 'true');

      const response = await fetch(
        `${API_BASE_URL}/api/v1/customer-spec/measurement-params?${params}`
      );

      if (!response.ok) throw new Error('데이터 조회 실패');

      const data = await response.json();
      setParameters(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 조회 중 오류 발생');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showInactive]);

  // 기존 Specs에서 Distinct 파라미터 조회
  const fetchDistinctParams = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/customer-spec/measurement-params/distinct-from-specs`
      );

      if (!response.ok) throw new Error('Distinct 조회 실패');

      const data = await response.json();
      setDistinctParams(data.data || []);
    } catch (err) {
      console.error('Distinct params 조회 실패:', err);
    }
  };

  useEffect(() => {
    fetchParameters();
    fetchDistinctParams();
  }, [fetchParameters]);

  // 일괄 등록
  const handleBulkImport = async () => {
    if (!confirm('기존 Specifications 테이블에서 Parameter를 일괄 등록하시겠습니까?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/customer-spec/measurement-params/bulk-import`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) throw new Error('일괄 등록 실패');

      const data = await response.json();
      setSuccessMessage(`${data.imported}개 등록, ${data.skipped}개 스킵`);
      fetchParameters();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '일괄 등록 실패');
    } finally {
      setLoading(false);
    }
  };

  // 신규 등록 모달 열기
  const openCreateModal = () => {
    setEditingParam(null);
    setFormData({ name: '', unit: '', description: '' });
    setShowModal(true);
  };

  // 수정 모달 열기
  const openEditModal = (param: MeasurementParameter) => {
    setEditingParam(param);
    setFormData({
      name: param.name,
      unit: param.unit,
      description: param.description || ''
    });
    setShowModal(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setEditingParam(null);
    setFormData({ name: '', unit: '', description: '' });
  };

  // 저장 (등록/수정)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Parameter 이름은 필수입니다.');
      return;
    }
    if (!formData.unit.trim()) {
      alert('단위(Unit)는 필수입니다.');
      return;
    }

    setLoading(true);
    try {
      let response;

      if (editingParam) {
        // 수정
        response = await fetch(
          `${API_BASE_URL}/api/v1/customer-spec/measurement-params/${editingParam.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              unit: formData.unit,
              description: formData.description || null,
              updatedBy: 'admin'
            })
          }
        );
      } else {
        // 신규 등록
        response = await fetch(
          `${API_BASE_URL}/api/v1/customer-spec/measurement-params`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: formData.name,
              unit: formData.unit,
              description: formData.description || null,
              createdBy: 'admin'
            })
          }
        );
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || '저장 실패');
      }

      setSuccessMessage(editingParam ? '수정 완료' : '등록 완료');
      closeModal();
      fetchParameters();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setLoading(false);
    }
  };

  // 삭제 (비활성화)
  const handleDelete = async (param: MeasurementParameter) => {
    if (!confirm(`"${param.name}" Parameter를 삭제(비활성화)하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/customer-spec/measurement-params/${param.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('삭제 실패');

      setSuccessMessage('삭제 완료 (비활성화)');
      fetchParameters();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <PageHeader
        title="Measurement Parameter 기준정보 관리"
        subtitle="AI 판정에 사용되는 측정 파라미터(DefectCount, longest 등)의 기준정보를 관리합니다"
      />

      {/* Alert Messages */}
      {error && (
        <div className="mb-4 p-4 bg-status-error/10 border border-status-error rounded-lg flex items-center gap-2 text-status-error">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-status-success/10 border border-status-success rounded-lg flex items-center gap-2 text-status-success">
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-background-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="검색 (이름, 단위, 설명)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-background-primary border border-border rounded-lg text-sm focus:outline-none focus:border-accent-primary w-64"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              비활성 포함
            </label>

            <button
              onClick={fetchParameters}
              disabled={loading}
              className="p-2 bg-background-elevated border border-border rounded-lg hover:bg-border transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkImport}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-background-elevated border border-border rounded-lg text-sm hover:bg-border transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Specs에서 일괄 등록
            </button>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-background-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              신규 등록
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">등록된 Parameter</div>
          <div className="text-2xl font-bold text-accent-primary">{parameters.length}</div>
        </div>
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">Specs 테이블 Distinct</div>
          <div className="text-2xl font-bold text-text-primary">{distinctParams.length}</div>
        </div>
        <div className="bg-background-card border border-border rounded-lg p-4">
          <div className="text-sm text-text-muted mb-1">미등록 Parameter</div>
          <div className="text-2xl font-bold text-status-warning">
            {Math.max(0, distinctParams.length - parameters.length)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-background-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-elevated border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Parameter Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  등록자 / 등록일
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  수정자 / 수정일
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && parameters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    로딩 중...
                  </td>
                </tr>
              ) : parameters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-text-muted">
                    <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    등록된 Measurement Parameter가 없습니다.
                    <br />
                    <span className="text-sm">신규 등록 또는 Specs에서 일괄 등록을 진행해주세요.</span>
                  </td>
                </tr>
              ) : (
                parameters.map((param) => (
                  <tr
                    key={param.id}
                    className={`hover:bg-background-elevated transition-colors ${
                      !param.isActive ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-text-primary">{param.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-accent-primary/10 text-accent-primary text-xs rounded">
                        {param.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary max-w-xs truncate">
                      {param.description || '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {param.isActive ? (
                        <span className="px-2 py-1 bg-status-success/10 text-status-success text-xs rounded-full">
                          활성
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-status-error/10 text-status-error text-xs rounded-full">
                          비활성
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      <div>{param.createdBy || '-'}</div>
                      <div>{formatDate(param.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      <div>{param.updatedBy || '-'}</div>
                      <div>{formatDate(param.updatedAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(param)}
                          className="p-1.5 text-text-secondary hover:text-accent-primary hover:bg-background-elevated rounded transition-colors"
                          title="수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(param)}
                          className="p-1.5 text-text-secondary hover:text-status-error hover:bg-background-elevated rounded transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distinct Parameters from Specs (참고용) */}
      {distinctParams.length > 0 && (
        <div className="mt-6 bg-background-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Specifications 테이블 Distinct 파라미터 (참고)
          </h3>
          <div className="flex flex-wrap gap-2">
            {distinctParams.map((p, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-background-elevated border border-border rounded-full text-xs text-text-secondary"
              >
                {p.name} <span className="text-accent-primary">({p.unit || 'N/A'})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-card border border-border rounded-lg w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold text-text-primary">
                {editingParam ? 'Parameter 수정' : 'Parameter 신규 등록'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-background-elevated rounded transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Parameter Name <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="예: DefectCount, longest"
                  className="w-full px-4 py-2 bg-background-primary border border-border rounded-lg focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Unit (단위) <span className="text-status-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="예: EA, MicroMeter, Percent"
                  className="w-full px-4 py-2 bg-background-primary border border-border rounded-lg focus:outline-none focus:border-accent-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Description (설명)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="파라미터에 대한 설명을 입력하세요"
                  rows={3}
                  className="w-full px-4 py-2 bg-background-primary border border-border rounded-lg focus:outline-none focus:border-accent-primary resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-background-elevated border border-border rounded-lg text-sm hover:bg-border transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-background-primary rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
