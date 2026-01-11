'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Search, Filter, Database, FileJson, Eye, Trash2, Copy, BarChart } from 'lucide-react';
import * as CustomerSpecAPI from '@/lib/api/customer-spec';

interface SpecSummary {
  id: number;
  customer: string;
  category3: string;
  customized: string;
  rms_rev: number;
  rms_rev_datetime: string;
  defect_type_count: number;
  original_filename?: string;
}

export default function CustomerSpecPage() {
  const [customerFilter, setCustomerFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [customizedFilter, setCustomizedFilter] = useState('');
  const [specs, setSpecs] = useState<SpecSummary[]>([]);
  const [customers, setCustomers] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    loadCustomers();
    loadCategories();
    handleSearch(); // 초기 검색
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await CustomerSpecAPI.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('고객사 목록 로드 실패:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await CustomerSpecAPI.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 목록 로드 실패:', error);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await CustomerSpecAPI.searchSpecs({
        customer: customerFilter || undefined,
        category3: categoryFilter || undefined,
        customized: customizedFilter || undefined,
      });
      setSpecs(results);
    } catch (error) {
      console.error('검색 실패:', error);
      alert('Spec 검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUploadJson = async () => {
    if (!selectedFile) {
      alert('JSON 파일을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      await CustomerSpecAPI.uploadSpecJson(selectedFile);
      alert('JSON 파일이 성공적으로 업로드되었습니다.');
      setSelectedFile(null);
      handleSearch(); // 목록 새로고침
    } catch (error) {
      console.error('업로드 실패:', error);
      alert('JSON 업로드 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (specId: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    try {
      await CustomerSpecAPI.deleteSpec(specId);
      alert('삭제되었습니다.');
      handleSearch(); // 목록 새로고침
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleViewDetail = (specId: number) => {
    // TODO: 상세 페이지로 이동 또는 모달 표시
    window.location.href = `/customer-spec/${specId}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="고객사 Spec 관리"
        description="고객별 PCB 불량 검사 기준 관리"
      />

      {/* 필터 섹션 */}
      <div className="bg-background-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-accent-primary" />
          <h2 className="text-lg font-bold text-text-primary">검색 필터</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              고객사
            </label>
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="w-full bg-background-primary border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="">전체</option>
              {customers.map(customer => (
                <option key={customer} value={customer}>{customer}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              카테고리
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-background-primary border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="">전체</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              커스터마이즈
            </label>
            <select
              value={customizedFilter}
              onChange={(e) => setCustomizedFilter(e.target.value)}
              className="w-full bg-background-primary border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent-primary"
            >
              <option value="">전체</option>
              <option value="None">None</option>
              <option value="Waiver">Waiver</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-gradient-accent text-background-primary font-bold py-2 px-4 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {loading ? '검색 중...' : '검색'}
            </button>
          </div>
        </div>
      </div>

      {/* Spec 목록 */}
      <div className="bg-background-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-bold text-text-primary">
              Spec 목록 ({specs.length}개)
            </h2>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              id="json-upload"
            />
            <label
              htmlFor="json-upload"
              className="px-4 py-2 bg-accent-primary text-background-primary rounded hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              파일 선택
            </label>
            {selectedFile && (
              <button
                onClick={handleUploadJson}
                disabled={loading}
                className="px-4 py-2 bg-gradient-accent text-background-primary rounded hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                업로드
              </button>
            )}
          </div>
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-background-elevated border border-border rounded">
            <p className="text-sm text-text-secondary">
              선택된 파일: <span className="text-text-primary font-semibold">{selectedFile.name}</span>
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">고객사</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">카테고리</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">커스터마이즈</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">Rev</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">불량 유형 수</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">작업</th>
              </tr>
            </thead>
            <tbody>
              {specs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-muted">
                    {loading ? '검색 중...' : 'Spec 데이터가 없습니다.'}
                  </td>
                </tr>
              ) : (
                specs.map((spec) => (
                  <tr key={spec.id} className="border-b border-border hover:bg-background-elevated">
                    <td className="py-3 px-4 text-sm text-text-primary">{spec.id}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{spec.customer}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{spec.category3}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{spec.customized}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">Rev {spec.rms_rev}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{spec.defect_type_count}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetail(spec.id)}
                          className="text-accent-primary hover:opacity-70 transition-opacity"
                          title="상세보기"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(spec.id)}
                          className="text-red-500 hover:opacity-70 transition-opacity"
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
    </div>
  );
}
