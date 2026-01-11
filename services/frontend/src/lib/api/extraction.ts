/**
 * Defect Extraction API Client
 * 불량 이미지 추출 API 호출 함수들
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ========== Types ==========

export interface YOLOLoadModelRequest {
  modelPath: string;
}

export interface YOLOExtractRequest {
  defectImagePath: string;
  outputPath: string;
  confidence: number;
}

export interface YOLOExtractResponse {
  success: boolean;
  message: string;
  totalImages: number;
  totalContours: number;
  results: {
    imageIndex: number;
    imagePath: string;
    imageName: string;
    contourCount: number;
    contours: {
      contourIndex: number;
      area: number;
      perimeter: number;
      bbox: [number, number, number, number];
      center: [number, number];
    }[];
  }[];
}

export interface ImageNavigationRequest {
  imageIndex: number;
  contourIndex: number;
}

export interface MaskPostProcessRequest {
  operation: 'gv_offset' | 'morphology_open' | 'morphology_close' | 'invert' | 'select_center' | 'select_largest';
  params?: Record<string, any>;
}

export interface BoxAutoExtractRequest {
  x: number;
  y: number;
  w: number;
  h: number;
  method: 'grabcut' | 'watershed' | 'threshold' | 'canny' | 'kmeans';
}

export interface PolygonExtractRequest {
  points: [number, number][];
}

// ========== YOLO API ==========

export async function loadYOLOModel(request: YOLOLoadModelRequest) {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/yolo/load-model`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'YOLO 모델 로드 실패');
  }

  return response.json();
}

export async function extractWithYOLO(request: YOLOExtractRequest): Promise<YOLOExtractResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/yolo/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'YOLO 추출 실패');
  }

  return response.json();
}

export async function getYOLOPreview(request: ImageNavigationRequest) {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/yolo/get-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '프리뷰 가져오기 실패');
  }

  return response.json();
}

// ========== Mask Post-Processing API ==========

export async function postProcessMask(request: MaskPostProcessRequest) {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/mask/post-process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Mask 후처리 실패');
  }

  return response.json();
}

export async function getMaskOperations() {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/mask/operations`);

  if (!response.ok) {
    throw new Error('사용 가능한 연산 목록 가져오기 실패');
  }

  return response.json();
}

// ========== BOX AUTO API ==========

export async function extractWithBoxAuto(request: BoxAutoExtractRequest) {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/box-auto/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'BOX AUTO 추출 실패');
  }

  return response.json();
}

export async function getBoxAutoMethods() {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/box-auto/methods`);

  if (!response.ok) {
    throw new Error('BOX AUTO 알고리즘 목록 가져오기 실패');
  }

  return response.json();
}

// ========== POLYGON API ==========

export async function extractWithPolygon(request: PolygonExtractRequest) {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/polygon/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'POLYGON 추출 실패');
  }

  return response.json();
}

export async function validatePolygon(request: PolygonExtractRequest) {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/polygon/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '폴리곤 검증 실패');
  }

  return response.json();
}

// ========== Save API ==========

export async function saveMaskAndPatch() {
  const response = await fetch(`${API_BASE_URL}/api/v1/extraction/save`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || '저장 실패');
  }

  return response.json();
}
