'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Database, FileDown, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import * as CustomerSpecAPI from '@/lib/api/customer-spec';

interface CustomerSpecRow {
  id: number;
  customer: string;
  category3: string;
  customized: string;
  rms_rev: number;
}

interface DefectTypeRow {
  id: number;
  ai_code: string;
  side?: string;
  unit_dummy?: string;
  area?: string;
  defect_name: string;
  multiple?: number;
  threshold_ok?: number;
}

interface Expression {
  value: number;
  inequality_sign: string;
}

interface Specification {
  id: number;
  measurement_name: string;
  unit: string;
  sub_logical_operator?: string;
  expressions: Expression[];
  sub_specifications?: Specification[];
}

interface MeasurementCondition {
  id: number;
  idx: number;
  measurement_name: string;
  default_result_value: string;
  root_logical_operator: string;
  measurement_condition_value?: number;
  measurement_condition_unit?: string;
  measurement_condition_inequality_sign?: string;
  specifications: Specification[];
}

interface DefectCondition {
  id: number;
  idx: number;
  machine_type?: string;
  metal_value_percent?: number;
  no_measurement_default_result: string;
  measurement_conditions: MeasurementCondition[];
}

export default function SpecManagementPage() {
  const [specs, setSpecs] = useState<CustomerSpecRow[]>([]);
  const [defectTypes, setDefectTypes] = useState<DefectTypeRow[]>([]);
  const [defectConditions, setDefectConditions] = useState<DefectCondition[]>([]);
  const [selectedSpecId, setSelectedSpecId] = useState<number | null>(null);
  const [selectedDefectTypeId, setSelectedDefectTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSpecs();
  }, []);

  const loadSpecs = async () => {
    setLoading(true);
    try {
      const data = await CustomerSpecAPI.searchSpecs({});
      setSpecs(data);
    } catch (error) {
      console.error('Spec 로드 실패:', error);
      alert('Spec 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecClick = async (specId: number) => {
    setSelectedSpecId(specId);
    setSelectedDefectTypeId(null);
    setDefectConditions([]);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/customer-spec/spec/${specId}`);
      const data = await response.json();

      if (data.status === 'success') {
        setDefectTypes(data.spec.defect_types);
      }
    } catch (error) {
      console.error('Defect Types 로드 실패:', error);
      alert('불량 유형을 불러오는데 실패했습니다.');
    }
  };

  const handleDefectTypeClick = async (defectTypeId: number) => {
    setSelectedDefectTypeId(defectTypeId);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/customer-spec/defect-type/${defectTypeId}`);
      const data = await response.json();

      if (data.status === 'success') {
        setDefectConditions(data.defect_type.defect_conditions);
      }
    } catch (error) {
      console.error('Specifications 로드 실패:', error);
      alert('판정 기준을 불러오는데 실패했습니다.');
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const exportDefectTypesToCSV = () => {
    if (defectTypes.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }

    const headers = ['AI_Code', 'Side', 'Unit_Dummy', 'Area', 'Defect Name', 'Multiple', 'Threshold_OK'];
    let csv = headers.join(',') + '\n';

    defectTypes.forEach(dt => {
      const row = [
        dt.ai_code,
        dt.side || '',
        dt.unit_dummy || '',
        dt.area || '',
        dt.defect_name,
        dt.multiple || '',
        dt.threshold_ok || ''
      ];
      csv += row.map(val => `"${val}"`).join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `defect_types_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const renderSpecification = (spec: Specification, level: number = 2): JSX.Element => {
    const sectionId = `spec-${spec.id}`;
    const isExpanded = expandedSections.has(sectionId);

    return (
      <div key={spec.id} className={`ml-${level * 4} mt-2`}>
        <div
          className="flex items-center gap-2 p-2 bg-background-elevated border border-border rounded cursor-pointer hover:bg-background-card"
          onClick={() => toggleSection(sectionId)}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4 text-accent-primary" /> : <ChevronRight className="w-4 h-4 text-accent-primary" />}
          <span className="text-sm font-semibold text-text-primary">
            Spec: {spec.measurement_name}
          </span>
          <span className="text-xs text-text-muted ml-auto">
            Unit: {spec.unit || 'N/A'} | Sub-Op: {spec.sub_logical_operator || 'N/A'}
          </span>
        </div>

        {isExpanded && (
          <div className="ml-6 mt-2">
            {spec.expressions && spec.expressions.length > 0 && (
              <table className="w-full text-xs bg-background-primary border border-border rounded mb-2">
                <thead className="bg-background-elevated">
                  <tr>
                    <th className="py-2 px-3 text-left text-text-secondary">Value</th>
                    <th className="py-2 px-3 text-left text-text-secondary">Inequality Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {spec.expressions.map((expr, idx) => (
                    <tr key={idx} className="border-t border-border">
                      <td className="py-1 px-3 text-text-primary">{expr.value}</td>
                      <td className="py-1 px-3 text-text-primary">{expr.inequality_sign}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {spec.sub_specifications && spec.sub_specifications.map(subSpec =>
              renderSpecification(subSpec, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI 판정 기준 관리"
        description="고객사별 PCB 불량 판정 기준 상세 관리"
      />

      <div className="grid grid-cols-[0.8fr_1.5fr_1fr] gap-4 h-[calc(100vh-200px)]">
        {/* 왼쪽 패널: Customers */}
        <div className="bg-background-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-background-elevated border-b border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-accent-primary" />
              <h3 className="text-lg font-bold text-text-primary">Customers</h3>
            </div>
            <div className="flex gap-2 text-xs">
              <button className="px-3 py-1 bg-background-primary border border-border rounded text-text-secondary hover:bg-background-elevated">
                분류명
              </button>
              <button className="px-3 py-1 bg-accent-primary text-background-primary rounded">
                분류2
              </button>
              <button className="px-3 py-1 bg-background-primary border border-border rounded text-text-secondary hover:bg-background-elevated">
                SPEC별 상세
              </button>
              <button className="px-3 py-1 bg-background-primary border border-border rounded text-text-secondary hover:bg-background-elevated">
                리비젼
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-background-elevated sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Customer</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Category3</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Customized</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Rms Rev</th>
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr
                    key={spec.id}
                    onClick={() => handleSpecClick(spec.id)}
                    className={`border-b border-border cursor-pointer hover:bg-background-elevated ${
                      selectedSpecId === spec.id ? 'bg-accent-primary/10 border-l-4 border-l-accent-primary' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-text-primary">{spec.customer}</td>
                    <td className="py-2 px-3 text-text-primary">{spec.category3}</td>
                    <td className="py-2 px-3 text-text-primary">{spec.customized}</td>
                    <td className="py-2 px-3 text-text-primary">{spec.rms_rev}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 중앙 패널: DefectTypeList */}
        <div className="bg-background-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-background-elevated border-b border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-primary">DefectTypeList</h3>
              <div className="flex gap-2">
                <button
                  onClick={exportDefectTypesToCSV}
                  className="px-3 py-1 bg-gradient-accent text-background-primary rounded text-xs hover:opacity-90 flex items-center gap-1"
                >
                  <FileDown className="w-3 h-3" />
                  Export CSV
                </button>
                <button className="px-3 py-1 bg-background-primary border border-border rounded text-xs text-text-secondary hover:bg-background-elevated">
                  견본불량등록시
                </button>
                <button className="px-3 py-1 bg-background-primary border border-border rounded text-xs text-text-secondary hover:bg-background-elevated">
                  DefectType복사
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-background-elevated sticky top-0 z-10">
                <tr className="border-b border-border">
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">AI_Code</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Side</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Unit_Dummy</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Area</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Defect Name</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Multiple</th>
                  <th className="py-2 px-3 text-left text-text-secondary font-semibold">Threshold_OK</th>
                </tr>
              </thead>
              <tbody>
                {defectTypes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted">
                      왼쪽에서 고객사를 선택하세요
                    </td>
                  </tr>
                ) : (
                  defectTypes.map((dt) => (
                    <tr
                      key={dt.id}
                      onClick={() => handleDefectTypeClick(dt.id)}
                      className={`border-b border-border cursor-pointer hover:bg-background-elevated ${
                        selectedDefectTypeId === dt.id ? 'bg-accent-primary/10 border-l-4 border-l-accent-primary' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-accent-primary font-mono font-semibold">{dt.ai_code}</td>
                      <td className="py-2 px-3 text-text-primary">{dt.side || '-'}</td>
                      <td className="py-2 px-3 text-text-primary">{dt.unit_dummy || '-'}</td>
                      <td className="py-2 px-3 text-text-primary">{dt.area || '-'}</td>
                      <td className="py-2 px-3 text-text-primary">{dt.defect_name}</td>
                      <td className="py-2 px-3 text-text-primary">{dt.multiple || '-'}</td>
                      <td className="py-2 px-3 text-text-primary">{dt.threshold_ok !== null ? dt.threshold_ok : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border p-2 bg-background-elevated grid grid-cols-2 gap-2">
            <div className="border border-border rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary">불량이미지</span>
                <div className="flex gap-1">
                  <button className="px-2 py-1 bg-background-primary border border-border rounded text-xs hover:bg-background-card">
                    리뷰선택
                  </button>
                  <button className="px-2 py-1 bg-background-primary border border-border rounded text-xs hover:bg-background-card">
                    저장
                  </button>
                  <button className="px-2 py-1 bg-background-primary border border-border rounded text-xs hover:bg-background-card">
                    삭제
                  </button>
                </div>
              </div>
              <div className="h-32 bg-background-primary border border-border rounded flex items-center justify-center text-text-muted text-xs">
                No Image data
              </div>
            </div>
            <div className="border border-border rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-secondary">정상/가/불가이미지</span>
                <div className="flex gap-1">
                  <button className="px-2 py-1 bg-background-primary border border-border rounded text-xs hover:bg-background-card">
                    리뷰선택
                  </button>
                  <button className="px-2 py-1 bg-background-primary border border-border rounded text-xs hover:bg-background-card">
                    저장
                  </button>
                  <button className="px-2 py-1 bg-background-primary border border-border rounded text-xs hover:bg-background-card">
                    삭제
                  </button>
                </div>
              </div>
              <div className="h-32 bg-background-primary border border-border rounded flex items-center justify-center text-text-muted text-xs">
                No Image data
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 패널: Specifications */}
        <div className="bg-background-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="bg-background-elevated border-b border-border p-4">
            <h3 className="text-lg font-bold text-text-primary mb-3">Specifications</h3>
            <div className="flex gap-2 flex-wrap mb-2">
              <button className="px-3 py-1 bg-gradient-accent text-background-primary rounded text-xs hover:opacity-90">
                + Measurements
              </button>
              <button className="px-3 py-1 bg-gradient-accent text-background-primary rounded text-xs hover:opacity-90">
                + Specifications
              </button>
              <button className="px-3 py-1 bg-gradient-accent text-background-primary rounded text-xs hover:opacity-90">
                + Expressions
              </button>
              <button className="px-3 py-1 bg-background-primary border border-border rounded text-xs text-text-secondary hover:bg-background-elevated">
                선택삭제
              </button>
            </div>
            <div className="flex gap-2 text-xs">
              <button className="px-3 py-1 bg-accent-primary text-background-primary rounded">
                조회
              </button>
              <button className="px-3 py-1 bg-background-primary border border-border rounded text-text-secondary hover:bg-background-elevated">
                수정
              </button>
              <button className="px-3 py-1 bg-background-primary border border-border rounded text-text-secondary hover:bg-background-elevated">
                저장
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {defectConditions.length === 0 ? (
              <p className="text-center text-text-muted py-8">
                왼쪽에서 고객사를 선택하고, 중앙에서 불량 유형을 선택하세요
              </p>
            ) : (
              defectConditions.map((dc, dcIndex) => {
                const dcSectionId = `dc-${dc.id}`;
                const isDcExpanded = expandedSections.has(dcSectionId);

                return (
                  <div key={dc.id} className="mb-4">
                    <div
                      className="flex items-center gap-2 p-3 bg-background-elevated border border-border rounded cursor-pointer hover:bg-background-card"
                      onClick={() => toggleSection(dcSectionId)}
                    >
                      {isDcExpanded ? <ChevronDown className="w-4 h-4 text-accent-primary" /> : <ChevronRight className="w-4 h-4 text-accent-primary" />}
                      <span className="text-sm font-bold text-text-primary">
                        Defect Condition #{dcIndex + 1}
                      </span>
                      <span className="text-xs text-text-muted ml-auto">
                        Machine: {dc.machine_type || 'N/A'} | Metal: {dc.metal_value_percent || 'N/A'}% | Default: {dc.no_measurement_default_result || 'N/A'}
                      </span>
                    </div>

                    {isDcExpanded && (
                      <div className="ml-6 mt-2 space-y-3">
                        {dc.measurement_conditions.map((mc, mcIndex) => {
                          const mcSectionId = `mc-${mc.id}`;
                          const isMcExpanded = expandedSections.has(mcSectionId);

                          return (
                            <div key={mc.id}>
                              <div
                                className="flex items-center gap-2 p-2 bg-background-elevated border border-accent-primary/30 rounded cursor-pointer hover:bg-background-card"
                                onClick={() => toggleSection(mcSectionId)}
                              >
                                {isMcExpanded ? <ChevronDown className="w-4 h-4 text-accent-primary" /> : <ChevronRight className="w-4 h-4 text-accent-primary" />}
                                <span className="text-sm font-semibold text-text-primary">
                                  Measurement #{mcIndex + 1}: {mc.measurement_name || 'N/A'}
                                </span>
                                <span className="text-xs text-text-muted ml-auto">
                                  Default: {mc.default_result_value || 'N/A'} | Operator: {mc.root_logical_operator || 'N/A'}
                                </span>
                              </div>

                              {isMcExpanded && (
                                <div className="ml-6 mt-2">
                                  {mc.measurement_condition_value && (
                                    <div className="p-2 bg-accent-primary/5 border border-accent-primary/20 rounded mb-2 text-xs">
                                      <strong>Condition:</strong> {mc.measurement_condition_value} {mc.measurement_condition_unit || ''} {mc.measurement_condition_inequality_sign || ''}
                                    </div>
                                  )}

                                  {mc.specifications.map((spec) => renderSpecification(spec))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
