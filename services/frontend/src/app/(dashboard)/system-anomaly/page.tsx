'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Plus,
  Search,
  Download,
  Trash2,
  Edit2,
  Eye,
  ArrowLeft,
  Save,
  X,
  ChevronDown,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

/* ─────────────────────────── Types ─────────────────────────── */
type SystemGroup = 'NEW' | 'LEGACY';

const GROUP_LABELS: Record<SystemGroup, string> = {
  NEW: 'New System',
  LEGACY: 'Legacy System',
};

const GROUP_COLORS: Record<SystemGroup, string> = {
  NEW: 'bg-blue-900/40 text-blue-300 border border-blue-700/50',
  LEGACY: 'bg-orange-900/40 text-orange-300 border border-orange-700/50',
};

interface TasRecord {
  id: number;
  system_group: SystemGroup;
  serial_no: string;
  site: string;
  manager: string;
  issue_date: string;
  check_date: string;
  action_date: string;
  core_version: string;
  non_core_version: string;
  hw_status: string;
  symptom: string;
  cause: string;
  action: string;
  next_plan: string;
  author: string;
  author_date: string;
  reviewer: string;
  approver: string;
  created_at: string;
  updated_at: string;
}

type RecordInput = Omit<TasRecord, 'id' | 'created_at' | 'updated_at'>;

const EMPTY_FORM: RecordInput = {
  system_group: 'NEW',
  serial_no: '',
  site: '',
  manager: '',
  issue_date: '',
  check_date: '',
  action_date: '',
  core_version: '',
  non_core_version: '',
  hw_status: '',
  symptom: '',
  cause: '',
  action: '',
  next_plan: '',
  author: '',
  author_date: '',
  reviewer: '',
  approver: '',
};

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

/* ─────────────────────────── API helpers ─────────────────────────── */
// 통합 백엔드: NEXT_PUBLIC_TAS_API_URL/api/v1/tas (기본 http://localhost:8000)
const TAS_BASE = (process.env.NEXT_PUBLIC_TAS_API_URL ?? 'http://localhost:8000') + '/api/v1/tas';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TAS_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ─────────────────────────── Shared UI atoms ─────────────────────────── */
function Badge({ group }: { group: SystemGroup }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${GROUP_COLORS[group]}`}>
      {GROUP_LABELS[group]}
    </span>
  );
}

function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-700 overflow-hidden mb-4">
      <div className="bg-cyan-900/30 border-b border-cyan-700/40 px-4 py-2 text-cyan-300 text-sm font-semibold">
        {title}
      </div>
      <div className="p-4 bg-gray-800/40">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-gray-700/50 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm text-gray-100 whitespace-pre-wrap">{value || '—'}</span>
    </div>
  );
}

/* ─────────────────────────── Form Component ─────────────────────────── */
const inputCls =
  'w-full px-3 py-2 text-sm bg-black/30 border border-cyan-500/30 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-colors';
const areaCls = `${inputCls} resize-y`;

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-400 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

interface FormViewProps {
  mode: 'create' | 'edit';
  initial?: TasRecord;
  onSaved: (id: number) => void;
  onCancel: () => void;
}

function FormView({ mode, initial, onSaved, onCancel }: FormViewProps) {
  const [form, setForm] = useState<RecordInput>(
    initial
      ? {
          system_group: initial.system_group,
          serial_no: initial.serial_no,
          site: initial.site,
          manager: initial.manager,
          issue_date: initial.issue_date,
          check_date: initial.check_date,
          action_date: initial.action_date,
          core_version: initial.core_version,
          non_core_version: initial.non_core_version,
          hw_status: initial.hw_status,
          symptom: initial.symptom,
          cause: initial.cause,
          action: initial.action,
          next_plan: initial.next_plan,
          author: initial.author,
          author_date: initial.author_date,
          reviewer: initial.reviewer,
          approver: initial.approver,
        }
      : { ...EMPTY_FORM }
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof RecordInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.serial_no.trim()) {
      setError('Serial No.는 필수입니다.');
      return;
    }
    setSaving(true);
    try {
      let saved: TasRecord;
      if (mode === 'create') {
        saved = await apiFetch<TasRecord>('/records', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      } else {
        saved = await apiFetch<TasRecord>(`/records/${initial!.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      }
      onSaved(saved.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft size={14} />
          {mode === 'create' ? '목록' : '상세'}
        </button>
        <h2 className="text-lg font-semibold text-white">
          {mode === 'create' ? '신규 이력 등록' : `이력 수정 — ${initial?.serial_no}`}
        </h2>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* 기본 정보 */}
      <SectionBox title="기본 정보">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <FieldLabel label="장비 그룹" required />
            <select
              className={inputCls}
              value={form.system_group}
              onChange={(e) =>
                setForm((f) => ({ ...f, system_group: e.target.value as SystemGroup }))
              }
              disabled={mode === 'edit'}
            >
              {(Object.keys(GROUP_LABELS) as SystemGroup[]).map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </select>
            {mode === 'edit' && <p className="text-xs text-gray-500 mt-1">장비 그룹 수정 불가</p>}
          </div>
          <div>
            <FieldLabel label="Serial No." required />
            <input
              className={inputCls}
              value={form.serial_no}
              onChange={set('serial_no')}
              placeholder="예: 2026-010"
              readOnly={mode === 'edit'}
            />
            {mode === 'edit' && <p className="text-xs text-gray-500 mt-1">Serial No. 수정 불가</p>}
          </div>
          <div>
            <FieldLabel label="Site" />
            <input
              className={inputCls}
              value={form.site}
              onChange={set('site')}
              placeholder="예: F95"
            />
          </div>
          <div>
            <FieldLabel label="담당자" />
            <input
              className={inputCls}
              value={form.manager}
              onChange={set('manager')}
              placeholder="예: 홍길동 책임"
            />
          </div>
        </div>
      </SectionBox>

      {/* 일자 */}
      <SectionBox title="일자">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Issue 일시" />
            <input
              className={inputCls}
              value={form.issue_date}
              onChange={set('issue_date')}
              placeholder="예: 2026년 02월 20일 18시"
            />
          </div>
          <div>
            <FieldLabel label="점검 일시" />
            <input
              className={inputCls}
              value={form.check_date}
              onChange={set('check_date')}
              placeholder="예: 2026년 02월 20일 19시"
            />
          </div>
          <div>
            <FieldLabel label="조치 일시" />
            <input
              className={inputCls}
              value={form.action_date}
              onChange={set('action_date')}
              placeholder="예: 2026년 02월 21일 00시"
            />
          </div>
        </div>
      </SectionBox>

      {/* 현재 상황 */}
      <SectionBox title="현재 상황">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="Core Version" />
            <input
              className={inputCls}
              value={form.core_version}
              onChange={set('core_version')}
              placeholder="예: 26.02.19"
            />
          </div>
          <div>
            <FieldLabel label="Non-Core Version" />
            <input
              className={inputCls}
              value={form.non_core_version}
              onChange={set('non_core_version')}
              placeholder="예: 574"
            />
          </div>
          <div>
            <FieldLabel label="H/W 상태" />
            <input
              className={inputCls}
              value={form.hw_status}
              onChange={set('hw_status')}
              placeholder="예: 정상"
            />
          </div>
        </div>
      </SectionBox>

      {/* 상세 내용 */}
      <SectionBox title="상세 내용">
        <div className="grid gap-4">
          <div>
            <FieldLabel label="증상/문제" />
            <textarea
              className={areaCls}
              rows={2}
              value={form.symptom}
              onChange={set('symptom')}
              placeholder="발생한 증상이나 문제를 입력하세요"
            />
          </div>
          <div>
            <FieldLabel label="원인" />
            <textarea
              className={areaCls}
              rows={3}
              value={form.cause}
              onChange={set('cause')}
              placeholder="원인 분석 내용을 입력하세요"
            />
          </div>
          <div>
            <FieldLabel label="조치" />
            <textarea
              className={areaCls}
              rows={3}
              value={form.action}
              onChange={set('action')}
              placeholder="수행한 조치 내용을 입력하세요"
            />
          </div>
          <div>
            <FieldLabel label="향후 일정" />
            <textarea
              className={areaCls}
              rows={2}
              value={form.next_plan}
              onChange={set('next_plan')}
              placeholder="향후 계획이나 일정을 입력하세요"
            />
          </div>
        </div>
      </SectionBox>

      {/* 서명 정보 */}
      <SectionBox title="서명 정보">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <FieldLabel label="작성자" />
            <input className={inputCls} value={form.author} onChange={set('author')} />
          </div>
          <div>
            <FieldLabel label="작성 일자" />
            <input
              className={inputCls}
              value={form.author_date}
              onChange={set('author_date')}
              placeholder="예: 2026.02.20"
            />
          </div>
          <div>
            <FieldLabel label="검토자" />
            <input className={inputCls} value={form.reviewer} onChange={set('reviewer')} />
          </div>
        </div>
      </SectionBox>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Save size={15} />
          {saving ? '저장 중...' : mode === 'create' ? '등록' : '저장'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
        >
          취소
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────── Detail View ─────────────────────────── */
interface DetailViewProps {
  record: TasRecord;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
  onDownload: () => void;
}

function DetailView({ record, onEdit, onDelete, onBack, onDownload }: DetailViewProps) {
  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 border border-gray-600 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} /> 목록
          </button>
          <h2 className="text-lg font-semibold text-white">{record.serial_no}</h2>
          <Badge group={record.system_group} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Download size={14} /> PPT 다운로드
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-sm bg-cyan-700 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Edit2 size={14} /> 수정
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 text-sm bg-red-800/60 hover:bg-red-700/70 text-red-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={14} /> 삭제
          </button>
        </div>
      </div>

      <SectionBox title="기본 정보">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
          <InfoRow label="장비 그룹" value={GROUP_LABELS[record.system_group]} />
          <InfoRow label="Serial No." value={record.serial_no} />
          <InfoRow label="Site" value={record.site} />
          <InfoRow label="담당자" value={record.manager} />
        </div>
      </SectionBox>

      <SectionBox title="일자">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
          <InfoRow label="Issue 일시" value={record.issue_date} />
          <InfoRow label="점검 일시" value={record.check_date} />
          <InfoRow label="조치 일시" value={record.action_date} />
        </div>
      </SectionBox>

      <SectionBox title="현재 상황">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
          <InfoRow label="Core Version" value={record.core_version} />
          <InfoRow label="Non-Core Version" value={record.non_core_version} />
          <InfoRow label="H/W 상태" value={record.hw_status} />
        </div>
      </SectionBox>

      <SectionBox title="상세 내용">
        <div className="grid gap-1">
          <InfoRow label="증상/문제" value={record.symptom} />
          <InfoRow label="원인" value={record.cause} />
          <InfoRow label="조치" value={record.action} />
          <InfoRow label="향후 일정" value={record.next_plan} />
        </div>
      </SectionBox>

      <SectionBox title="서명 정보">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6">
          <div>
            <InfoRow label="작성자" value={record.author} />
            <InfoRow label="작성 일자" value={record.author_date} />
          </div>
          <InfoRow label="검토자" value={record.reviewer} />
          <InfoRow label="승인자" value={record.approver} />
        </div>
      </SectionBox>

      <p className="text-xs text-gray-500 mt-2 mb-8">
        등록: {record.created_at} · 최종수정: {record.updated_at}
      </p>
    </div>
  );
}

/* ─────────────────────────── Delete Confirm Modal ─────────────────────────── */
function DeleteModal({
  record,
  onConfirm,
  onCancel,
  deleting,
}: {
  record: TasRecord;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-900/40 flex items-center justify-center">
            <Trash2 size={18} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold">이력 삭제</h3>
            <p className="text-gray-400 text-sm">이 작업은 되돌릴 수 없습니다.</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm mb-5">
          <span className="text-white font-medium">{record.serial_no}</span> 이력을 삭제하시겠습니까?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Main Page ─────────────────────────── */
export default function SystemAnomalyPage() {
  const [records, setRecords] = useState<TasRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | SystemGroup>('ALL');
  const [sortField, setSortField] = useState<keyof TasRecord>('created_at');
  const [sortDesc, setSortDesc] = useState(true);

  const [view, setView] = useState<ViewMode>('list');
  const [selectedRecord, setSelectedRecord] = useState<TasRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TasRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState('');

  /* ── Fetch records ── */
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch<{ records: TasRecord[]; total: number; sites: string[] }>(
        '/records'
      );
      setRecords(data.records);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /* ── Filtering / sorting ── */
  const filtered = records
    .filter((r) => activeTab === 'ALL' || r.system_group === activeTab)
    .filter((r) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        r.serial_no.toLowerCase().includes(q) ||
        r.site.toLowerCase().includes(q) ||
        r.manager.toLowerCase().includes(q) ||
        r.symptom.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const av = String(a[sortField] ?? '');
      const bv = String(b[sortField] ?? '');
      return sortDesc ? bv.localeCompare(av) : av.localeCompare(bv);
    });

  const toggleSort = (field: keyof TasRecord) => {
    if (sortField === field) setSortDesc((d) => !d);
    else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  /* ── Actions ── */
  const handleView = (rec: TasRecord) => {
    setSelectedRecord(rec);
    setView('detail');
  };

  const handleFormSaved = async (id: number) => {
    setLoading(true);
    try {
      const data = await apiFetch<{ records: TasRecord[]; total: number; sites: string[] }>(
        '/records'
      );
      setRecords(data.records);
      const fresh = data.records.find((r) => r.id === id);
      if (fresh) setSelectedRecord(fresh);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
    setView('detail');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setApiError('');
    try {
      await apiFetch(`/records/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setView('list');
      setSelectedRecord(null);
      await fetchRecords();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = (id: number) => {
    window.open(`${TAS_BASE}/download/single/${id}`, '_blank');
  };

  const handleDownloadAll = () => {
    window.open(`${TAS_BASE}/download/all`, '_blank');
  };

  const handleDownloadExcel = () => {
    const headers = [
      '장비 그룹', 'Serial No.', 'Site', '담당자',
      'Issue 일시', '점검 일시', '조치 일시',
      'Core Version', 'Non-Core Version', 'H/W 상태',
      '증상/문제', '원인', '조치', '향후 일정',
      '작성자', '작성 일자', '검토자', '승인자',
    ];
    const rows = filtered.map((r) => [
      GROUP_LABELS[r.system_group], r.serial_no, r.site, r.manager,
      r.issue_date, r.check_date, r.action_date,
      r.core_version, r.non_core_version, r.hw_status,
      r.symptom, r.cause, r.action, r.next_plan,
      r.author, r.author_date, r.reviewer, r.approver,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `TAS_이력_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Tab counts ── */
  const counts = {
    ALL: records.length,
    NEW: records.filter((r) => r.system_group === 'NEW').length,
    LEGACY: records.filter((r) => r.system_group === 'LEGACY').length,
  };

  /* ── Render ── */
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-900/40 border border-cyan-700/40 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">System 이상발생 분석 관리</h1>
          <p className="text-sm text-gray-400">AI System 이상발생 이력 및 조치 현황 관리 (TAS)</p>
        </div>
      </div>

      {/* API error banner */}
      {apiError && (
        <div className="mb-4 bg-red-900/30 border border-red-700/50 text-red-300 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle size={14} />
            {apiError}
          </span>
          <button onClick={() => setApiError('')}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Serial No., Site, 담당자, 증상 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-black/30 border border-gray-700 hover:border-cyan-500/50 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={fetchRecords}
                className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <RefreshCw size={14} /> 새로고침
              </button>
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 text-sm bg-green-800/60 hover:bg-green-700/70 text-green-300 px-3 py-2 rounded-lg transition-colors"
              >
                <FileSpreadsheet size={14} /> 엑셀 다운로드
              </button>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 px-3 py-2 rounded-lg transition-colors"
              >
                <Download size={14} /> PPT 다운로드
              </button>
              <button
                onClick={() => setView('create')}
                className="flex items-center gap-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus size={14} /> 신규 등록
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-gray-700">
            {(['ALL', 'NEW', 'LEGACY'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab === 'ALL' ? '전체' : GROUP_LABELS[tab]}
                <span className="ml-1.5 text-xs text-gray-500">({counts[tab]})</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
                <RefreshCw size={16} className="animate-spin" /> 데이터 로딩 중...
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-3">
                <AlertTriangle size={24} />
                <p className="text-sm">{error}</p>
                <p className="text-xs text-gray-500">
                  TAS 백엔드 서버({TAS_BASE})에 연결할 수 없습니다.
                </p>
                <button
                  onClick={fetchRecords}
                  className="text-sm text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} /> 재시도
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-2">
                <ShieldAlert size={32} className="opacity-30" />
                <p className="text-sm">이력이 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <colgroup>
                    <col className="w-[105px]" />  {/* 장비 그룹 */}
                    <col className="w-[85px]" />   {/* Serial No. */}
                    <col className="w-[55px]" />   {/* Site */}
                    <col className="w-[110px]" />  {/* 담당자 */}
                    <col className="w-[140px]" />  {/* Issue 일시 */}
                    <col className="w-[70px]" />   {/* H/W 상태 */}
                    <col className="w-[160px]" />  {/* 증상 요약 */}
                    <col className="w-[190px]" />  {/* 원인 */}
                    <col className="w-[190px]" />  {/* 조치 */}
                    <col className="w-[160px]" />  {/* 향후 일정 */}
                    <col className="w-[100px]" />  {/* 작업 */}
                  </colgroup>
                  <thead className="bg-gray-900/60">
                    <tr>
                      {(
                        [
                          ['system_group', '장비 그룹'],
                          ['serial_no', 'Serial No.'],
                          ['site', 'Site'],
                          ['manager', '담당자'],
                          ['issue_date', 'Issue 일시'],
                          ['hw_status', 'H/W 상태'],
                        ] as [keyof TasRecord, string][]
                      ).map(([field, label]) => (
                        <th
                          key={field}
                          onClick={() => toggleSort(field)}
                          className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-200 transition-colors select-none"
                        >
                          <span className="flex items-center gap-1">
                            {label}
                            {sortField === field && (
                              <ChevronDown
                                size={12}
                                className={`transition-transform ${sortDesc ? '' : 'rotate-180'}`}
                              />
                            )}
                          </span>
                        </th>
                      ))}
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">증상 요약</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">원인</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">조치</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">향후 일정</th>
                      <th className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filtered.map((rec) => (
                      <tr
                        key={rec.id}
                        onClick={() => handleView(rec)}
                        className="hover:bg-gray-800/50 cursor-pointer transition-colors align-top"
                      >
                        <td className="px-3 py-3">
                          <Badge group={rec.system_group} />
                        </td>
                        <td className="px-3 py-3 text-cyan-300 font-mono text-xs">{rec.serial_no}</td>
                        <td className="px-3 py-3 text-gray-300 text-xs">{rec.site || '—'}</td>
                        <td className="px-3 py-3 text-gray-300 text-xs whitespace-nowrap">{rec.manager || '—'}</td>
                        <td className="px-3 py-3 text-gray-400 text-xs">{rec.issue_date || '—'}</td>
                        <td className="px-3 py-3 text-gray-300 text-xs">{rec.hw_status || '—'}</td>
                        <td className="px-3 py-3 text-gray-400 text-xs break-words">
                          {rec.symptom || '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-400 text-xs break-words whitespace-pre-wrap">
                          {rec.cause || '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-400 text-xs break-words whitespace-pre-wrap">
                          {rec.action || '—'}
                        </td>
                        <td className="px-3 py-3 text-gray-400 text-xs break-words whitespace-pre-wrap">
                          {rec.next_plan || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleView(rec)}
                              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-cyan-300 transition-colors"
                              title="상세보기"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRecord(rec);
                                setView('edit');
                              }}
                              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-cyan-300 transition-colors"
                              title="수정"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDownload(rec.id)}
                              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                              title="PPT 다운로드"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(rec)}
                              className="p-1.5 rounded hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-colors"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && !error && (
            <p className="text-xs text-gray-500 mt-2">
              총 {filtered.length}건{search && ` (검색: "${search}")`}
            </p>
          )}
        </>
      )}

      {/* ── DETAIL VIEW ── */}
      {view === 'detail' && selectedRecord && (
        <DetailView
          record={selectedRecord}
          onEdit={() => setView('edit')}
          onDelete={() => setDeleteTarget(selectedRecord)}
          onBack={() => {
            setView('list');
            setSelectedRecord(null);
          }}
          onDownload={() => handleDownload(selectedRecord.id)}
        />
      )}

      {/* ── CREATE VIEW ── */}
      {view === 'create' && (
        <FormView
          mode="create"
          onSaved={handleFormSaved}
          onCancel={() => setView('list')}
        />
      )}

      {/* ── EDIT VIEW ── */}
      {view === 'edit' && selectedRecord && (
        <FormView
          mode="edit"
          initial={selectedRecord}
          onSaved={handleFormSaved}
          onCancel={() => setView('detail')}
        />
      )}

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <DeleteModal
          record={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
