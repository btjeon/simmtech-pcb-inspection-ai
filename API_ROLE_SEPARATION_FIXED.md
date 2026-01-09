# PCB Inspection AI - API 역할 분담 명세서 (수정)
**Next.js API Routes vs FastAPI - 명확한 책임 분리**

---

## 📊 API 역할 분담표

| 기능 영역 | 엔드포인트 | Next.js API | FastAPI | 비고 |
|----------|-----------|-------------|---------|------|
| **인증/인가** |
| 로그인 | POST /api/auth/login | ✅ | ❌ | NextAuth.js 사용 |
| 로그아웃 | POST /api/auth/logout | ✅ | ❌ | |
| 세션 확인 | GET /api/auth/session | ✅ | ❌ | |
| 토큰 검증 | - | ✅ 발급 | ✅ 검증 | JWT 공유 |
| **고객 관리** |
| 고객 목록 | GET /api/customers | ✅ | ❌ | CRUD |
| 고객 생성 | POST /api/customers | ✅ | ❌ | |
| 고객 수정 | PUT /api/customers/:id | ✅ | ❌ | |
| 고객 삭제 | DELETE /api/customers/:id | ✅ | ❌ | |
| **제품 관리** |
| 제품 목록 | GET /api/products | ✅ | ❌ | CRUD |
| 제품 생성 | POST /api/products | ✅ | ❌ | |
| 제품 수정 | PUT /api/products/:id | ✅ | ❌ | |
| **AI 판정 Spec 관리** |
| Spec 목록 | GET /api/specs | ✅ | ❌ | CRUD |
| Spec 생성 | POST /api/specs | ✅ | ❌ | |
| Spec 수정 | PUT /api/specs/:id | ✅ | ❌ | |
| **대시보드** |
| 메트릭 조회 | GET /api/dashboard/metrics | ✅ | ❌ | 통계 집계 |
| 통계 조회 | GET /api/dashboard/stats | ✅ | ❌ | |
| 활동 로그 | GET /api/dashboard/activity | ✅ | ❌ | |
| **AI 추론 관리** |
| 추론 실행 요청 | POST /api/inference/execute | ✅ | → FastAPI | 오케스트레이션 |
| 추론 상태 조회 | GET /api/inference/status/:id | ✅ | ❌ | DB에서 조회 |
| 추론 결과 조회 | GET /api/inference/results/:id | ✅ | ❌ | DB에서 조회 |
| 추론 이력 조회 | GET /api/inference/history | ✅ | ❌ | DB에서 조회 |
| **AI 추론 실행** (FastAPI) |
| 실제 AI 추론 | POST /api/ai/inference | ❌ | ✅ | GPU 작업 |
| 배치 추론 | POST /api/ai/inference/batch | ❌ | ✅ | 대량 처리 |
| **AI 모델 관리** |
| 모델 목록 | GET /api/ai/models | ❌ | ✅ | MLflow 연동 |
| 모델 배포 | POST /api/ai/models/deploy | ❌ | ✅ | |
| 모델 정보 | GET /api/ai/models/:id | ❌ | ✅ | |
| 모델 성능 조회 | GET /api/ai/models/:id/metrics | ❌ | ✅ | |
| **AI 학습/재학습** |
| 학습 시작 | POST /api/ai/training/start | ❌ | ✅ | GPU 작업 |
| 학습 상태 | GET /api/ai/training/:id/status | ❌ | ✅ | |
| 학습 중단 | POST /api/ai/training/:id/stop | ❌ | ✅ | |
| 학습 결과 | GET /api/ai/training/:id/results | ❌ | ✅ | |
| **학습 데이터 관리** |
| 데이터셋 목록 | GET /api/datasets | ✅ | ❌ | 메타데이터만 |
| 데이터셋 생성 | POST /api/datasets | ✅ | → FastAPI | 오케스트레이션 |
| 데이터 추가 | POST /api/ai/datasets/:id/images | ❌ | ✅ | 실제 처리 |
| 데이터 검증 | POST /api/ai/datasets/:id/validate | ❌ | ✅ | |
| **이미지 처리** |
| 이미지 업로드 | POST /api/images/upload | ✅ | ❌ | MinIO 저장 |
| 이미지 조회 | GET /api/images/:id | ✅ | ❌ | MinIO 조회 |
| 이미지 합성 (GAN) | POST /api/ai/images/synthesis | ❌ | ✅ | GPU 작업 |
| 이미지 검색 | POST /api/ai/images/search | ❌ | ✅ | 벡터 검색 |
| Relabeling | POST /api/ai/images/relabel | ❌ | ✅ | AI 처리 |
| **리포트** |
| 리포트 생성 | POST /api/reports/generate | ✅ | ❌ | PDF/Excel |
| 리포트 조회 | GET /api/reports/:id | ✅ | ❌ | |
| 리포트 다운로드 | GET /api/reports/:id/download | ✅ | ❌ | |
| **시스템 관리** |
| 시스템 상태 | GET /api/system/status | ✅ | ❌ | |
| 사용자 관리 | GET /api/users | ✅ | ❌ | CRUD |
| 설정 관리 | GET /api/settings | ✅ | ❌ | |
| **Health Check** |
| Next.js 상태 | GET /api/health | ✅ | ❌ | |
| FastAPI 상태 | GET /api/ai/health | ❌ | ✅ | |

---

## 🎯 핵심 원칙

### 1️⃣ Next.js API Routes
**역할**: 비즈니스 로직, 데이터 CRUD, 오케스트레이션

```typescript
담당:
✅ 데이터베이스 CRUD 작업
✅ 사용자 인증/인가
✅ 비즈니스 로직 처리
✅ 리포트 생성
✅ 대시보드 데이터 집계
✅ AI 작업 오케스트레이션 (FastAPI 호출)

사용 기술:
- Prisma ORM
- NextAuth.js
- PostgreSQL 직접 접근
```

### 2️⃣ FastAPI
**역할**: AI/ML 전용 (추론, 학습, 이미지 처리)

```python
담당:
✅ AI 모델 추론 (GPU)
✅ AI 모델 학습 (GPU)
✅ 이미지 합성 (GAN)
✅ 이미지 검색 (벡터)
✅ 모델 관리
✅ MLflow 연동

사용 기술:
- PyTorch
- OpenCV
- ONNX Runtime
- MLflow
- GPU 연산
```

---

## 🔄 데이터 흐름 예시

### 예시 1: AI 추론 실행

```
사용자 (프론트엔드)
    ↓
POST /api/inference/execute (Next.js)
    │
    ├─→ 1. 요청 검증
    ├─→ 2. DB에 추론 요청 저장 (status: pending)
    ├─→ 3. 고객/제품 정보 조회 (DB)
    │
    └─→ POST /api/ai/inference (FastAPI)
         │
         ├─→ 1. MinIO에서 이미지 로드
         ├─→ 2. AI 모델 추론 실행 (GPU)
         ├─→ 3. 결과 DB 저장
         │
         ←─ 응답
    │
    ├─→ 4. DB 상태 업데이트 (status: completed)
    │
    ←─ 응답 (추론 ID)
```

### 예시 2: 모델 학습

```
사용자
    ↓
POST /api/training/start (Next.js)
    │
    ├─→ 1. 요청 검증
    ├─→ 2. DB에 학습 작업 저장
    │
    └─→ POST /api/ai/training/start (FastAPI)
         │
         ├─→ 1. 데이터셋 로드
         ├─→ 2. 모델 학습 (GPU)
         ├─→ 3. MLflow에 결과 기록
         ├─→ 4. DB 업데이트
         │
         ←─ 응답
    │
    ←─ 응답
```

### 예시 3: 이미지 합성 (GAN)

```
사용자
    ↓
POST /api/images/synthesis (Next.js)
    │
    ├─→ 1. 요청 검증
    ├─→ 2. DB에 작업 등록
    │
    └─→ POST /api/ai/images/synthesis (FastAPI)
         │
         ├─→ 1. GAN 모델 로드
         ├─→ 2. 이미지 생성 (GPU)
         ├─→ 3. MinIO에 저장
         ├─→ 4. DB 업데이트
         │
         ←─ 응답 (생성된 이미지 URL)
    │
    ←─ 응답
```

---

## 📁 수정된 폴더 구조

### Next.js API Routes

```
frontend/src/app/api/
├── auth/                    # 인증
│   └── [...nextauth]/
│       └── route.ts
│
├── customers/               # 고객 관리
│   ├── route.ts            # GET, POST
│   └── [id]/
│       └── route.ts        # PUT, DELETE
│
├── products/                # 제품 관리
│   ├── route.ts
│   └── [id]/
│       └── route.ts
│
├── specs/                   # Spec 관리
│   ├── route.ts
│   └── [id]/
│       └── route.ts
│
├── dashboard/               # 대시보드
│   ├── metrics/
│   │   └── route.ts
│   └── stats/
│       └── route.ts
│
├── inference/               # 추론 오케스트레이션
│   ├── execute/
│   │   └── route.ts        # POST → FastAPI 호출
│   ├── status/
│   │   └── [id]/
│   │       └── route.ts    # GET (DB 조회)
│   └── results/
│       └── [id]/
│           └── route.ts    # GET (DB 조회)
│
├── datasets/                # 데이터셋 관리
│   ├── route.ts            # GET, POST
│   └── [id]/
│       └── route.ts
│
├── images/                  # 이미지 업로드/조회
│   ├── upload/
│   │   └── route.ts
│   └── [id]/
│       └── route.ts
│
├── reports/                 # 리포트
│   ├── generate/
│   │   └── route.ts
│   └── [id]/
│       └── route.ts
│
└── health/                  # Health Check
    └── route.ts
```

### FastAPI Routes

```
backend/app/api/v1/
├── inference.py             # AI 추론 실행
│   POST /api/ai/inference
│   POST /api/ai/inference/batch
│
├── training.py              # AI 학습
│   POST /api/ai/training/start
│   GET /api/ai/training/{id}/status
│   POST /api/ai/training/{id}/stop
│   GET /api/ai/training/{id}/results
│
├── models.py                # 모델 관리
│   GET /api/ai/models
│   POST /api/ai/models/deploy
│   GET /api/ai/models/{id}
│   GET /api/ai/models/{id}/metrics
│
├── images.py                # 이미지 처리
│   POST /api/ai/images/synthesis
│   POST /api/ai/images/search
│   POST /api/ai/images/relabel
│
└── datasets.py              # 데이터셋 처리
    POST /api/ai/datasets/{id}/images
    POST /api/ai/datasets/{id}/validate
```

---

## 🔧 수정된 코드 예시

### Next.js: 추론 오케스트레이션

```typescript
// frontend/src/app/api/inference/execute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import axios from 'axios';

const AI_API_URL = process.env.AI_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lotId, bundleId, customerId } = body;

    // 1. 요청 검증
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: '고객사를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 2. DB에 추론 요청 저장
    const inference = await prisma.inference.create({
      data: {
        lotId,
        bundleId,
        customerId,
        status: 'pending',
        requestedAt: new Date(),
      },
    });

    // 3. FastAPI로 비동기 전달
    axios.post(`${AI_API_URL}/api/v1/inference`, {
      inferenceId: inference.id,
      lotId,
      bundleId,
      customerId,
    }).catch(error => {
      console.error('AI service error:', error);
    });

    // 4. 즉시 응답
    return NextResponse.json({
      inferenceId: inference.id,
      status: 'pending',
      message: '추론 요청이 접수되었습니다.',
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '추론 요청 실패' },
      { status: 500 }
    );
  }
}
```

### FastAPI: 실제 AI 추론

```python
# backend/app/api/v1/inference.py
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
import torch
from app.core.ai_engine import InferenceEngine

router = APIRouter(prefix="/inference", tags=["AI Inference"])
engine = InferenceEngine()

class InferenceRequest(BaseModel):
    inferenceId: str
    lotId: str
    bundleId: str
    customerId: str

@router.post("")
async def create_inference(
    request: InferenceRequest,
    background_tasks: BackgroundTasks
):
    """AI 추론 요청 접수"""
    
    # 백그라운드로 실제 추론 실행
    background_tasks.add_task(
        run_inference_task,
        request.inferenceId,
        request.lotId,
        request.bundleId,
        request.customerId
    )
    
    return {
        "message": "AI inference started",
        "inferenceId": request.inferenceId
    }

async def run_inference_task(
    inference_id: str,
    lot_id: str,
    bundle_id: str,
    customer_id: str
):
    """실제 AI 추론 실행 (백그라운드)"""
    
    # GPU 작업
    with torch.no_grad():
        results = engine.predict(...)
    
    # DB 저장
    # ...
```

### Next.js: 고객 관리 (CRUD)

```typescript
// frontend/src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const customers = await prisma.customer.findMany({
    include: {
      products: true,
    },
  });

  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const customer = await prisma.customer.create({
    data: body,
  });

  return NextResponse.json(customer, { status: 201 });
}
```

### FastAPI: 이미지 합성 (GAN)

```python
# backend/app/api/v1/images.py
from fastapi import APIRouter
from app.core.gan_engine import GANEngine

router = APIRouter(prefix="/images", tags=["Image Processing"])
gan_engine = GANEngine()

@router.post("/synthesis")
async def synthesize_images(request: SynthesisRequest):
    """GAN을 사용한 이미지 합성"""
    
    # GPU에서 이미지 생성
    generated_images = gan_engine.generate(
        defect_type=request.defectType,
        count=request.count
    )
    
    # MinIO에 저장
    urls = await save_to_minio(generated_images)
    
    return {
        "generated": len(urls),
        "urls": urls
    }
```

---

## ⚠️ 중요 원칙

### ✅ DO (해야 할 것)

1. **Next.js API Routes**
   - 모든 데이터베이스 CRUD
   - 비즈니스 로직
   - 사용자 인증
   - FastAPI 호출 (오케스트레이션)

2. **FastAPI**
   - AI 추론 실행
   - 모델 학습
   - 이미지 처리 (GAN, 검색)
   - GPU 작업

### ❌ DON'T (하지 말아야 할 것)

1. **Next.js에서 하지 말 것**
   - ❌ AI 모델 로딩
   - ❌ GPU 연산
   - ❌ 이미지 전처리 (간단한 업로드 제외)

2. **FastAPI에서 하지 말 것**
   - ❌ 일반 CRUD 작업
   - ❌ 사용자 인증 로직
   - ❌ 비즈니스 로직

---

## 🎯 요약

### Next.js API Routes
```
역할: "비즈니스 + 오케스트레이션"
- 데이터 관리 (고객, 제품, Spec)
- 인증/인가
- 대시보드
- AI 작업 요청 → FastAPI 호출
```

### FastAPI
```
역할: "AI/ML 전용"
- AI 추론
- 모델 학습
- 이미지 처리
- GPU 작업
```

---

**문서 버전**: 1.1 (수정)  
**수정 날짜**: 2025-01-07  
**수정 내용**: API 역할 분담 명확화
