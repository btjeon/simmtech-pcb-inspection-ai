/**
 * Customer Spec Management API Client
 * 고객사 Spec 관리 API 호출 함수들
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ========== Types ==========

export interface CustomerSpec {
  id: number;
  customer: string;
  category3: string;
  customized: string;
  rms_rev: number;
  threshold: number;
  rms_rev_datetime: string;
  is_changed: boolean;
  max_rev?: number;
  original_filename?: string;
  created_at: string;
  updated_at: string;
  defect_types?: DefectType[];
}

export interface DefectType {
  id: number;
  spec_id: number;
  ai_code: string;
  side?: string;
  unit_dummy?: string;
  area?: string;
  defect_name: string;
  multiple?: number;
  threshold_ok?: number;
  threshold_ng?: number;
  remark?: string;
  defect_conditions?: DefectCondition[];
}

export interface DefectCondition {
  id: number;
  defect_type_id: number;
  idx: number;
  machine_type?: string;
  metal_value_percent?: number;
  no_measurement_default_result: string;
  measurement_conditions?: MeasurementCondition[];
}

export interface MeasurementCondition {
  id: number;
  defect_condition_id: number;
  idx: number;
  measurement_name: string;
  default_result_value: string;
  root_logical_operator: string;
  measurement_condition_value?: number;
  measurement_condition_unit?: string;
  measurement_condition_inequality_sign?: string;
  specifications?: Specification[];
}

export interface Specification {
  id: number;
  measurement_condition_id: number;
  parent_spec_id?: number;
  measurement_name: string;
  unit: string;
  sub_logical_operator?: string;
  expressions?: Expression[];
  sub_specifications?: Specification[];
}

export interface Expression {
  id: number;
  specification_id: number;
  value: number;
  inequality_sign: string;
}

export interface SearchSpecsRequest {
  customer?: string;
  category3?: string;
  customized?: string;
  rms_rev?: number;
  skip?: number;
  limit?: number;
}

export interface AIJudgmentRequest {
  customer: string;
  category3: string;
  ai_code: string;
  measurements: Record<string, number>;
  machine_type?: string;
  metal_value_percent?: number;
}

export interface AIJudgmentResponse {
  result: string;
  judgment_path: string[];
  details: any;
}

// ========== Spec CRUD API ==========

export async function searchSpecs(params: SearchSpecsRequest): Promise<any[]> {
  const queryParams = new URLSearchParams();

  if (params.customer) queryParams.append('customer', params.customer);
  if (params.category3) queryParams.append('category3', params.category3);
  if (params.customized) queryParams.append('customized', params.customized);
  if (params.rms_rev) queryParams.append('rms_rev', params.rms_rev.toString());
  if (params.skip) queryParams.append('skip', params.skip.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/search-specs?${queryParams.toString()}`
  );

  if (!response.ok) {
    throw new Error('Spec 검색 실패');
  }

  const data = await response.json();
  return data.specs || [];
}

export async function getSpecById(specId: number): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/spec/${specId}`
  );

  if (!response.ok) {
    throw new Error('Spec 조회 실패');
  }

  const data = await response.json();
  return data.spec;
}

export async function getCustomers(): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/customers`
  );

  if (!response.ok) {
    throw new Error('고객사 목록 조회 실패');
  }

  const data = await response.json();
  return data.customers || [];
}

export async function getCategories(): Promise<string[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/categories`
  );

  if (!response.ok) {
    throw new Error('카테고리 목록 조회 실패');
  }

  const data = await response.json();
  return data.categories || [];
}

export async function deleteSpec(specId: number): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/delete-spec/${specId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    throw new Error('Spec 삭제 실패');
  }
}

// ========== JSON Import API ==========

export async function uploadSpecJson(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/specs/json/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'JSON 업로드 실패');
  }

  return response.json();
}

// ========== AI Judgment API ==========

export async function executeAIJudgment(
  request: AIJudgmentRequest
): Promise<AIJudgmentResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/ai-judgment/execute`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'AI 판정 실패');
  }

  return response.json();
}

// ========== Statistics API ==========

export async function getStats(): Promise<any> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/customer-spec/stats`
  );

  if (!response.ok) {
    throw new Error('통계 조회 실패');
  }

  const data = await response.json();
  return data.stats;
}
