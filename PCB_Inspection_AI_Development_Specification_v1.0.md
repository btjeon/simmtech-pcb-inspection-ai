# PCB Inspection AI MLOps - 전체 개발 명세서
**SIMMTECH PCB Inspection AI Edge MLOps Platform**

**프로젝트 기간**: 3개월 (12-14주) + 추가 3개월 확장 옵션  ㅊㅇ 
**작성일**: 2025-01-07  
**버전**: 1.0

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [현재 상황 및 제약 사항](#2-현재-상황-및-제약-사항)
3. [시스템 아키텍처](#3-시스템-아키텍처)
4. [기술 스택](#4-기술-스택)
5. [개발 로드맵 (3개월)](#5-개발-로드맵-3개월)
6. [기능 명세](#6-기능-명세)
7. [데이터베이스 설계](#7-데이터베이스-설계)
8. [API 명세](#8-api-명세)
9. [UI/UX 설계](#9-uiux-설계)
10. [배포 전략](#10-배포-전략)
11. [외주 협업 계획](#11-외주-협업-계획)
12. [리스크 관리](#12-리스크-관리)
13. [향후 확장 계획](#13-향후-확장-계획)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 목적

**현재 문제**:
- 기존 C# WinForm 기반 분산 시스템 (RMS, PMS, BHM, MDM, TMS)
- 통합 관리 어려움
- MLOps 부재
- 레거시/신규 장비 혼재

**목표**:
- 통합 웹 기반 Edge MLOps 플랫폼 구축
- AI 추론/학습/재학습 자동화
- 4개 사이트 독립 운영 (AITECH, DME, FNH, F95)
- 레거시 → 신규 점진적 전환

### 1.2 핵심 가치

```yaml
독립 모듈 (Week 1-8):
  ✅ 이미지 합성 (GAN) → 즉시 활용
  ✅ 이미지 검색 (벡터) → 즉시 활용
  ✅ 모델 학습 도구 → AI 팀 활용

신규 장비 통합 (Week 9-14):
  ✅ AI 추론 실행 → 양산 적용
  ✅ 추론 결과 분석 → 데이터 기반 의사결정
  ✅ 대시보드 → 실시간 모니터링

레거시 통합 (추가 3개월):
  ⚠️ 데이터 마이그레이션
  ⚠️ 통합 대시보드
  ⚠️ 완전 MLOps 적용
```

---

## 2. 현재 상황 및 제약 사항

### 2.1 양산 환경

#### 레거시 장비 그룹
```yaml
상태: 양산 운영 중
시스템: C# WinForm
데이터:
  - ❌ DB 없음 (파일 기반)
  - ❌ 데이터 정의서 불완전
  - 형식: JSON/CSV/XML 추정
통합 난이도: 🔴 매우 높음
3개월 목표: 준비만 (통합은 추후)
```

#### 신규 장비 그룹
```yaml
상태: 양산 운영 중
시스템: C# WinForm (개선)
데이터:
  - ✅ PostgreSQL DB 있음
  - ✅ AI 추론 결과 DB 저장
  - ✅ 검사 결과 DB 저장
통합 난이도: 🟡 중간
3개월 목표: 완전 통합
```

### 2.2 제약 사항

```yaml
시간: 3개월 (12-14주)
인력:
  - 당신: AI 전문 (Python/PyTorch)
  - SmartCore: 외주 (TypeScript/React)
  - 총 3-4명
양산 영향: 최소화 필수
배포: 점진적 (독립 모듈 우선)
```

---

## 3. 시스템 아키텍처

### 3.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   사용자 (브라우저)                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx (Reverse Proxy)                      │
│              Port 80                                    │
└────────┬────────────────────────────┬───────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│   Next.js        │         │   FastAPI        │
│   (Port 3000)    │◄───────►│   (Port 8000)    │
├──────────────────┤         ├──────────────────┤
│ Frontend         │         │ AI Core          │
│ - React/TS       │         │ - PyTorch        │
│ - Tailwind       │         │ - GPU 작업       │
│                  │         │                  │
│ API Routes       │         │ AI API           │
│ - CRUD           │         │ - 추론           │
│ - 비즈니스 로직  │         │ - 학습           │
│ - 오케스트레이션 │         │ - 이미지 처리    │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         └──────────┬─────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│                  데이터 레이어                           │
├──────────────┬──────────────┬──────────────┬───────────┤
│ PostgreSQL   │ Redis        │ MinIO        │ Qdrant    │
│ (Primary DB) │ (Cache)      │ (Images)     │ (Vector)  │
└──────────────┴──────────────┴──────────────┴───────────┘
```

### 3.2 3-Layer 데이터 아키텍처

```
Layer 1: 독립 모듈 데이터 (레거시/신규 무관)
├─ MinIO: 합성 이미지, 검색 이미지
├─ Qdrant: 벡터 인덱스
└─ MLflow: 학습 실험, 모델

Layer 2: 신규 장비 데이터 (DB 통합 완료)
├─ PostgreSQL: 검사 데이터, 추론 결과
└─ MinIO: 검사 이미지

Layer 3: 레거시 장비 데이터 (마이그레이션 필요)
├─ 현재: 파일 기반 (JSON/CSV)
└─ 목표: PostgreSQL 통합 (추후 3개월)
```

---

## 4. 기술 스택

### 4.1 Frontend

```json
{
  "framework": "Next.js 14 (App Router)",
  "language": "TypeScript 5.x",
  "styling": "Tailwind CSS 3.x",
  "ui_library": "shadcn/ui + Radix UI",
  "state": {
    "server": "@tanstack/react-query v5",
    "client": "Zustand 4.x"
  },
  "forms": "React Hook Form + Zod",
  "charts": "Recharts 2.x",
  "icons": "lucide-react",
  "theme": "Palantir-inspired Dark Theme"
}
```

**Palantir 테마**:
```typescript
colors: {
  background: '#0F1117',
  accent: '#00E3AE',
  text: '#E1E5E9',
  border: '#2C3038'
}
```

### 4.2 Backend - Next.js API Routes

```json
{
  "framework": "Next.js API Routes",
  "language": "TypeScript",
  "orm": "Prisma 5.x",
  "auth": "NextAuth.js v5",
  "validation": "Zod"
}
```

**역할**:
- ✅ CRUD (고객, 제품, Spec)
- ✅ 사용자 인증/인가
- ✅ 대시보드 데이터
- ✅ 리포트 생성
- ✅ AI 작업 오케스트레이션

### 4.3 Backend - FastAPI (AI Server)

```json
{
  "framework": "FastAPI 0.110+",
  "language": "Python 3.11+",
  "async": "asyncio, uvicorn",
  "orm": "SQLAlchemy 2.0",
  "validation": "Pydantic 2.5"
}
```

**역할**:
- ✅ AI 추론 (GPU)
- ✅ 모델 학습 (GPU)
- ✅ 이미지 합성 (GAN)
- ✅ 이미지 검색 (벡터)
- ✅ MLflow 연동

### 4.4 AI/ML Stack

```python
{
  "framework": "PyTorch 2.2+",
  "inference": "ONNX Runtime (GPU)",
  "vision": "OpenCV 4.9+",
  "mlops": "MLflow 2.10+",
  "vector_db": "Qdrant 1.7+",
  "gpu": "CUDA 12.x"
}
```

### 4.5 Database & Storage

```json
{
  "primary_db": "PostgreSQL 16",
  "cache": "Redis 7.x",
  "object_storage": "MinIO (S3 Compatible)",
  "vector_db": "Qdrant 1.7+",
  "file_storage": "NAS (기존 활용)"
}
```

### 4.6 Infrastructure

```json
{
  "container": "Docker 24.x + Docker Compose",
  "reverse_proxy": "Nginx 1.25+",
  "future": "Kubernetes (Next Project)"
}
```

---

## 5. 개발 로드맵 (3개월)

### Phase 0: 기반 구축 (Week 1-2)

```yaml
목표: 개발 환경 및 빈 껍데기 배포

Infrastructure:
  - Docker Compose 설정
  - PostgreSQL, Redis, MinIO 설정
  - Nginx 설정

Frontend:
  - Next.js 초기화
  - Palantir 테마 구축
  - 기본 레이아웃 (Header, Sidebar)
  - 로그인 페이지 (간단)
  - 메뉴 구조 (전부 "준비 중")

Backend:
  - FastAPI 초기화
  - DB 스키마 설계 (신규 장비 중심)
  - Health Check API

배포:
  ✅ AITECH (빈 껍데기)
  ✅ 로그인 → 메인 화면 접근 가능
  ✅ 모든 메뉴 보임 (비활성화)

인력:
  - 당신: Infrastructure, DB 설계, FastAPI 기반
  - SmartCore: Next.js 초기화, 기본 UI
```

---

### Phase 1: 독립 모듈 #1 - 이미지 합성 (Week 3-4)

```yaml
목표: GAN 이미지 합성 기능 배포

특징:
  ✅ DB 불필요
  ✅ 레거시/신규 무관
  ✅ FastAPI 단독
  ✅ 즉시 사용 가능

기능:
  - 불량 유형 선택 (드롭다운)
  - 생성 개수 입력
  - 생성 버튼 클릭
  - GAN으로 이미지 생성 (GPU)
  - MinIO에 저장
  - 생성된 이미지 그리드 표시
  - 다운로드

API:
  Next.js:
    - 없음 (FastAPI 직접 호출)
  
  FastAPI:
    - POST /api/v1/images/synthesis
    - GET /api/v1/images/synthesis/:id/status
    - GET /api/v1/images/synthesis/:id/download

저장소:
  - MinIO: 생성된 이미지
  - Redis: 작업 상태 (임시)

UI:
  - 간단한 폼
  - 진행 상황 표시
  - 이미지 그리드
  - 다운로드 버튼

배포:
  ✅ AITECH
  ✅ 즉시 사용 가능 🎉

가치:
  ✅ 학습 데이터 증강
  ✅ 불량 유형별 샘플 생성

인력:
  - 당신: FastAPI GAN 엔진 개발
  - SmartCore: Next.js UI 개발
```

**코드 예시**:
```typescript
// app/(dashboard)/image-synthesis/page.tsx
'use client';

export default function ImageSynthesisPage() {
  const [defectType, setDefectType] = useState('');
  const [count, setCount] = useState(100);
  const [status, setStatus] = useState('idle');

  const handleGenerate = async () => {
    setStatus('generating');
    const response = await fetch('http://fastapi:8000/api/v1/images/synthesis', {
      method: 'POST',
      body: JSON.stringify({ defectType, count })
    });
    // ... 폴링으로 상태 확인
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">◈ 이미지 합성 (GAN)</h1>
      <Card>
        <Select value={defectType} onChange={setDefectType}>
          <option value="scratch">스크래치</option>
          <option value="void">보이드</option>
        </Select>
        <Input type="number" value={count} onChange={setCount} />
        <Button onClick={handleGenerate}>생성 시작</Button>
      </Card>
      {status === 'generating' && <ProgressBar />}
      {status === 'completed' && <ImageGrid images={images} />}
    </div>
  );
}
```

---

### Phase 2: 독립 모듈 #2 - 이미지 검색 (Week 5-6)

```yaml
목표: 벡터 기반 유사 이미지 검색

특징:
  ✅ Qdrant (벡터 DB)만 사용
  ✅ 레거시/신규 무관
  ✅ 즉시 사용 가능

기능:
  - 이미지 업로드
  - 유사 이미지 검색 (벡터)
  - 과거 불량 사례 조회
  - 유사도 점수 표시

API:
  FastAPI:
    - POST /api/v1/images/search
    - POST /api/v1/images/index (이미지 인덱싱)

저장소:
  - Qdrant: 벡터 인덱스
  - MinIO: 이미지 파일

배포:
  ✅ AITECH, DME
  ✅ 즉시 사용 가능 🎉

가치:
  ✅ 유사 불량 검색
  ✅ 불량 원인 분석

인력:
  - 당신: 벡터 인덱싱, Qdrant 연동
  - SmartCore: 검색 UI, 이미지 뷰어
```

---

### Phase 3: 독립 모듈 #3 - 모델 학습 도구 (Week 7-8)

```yaml
목표: AI 모델 학습 UI

특징:
  ✅ MLflow 연동
  ✅ 독립 실행

기능:
  - 데이터셋 업로드
  - 하이퍼파라미터 설정
  - 학습 시작
  - 실시간 진행 상황
  - 학습 메트릭 (Loss, Accuracy)
  - MLflow 실험 조회
  - 모델 성능 비교
  - 모델 배포

API:
  FastAPI:
    - POST /api/v1/training/start
    - GET /api/v1/training/:id/status
    - GET /api/v1/training/:id/metrics
    - GET /api/v1/experiments (MLflow)
    - POST /api/v1/models/deploy

배포:
  ✅ 전체 사이트
  ✅ AI 팀 활용 🎉

가치:
  ✅ 모델 개발 가속
  ✅ 실험 관리

인력:
  - 당신: FastAPI 학습 엔진, MLflow 연동
  - SmartCore: 학습 관리 UI
```

---

### Phase 4: 신규 장비 통합 준비 (Week 9-10)

```yaml
목표: 신규 장비 DB 분석 및 통합 설계

작업:
  1. 신규 장비 DB 스키마 분석
     - C# WinForm이 사용하는 테이블 파악
     - 검사 결과 데이터 구조 분석
     - AI 추론 결과 저장 방식 파악
  
  2. Edge MLOps DB 설계
     - 기존 신규 장비 스키마 확장
     - 추가 테이블 설계:
       * inference_requests
       * inference_results
       * ai_specs
       * customers_products (확장)
  
  3. 데이터 마이그레이션 계획
     - 신규 장비 DB → MLOps DB 연동 전략
     - 뷰(View) 생성 또는 직접 연동
  
  4. 통합 API 설계
     - FastAPI 엔드포인트 설계
     - Pydantic 모델 정의
     - API 명세서 작성 (Swagger)

배포:
  ⚠️ 준비만 (배포 안 함)

결과물:
  - DB 스키마 문서 (ERD)
  - 마이그레이션 계획서
  - API 명세서 (Swagger)
  - 통합 전략 문서

인력:
  - 당신: DB 분석, 스키마 설계
  - SmartCore: API 명세 리뷰
```

---

### Phase 5: 신규 장비 - AI 추론 통합 (Week 11-12)

```yaml
목표: 신규 장비만 MLOps 통합

데이터 흐름:
  [신규 검사 장비]
    ↓ JSON
  [신규 C# WinForm]
    ↓ INSERT
  [PostgreSQL - 신규 장비 테이블]
    ↑ SELECT (추론 대상)
  [FastAPI - AI 추론]
    ↓ UPDATE (추론 결과)
  [PostgreSQL - 추론 결과 테이블]
    ↑ SELECT
  [Next.js - UI]

기능:
  - LOT/번들 선택 (신규 장비만 표시)
  - 추론 실행 버튼
  - 실시간 진행 상황 (WebSocket)
  - 추론 결과 조회
  - 이미지 뷰어
  - NG 이미지 하이라이트

제약:
  ⚠️ 신규 장비만 지원
  ❌ 레거시는 아직 안 됨

API:
  Next.js:
    - POST /api/inference/execute (오케스트레이션)
    - GET /api/inference/status/:id
    - GET /api/inference/results/:id
  
  FastAPI:
    - POST /api/v1/inference (실제 추론)
    - WebSocket /ws/inference/:id (실시간 상태)

배포:
  ✅ AITECH (신규 장비만)
  ✅ 양산 적용 🚀

가치:
  ✅ 신규 장비 MLOps 시작
  ✅ 자동화된 검사 판정

인력:
  - 당신: FastAPI AI 추론 엔진, GPU 최적화
  - SmartCore: Next.js 추론 UI, WebSocket 연동
```

---

### Phase 6: 신규 장비 - 결과 분석 (Week 13-14)

```yaml
목표: 신규 장비 추론 결과 분석

기능:
  - 추론 이력 조회 (신규 장비만)
  - 검사 통계 (OK/NG 비율)
  - 불량 유형별 통계
  - 시간대별 트렌드 차트
  - 상세 결과 뷰어
  - 이미지 확대/축소
  - CSV/Excel 다운로드

제약:
  ⚠️ 신규 장비 데이터만

API:
  Next.js:
    - GET /api/results/summary
    - GET /api/results/trends
    - GET /api/results/details/:id
    - POST /api/reports/generate

배포:
  ✅ AITECH, DME (신규 장비 사이트)
  ✅ 데이터 기반 의사결정 🎉

가치:
  ✅ 검사 품질 모니터링
  ✅ 불량 트렌드 분석

------- 3개월 마일스톤 완료! 🎉 -------

인력:
  - 당신: 통계 집계 쿼리, 리포트 생성
  - SmartCore: 대시보드 UI, 차트
```

---

## 6. 기능 명세

### 6.1 메뉴 구조

```
◯ 메인 대시보드 (Phase 6)
  - 전체 검사 현황
  - 실시간 통계
  - 최근 활동

◯ 제품 정보 관리 (추후)
  제품_고객_불량 유형 정보

◯ AI 판정 기준 관리 (추후)
  고객 Spec 관리

◯ AI 운영 관리 (Phase 5)
  ⟐ AI 추론 실행

◯ AI 추론 결과 분석 (Phase 6)
  ▤ 지표 현황 Report
  ◆ AI 추론 결과 상세 분석

◯ AI 학습 관리 (Phase 1-3)
  ◪ 학습 데이터 추가 및 정합성 검증 (Phase 3)
  ▶ 모델 학습 및 결과 분석 (Phase 3)
  ⟡ 학습 데이터셋 조회 및 관리 (Phase 3)
  ◐ 이미지 검색 (Phase 2)
  ◈ 이미지 합성 (Phase 1)

◯ 시스템 관리 (추후)
  △ 시스템 모니터링
  ⬟ 사용자 환경 설정
```

### 6.2 3개월 완성 기능

```yaml
완료:
  ✅ ◈ 이미지 합성 (GAN) - Week 3-4
  ✅ ◐ 이미지 검색 (벡터) - Week 5-6
  ✅ ▶ 모델 학습 도구 - Week 7-8
  ✅ ⟐ AI 추론 실행 (신규) - Week 11-12
  ✅ ▤ 지표 현황 Report (신규) - Week 13-14
  ✅ ◆ 추론 결과 상세 분석 (신규) - Week 13-14

미완성 (추후):
  ⚠️ 제품 정보 관리
  ⚠️ AI 판정 기준 관리
  ⚠️ 시스템 관리
  ⚠️ 레거시 장비 통합
```

---

## 7. 데이터베이스 설계

### 7.1 신규 장비 중심 스키마

```sql
-- 신규 장비 검사 데이터 (기존 활용)
CREATE TABLE new_equipment_inspections (
    id SERIAL PRIMARY KEY,
    lot_id VARCHAR(50) NOT NULL,
    bundle_id VARCHAR(50) NOT NULL,
    equipment_id VARCHAR(50),
    inspection_time TIMESTAMP,
    raw_data JSONB,  -- 검사 장비 원본
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_lot_bundle ON new_equipment_inspections(lot_id, bundle_id);

-- AI 추론 요청
CREATE TABLE inference_requests (
    id SERIAL PRIMARY KEY,
    lot_id VARCHAR(50) NOT NULL,
    bundle_id VARCHAR(50) NOT NULL,
    equipment_type VARCHAR(20) NOT NULL,  -- 'NEW' or 'LEGACY'
    customer_id INTEGER,
    product_id INTEGER,
    spec_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_status ON inference_requests(status);

-- AI 추론 결과
CREATE TABLE inference_results (
    id SERIAL PRIMARY KEY,
    inference_request_id INTEGER REFERENCES inference_requests(id),
    image_id VARCHAR(100) NOT NULL,
    image_path VARCHAR(500),
    decision VARCHAR(10),  -- 'OK', 'NG', 'UNK'
    confidence FLOAT,
    defect_type VARCHAR(50),
    defect_position JSONB,  -- {x, y, width, height}
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_inference_request ON inference_results(inference_request_id);

-- 통합 뷰 (신규만, 나중에 레거시 추가)
CREATE VIEW unified_inspections AS
SELECT 
    'NEW' as equipment_type,
    lot_id,
    bundle_id,
    inspection_time,
    raw_data
FROM new_equipment_inspections;
```

### 7.2 독립 모듈 데이터

```sql
-- 이미지 합성 작업
CREATE TABLE image_synthesis_jobs (
    id SERIAL PRIMARY KEY,
    defect_type VARCHAR(50),
    count INTEGER,
    status VARCHAR(20),  -- pending, processing, completed
    output_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- MLflow 실험 (외부 MLflow 사용)
-- 별도 DB 불필요

-- Qdrant 벡터 (Qdrant 자체 저장소)
-- 별도 DB 불필요
```

---

## 8. API 명세

### 8.1 API 역할 분담

| 기능 | Next.js API Routes | FastAPI | 비고 |
|------|-------------------|---------|------|
| **인증** | ✅ | ❌ | NextAuth.js |
| **CRUD** | ✅ | ❌ | Prisma |
| **대시보드** | ✅ | ❌ | 통계 집계 |
| **AI 추론** | 오케스트레이션 | ✅ 실행 | GPU |
| **모델 학습** | ❌ | ✅ | GPU |
| **이미지 합성** | ❌ | ✅ | GAN |
| **이미지 검색** | ❌ | ✅ | 벡터 |

### 8.2 주요 엔드포인트

#### Next.js API Routes

```typescript
// 인증
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/session

// 대시보드
GET    /api/dashboard/metrics
GET    /api/dashboard/stats

// AI 추론 (오케스트레이션)
POST   /api/inference/execute
GET    /api/inference/status/:id
GET    /api/inference/results/:id
GET    /api/inference/history

// 리포트
POST   /api/reports/generate
GET    /api/reports/:id/download
```

#### FastAPI

```python
# AI 추론
POST   /api/v1/inference
GET    /api/v1/inference/:id/progress
WS     /ws/inference/:id  # WebSocket

# 모델 학습
POST   /api/v1/training/start
GET    /api/v1/training/:id/status
GET    /api/v1/training/:id/metrics
POST   /api/v1/training/:id/stop

# 모델 관리
GET    /api/v1/models
POST   /api/v1/models/deploy
GET    /api/v1/models/:id

# 이미지 합성
POST   /api/v1/images/synthesis
GET    /api/v1/images/synthesis/:id/status

# 이미지 검색
POST   /api/v1/images/search
POST   /api/v1/images/index

# Health Check
GET    /api/v1/health
```

---

## 9. UI/UX 설계

### 9.1 Palantir 디자인 시스템

```typescript
// 색상 팔레트
const colors = {
  background: {
    primary: '#0F1117',
    secondary: '#1E2130',
    elevated: 'rgba(30, 33, 48, 0.95)',
  },
  accent: {
    primary: '#00E3AE',
    secondary: '#00b894',
    gradient: 'linear-gradient(135deg, #00E3AE, #00b894)',
  },
  text: {
    primary: '#E1E5E9',
    secondary: '#9BA1A8',
    muted: '#6C7178',
  },
  status: {
    success: '#00E676',
    warning: '#FFB300',
    error: '#FF5252',
    info: '#00D9FF',
  },
  border: '#2C3038',
};

// 아이콘 스타일
const icons = {
  style: '기하학적 (Geometric)',
  stroke: '2px',
  size: {
    sm: '16px',
    md: '20px',
    lg: '24px',
  }
};
```

### 9.2 레이아웃 구조

```
┌─────────────────────────────────────────────────────┐
│  Header (고정)                                      │
│  - Logo                                             │
│  - 사용자 정보                                       │
│  - 알림                                             │
└─────────────────────────────────────────────────────┘
┌──────┬──────────────────────────────────────────────┐
│      │                                              │
│ Side │  Main Content                                │
│ bar  │                                              │
│      │  - Breadcrumb                                │
│ (펼 │  - Page Title                                │
│ 침/  │  - Content Area                              │
│ 접기)│                                              │
│      │                                              │
│      │                                              │
└──────┴──────────────────────────────────────────────┘
```

### 9.3 주요 컴포넌트

```typescript
// 메트릭 카드
<MetricCard 
  icon="◈"
  title="총 검사 수"
  value={1000}
  change="+5.2%"
  trend="up"
/>

// 상태 배지
<StatusBadge status="OK" />  // 초록
<StatusBadge status="NG" />  // 빨강
<StatusBadge status="UNK" /> // 회색

// 진행 바
<ProgressBar 
  current={50}
  total={100}
  label="AI 추론 진행 중..."
/>

// 이미지 그리드
<ImageGrid 
  images={[...]}
  onSelect={handleSelect}
  columns={4}
/>
```

---

## 10. 배포 전략

### 10.1 Docker Compose

```yaml
version: '3.8'

services:
  nextjs:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - AI_API_URL=http://fastapi:8000
    depends_on:
      - postgres
      - redis

  fastapi:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    depends_on:
      - postgres

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - nextjs
      - fastapi

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  qdrant:
    image: qdrant/qdrant:v1.7.4
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  postgres_data:
  redis_data:
  minio_data:
  qdrant_data:
```

### 10.2 사이트별 배포

```yaml
AITECH (파일럿):
  - Week 2: 기본 프레임
  - Week 4: 이미지 합성
  - Week 6: 이미지 검색
  - Week 8: 모델 학습
  - Week 12: AI 추론 (신규 장비)

DME:
  - Week 6: 이미지 합성, 검색
  - Week 14: AI 추론 (신규 장비)

FNH:
  - Week 8: 독립 모듈 전체
  - Week 14: AI 추론 (신규 장비)

F95:
  - Week 8: 독립 모듈 전체
  - Week 14: AI 추론 (신규 장비)
```

---

## 11. 외주 협업 계획

### 11.1 역할 분담

```yaml
SmartCore (외주):
  담당:
    - Next.js Frontend 개발
    - Next.js API Routes (CRUD)
    - UI 컴포넌트
    - Palantir 스타일 적용
  
  기술:
    - TypeScript
    - React
    - Tailwind CSS
  
  작업량: 70% (코드 라인 수 기준)

당신 (AI):
  담당:
    - FastAPI 개발
    - AI 추론 엔진
    - 모델 학습
    - GAN, 벡터 검색
    - MLflow 연동
  
  기술:
    - Python
    - PyTorch
    - CUDA
  
  작업량: 30% (코드 라인 수 기준, 하지만 복잡도 80%)
```

### 11.2 커뮤니케이션

```yaml
정기 미팅:
  - 매주 2회 (화/금)
  - 30-60분
  - 진행 상황 공유
  - 블로커 해결

API 명세:
  - Week 1-2에 전체 명세 확정
  - Swagger 문서 공유
  - Mock 데이터로 병렬 작업

협업 도구:
  - Slack: 일상 소통
  - GitHub: 코드 리뷰
  - Notion: 문서 공유
  - Figma: 디자인 공유
```

---

## 12. 리스크 관리

### 12.1 레거시 통합 리스크 (🔴 높음)

```yaml
리스크:
  - 데이터 정의서 불완전
  - 파일 형식 불명확
  - 히스토리 데이터 품질

대응:
  - 3개월 내 통합 포기
  - 추가 3개월 확보
  - 현장 담당자 인터뷰
  - 샘플 파일 수집
```

### 12.2 신규 장비 통합 리스크 (🟡 중간)

```yaml
리스크:
  - DB 스키마 변경 제약
  - 성능 이슈

대응:
  - 읽기 전용 접근
  - 뷰(View) 활용
  - 인덱스 최적화
  - Redis 캐싱
```

### 12.3 독립 모듈 리스크 (🟢 낮음)

```yaml
리스크:
  - 거의 없음

이유:
  - 양산 시스템 독립
  - 롤백 쉬움
```

---

## 13. 향후 확장 계획 (추가 3개월)

### 13.1 레거시 장비 통합 (Week 15-24)

```yaml
Week 15-16: 데이터 정의서 완성
Week 17-18: 파일 파서 개발
Week 19-20: DB 마이그레이션
Week 21-22: 어댑터 개발
Week 23-24: 통합 완료 🎊
```

### 13.2 추가 기능

```yaml
제품 정보 관리:
  - 고객사 CRUD
  - 제품 CRUD
  - 불량 유형 관리

AI 판정 기준 관리:
  - Spec CRUD
  - 복잡한 조건 설정

시스템 관리:
  - 사용자 관리
  - 권한 관리
  - 시스템 모니터링
```

### 13.3 Kubernetes 마이그레이션 (Next Project)

```yaml
목표: Docker → Kubernetes

작업:
  - Helm Charts 작성
  - Kubernetes 매니페스트
  - Kubeflow 연동
  - MLOps 파이프라인 자동화
```

---

## 부록

### A. 프로젝트 구조

```
simmtech-pcb-inspection-ai/
├── docker-compose.yml
├── docker-compose.prod.yml
│
├── frontend/                    # Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── image-synthesis/
│   │   │   │   ├── image-search/
│   │   │   │   ├── training/
│   │   │   │   ├── inference/
│   │   │   │   └── results/
│   │   │   ├── api/
│   │   │   │   ├── auth/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── inference/
│   │   │   │   └── reports/
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui
│   │   │   ├── layout/
│   │   │   ├── dashboard/
│   │   │   └── inference/
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   ├── stores/              # Zustand
│   │   └── types/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── inference.py
│   │   │       ├── training.py
│   │   │       ├── models.py
│   │   │       ├── images.py
│   │   │       └── health.py
│   │   ├── core/
│   │   │   ├── ai_engine.py
│   │   │   ├── gan_engine.py
│   │   │   ├── vector_search.py
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/              # SQLAlchemy
│   │   ├── schemas/             # Pydantic
│   │   └── main.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
│
├── nginx/
│   ├── nginx.conf
│   └── Dockerfile
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
│
└── README.md
```

### B. 환경 변수

```bash
# .env.example

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/pcb_inspection
POSTGRES_PASSWORD=yourpassword

# Redis
REDIS_URL=redis://redis:6379

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# FastAPI
AI_API_URL=http://fastapi:8000

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000

# Qdrant
QDRANT_URL=http://qdrant:6333
```

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0 | 2025-01-07 | 초안 작성 |

---

**문서 작성자**: AI 컨설턴트  
**승인자**: 프로젝트 매니저  
**최종 검토일**: 2025-01-07
