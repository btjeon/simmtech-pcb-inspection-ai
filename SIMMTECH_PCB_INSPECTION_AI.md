# SIMMTECH PCB Inspection AI System
## 시스템 소개 및 구성 문서

**Version:** 1.0
**작성일:** 2026-03-22
**작성:** SIMMTECH

---

## 1. 시스템 개요

SIMMTECH PCB Inspection AI는 인쇄회로기판(PCB) 외관 검사를 위한 AI 기반 통합 플랫폼입니다.
GPU 가속 딥러닝 모델을 활용하여 PCB 결함을 자동 탐지하고, 원인 분석(RCA) 및 시스템 이상 분석(TAS)을 수행합니다.

### 주요 목적
- PCB 결함 자동 탐지 및 분류
- AI 모델 학습 데이터 생성 및 관리
- 불량 원인 분석(Root Cause Analysis)
- 시스템 이상 발생 분석 및 보고서 생성

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                   사용자 (Browser)                   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│              Frontend (Next.js 14)                   │
│              http://localhost:3001                   │
│  - TypeScript / React                                │
│  - Tailwind CSS                                      │
│  - NextAuth.js (인증)                                │
└─────────────────────┬───────────────────────────────┘
                      │ API Proxy (서버 사이드)
┌─────────────────────▼───────────────────────────────┐
│              Backend (FastAPI)                       │
│              http://localhost:8000                   │
│  - Python / FastAPI                                  │
│  - PyTorch / YOLO / OpenCV                          │
│  - OpenAI GPT-4o (RCA)                              │
└──────┬──────────────┬──────────────┬────────────────┘
       │              │              │
┌──────▼─────┐ ┌──────▼─────┐ ┌────▼───────┐
│ PostgreSQL │ │   MinIO    │ │  SQLite    │
│ (메인 DB)  │ │ (이미지 저장) │ │ (TAS 분석) │
└────────────┘ └────────────┘ └────────────┘
                      │
              ┌───────▼──────┐
              │    MLflow    │
              │ (모델 관리)   │
              └──────────────┘
```

---

## 3. 기술 스택

### Backend
| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | FastAPI | ≥ 0.109.0 |
| 언어 | Python | 3.10+ |
| AI/ML | PyTorch, YOLO | ≥ 2.0.0 |
| 이미지 처리 | OpenCV, Pillow | ≥ 4.9.0 |
| 데이터베이스 | PostgreSQL | - |
| ORM | SQLAlchemy | ≥ 2.0.0 |
| 스토리지 | MinIO (S3 호환) | - |
| ML 추적 | MLflow | ≥ 2.10.0 |
| 외부 AI API | OpenAI GPT-4o | - |
| 인증 | JWT (python-jose) | - |

### Frontend
| 항목 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 14+ |
| 언어 | TypeScript | - |
| 스타일 | Tailwind CSS | - |
| 인증 | NextAuth.js | - |
| 차트 | Recharts | - |

---

## 4. 디렉토리 구조

```
simmtech_pcb_inspection_ai/
├── services/
│   ├── backend-core/               # FastAPI 백엔드
│   │   ├── app/
│   │   │   ├── main.py             # 애플리케이션 진입점
│   │   │   ├── core/
│   │   │   │   └── config.py       # 설정 관리
│   │   │   ├── api/
│   │   │   │   └── v1/             # API 라우터
│   │   │   │       ├── inference.py        # AI 추론
│   │   │   │       ├── training.py         # 모델 학습
│   │   │   │       ├── extraction.py       # 결함 추출
│   │   │   │       ├── slicer.py           # 이미지 슬라이싱
│   │   │   │       ├── rca.py              # RCA 분석
│   │   │   │       ├── images.py           # 이미지 관리
│   │   │   │       ├── datasets.py         # 데이터셋 관리
│   │   │   │       ├── models.py           # 모델 관리
│   │   │   │       ├── customer_spec/      # 고객 사양 관리
│   │   │   │       └── tas/                # 시스템 이상 분석
│   │   │   ├── database/
│   │   │   │   ├── connection.py           # DB 연결
│   │   │   │   └── schema.py               # 테이블 스키마
│   │   │   ├── extractors/                 # 결함 추출 엔진
│   │   │   │   ├── yolo_extractor.py
│   │   │   │   ├── box_auto_extractor.py
│   │   │   │   ├── polygon_extractor.py
│   │   │   │   └── mask_post_processor.py
│   │   │   └── services/
│   │   │       └── rca_service.py          # RCA 서비스 (GPT-4o)
│   │   ├── requirements.txt
│   │   └── .env
│   │
│   └── frontend/                   # Next.js 프론트엔드
│       └── src/app/
│           ├── (auth)/             # 인증
│           │   └── login/
│           ├── (dashboard)/        # 대시보드 페이지
│           │   ├── dashboard/
│           │   ├── analysis/
│           │   ├── rca/
│           │   ├── training/
│           │   ├── inference/
│           │   ├── products/
│           │   ├── specs/
│           │   ├── customer-spec/
│           │   ├── system/
│           │   └── system-anomaly/
│           └── api/                # Next.js API 프록시
│               ├── auth/
│               └── slicer/
├── infrastructure/
│   ├── postgres/                   # DB 초기화 스크립트
│   └── observability/              # Prometheus 설정
├── docs/                           # 문서
├── docker-compose.yml
└── docker-compose.services.yml
```

---

## 5. 주요 기능 모듈

### 5.1 AI 추론 (Inference)
- GPU 기반 PCB 결함 탐지
- YOLO 모델 기반 실시간 추론
- 결함 위치 및 분류 결과 반환
- **API:** `POST /api/v1/inference/execute`

### 5.2 결함 추출 (Defect Extraction)
- 다양한 추출 방식 지원: YOLO, 박스 자동 추출, 다각형 추출
- 마스크(Mask) 후처리
- 학습용 어노테이션 데이터 생성
- **API:** `POST /api/v1/extraction/...`
- **Frontend:** `/training/extraction`

### 5.3 이미지 슬라이서 (Image Slicer)
- 대용량 PCB 이미지를 AI 학습에 적합한 크기로 분할
- 슬라이스 크기 및 오버랩 비율 설정
- 병렬 처리로 빠른 분할 속도
- **API:** `POST /api/v1/slicer/upload-image`, `POST /api/v1/slicer/process`
- **Frontend:** `/training/slicer`

### 5.4 RCA - 불량 원인 분석 (Root Cause Analysis)
- OpenAI GPT-4o Vision API 기반 이미지 진단
- PCB 결함 이미지 업로드 → AI 분석 → 원인 보고서 생성
- RCA 이력 조회 및 관리
- **API:** `POST /api/v1/rca/...`
- **Frontend:** `/rca/image-diagnosis`, `/rca/history`

### 5.5 TAS - 시스템 이상 분석 (System Anomaly Analysis)
- 시스템 이상 발생 데이터 관리
- PPT/PDF 보고서 자동 생성
- SQLite 기반 경량 데이터 저장
- **API:** `POST /api/v1/tas/...`
- **Frontend:** `/system-anomaly`

### 5.6 고객 사양 관리 (Customer Spec)
- 고객별 PCB 검사 기준 관리
- 측정 파라미터 설정
- AI 판정 기준 설정
- **API:** `POST /api/v1/customer-spec/...`
- **Frontend:** `/customer-spec`, `/specs/*`

### 5.7 모델 학습 관리 (Model Training)
- 학습 데이터셋 관리
- 자동 라벨링
- 데이터 검증 및 합성
- MLflow 연동 실험 추적
- **Frontend:** `/training/*`

---

## 6. API 엔드포인트 목록

| 태그 | 기본 경로 | 설명 |
|------|----------|------|
| AI Inference | `/api/v1/` | AI 추론 실행 |
| AI Training | `/api/v1/` | 모델 학습 관리 |
| Model Management | `/api/v1/` | AI 모델 관리 |
| Image Processing | `/api/v1/` | 이미지 처리 |
| Dataset Management | `/api/v1/` | 데이터셋 관리 |
| Defect Extraction | `/api/v1/` | 결함 추출 |
| Customer Spec | `/api/v1/customer-spec/` | 고객 사양 관리 |
| Image Slicer | `/api/v1/slicer/` | 이미지 슬라이싱 |
| RCA Analysis | `/api/v1/rca/` | RCA 분석 |
| TAS | `/api/v1/tas/` | 시스템 이상 분석 |

> Swagger UI: `http://localhost:8000/docs`

---

## 7. 프론트엔드 페이지 목록

| 경로 | 기능 |
|------|------|
| `/dashboard` | 메인 대시보드 |
| `/analysis/detail` | 상세 분석 |
| `/analysis/metrics` | 분석 메트릭 |
| `/analysis/status` | 분석 상태 |
| `/rca/image-diagnosis` | 이미지 기반 RCA 진단 |
| `/rca/history` | RCA 이력 조회 |
| `/inference/execute` | AI 추론 실행 |
| `/training/dataset` | 데이터셋 관리 |
| `/training/slicer` | 이미지 슬라이서 |
| `/training/extraction` | 불량 이미지 추출 |
| `/training/auto-labeling` | 자동 라벨링 |
| `/training/data-validation` | 학습 데이터 검증 |
| `/training/synthesis` | 데이터 합성 |
| `/training/model-training` | 모델 학습 실행 |
| `/training/search` | 이미지 검색 |
| `/products/info` | 제품 정보 관리 |
| `/products/customers` | 고객 정보 관리 |
| `/products/defect-class` | 결함 분류 관리 |
| `/products/defect-types` | 결함 타입 관리 |
| `/specs/management` | 검사 사양 관리 |
| `/specs/criteria-v2` | 검사 기준 v2 |
| `/specs/measurement-params` | 측정 파라미터 |
| `/customer-spec` | 고객 사양 |
| `/system/ai-server` | AI 서버 상태 |
| `/system/equipment` | 장비 환경 설정 |
| `/system/monitoring` | 시스템 모니터링 |
| `/system/settings` | 사용자 환경 설정 |
| `/system-anomaly` | 시스템 이상 분석 (TAS) |

---

## 8. 실행 방법

### 사전 요구사항
- Python 3.10+
- Node.js 18+
- (선택) PostgreSQL, MinIO, MLflow

### 백엔드 실행

```bash
cd services/backend-core

# 의존성 설치 (최초 1회)
pip install -r requirements.txt

# 서버 실행
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

> 실행 확인: http://localhost:8000/docs

### 프론트엔드 실행

```bash
cd services/frontend

# 의존성 설치 (최초 1회)
npm install

# 개발 서버 실행
npm run dev
```

> 실행 확인: http://localhost:3001

---

## 9. 환경 변수 설정

### 백엔드 (`services/backend-core/.env`)

```env
# PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/pcb_inspection

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=pcb-images

# MLflow
MLFLOW_TRACKING_URI=http://localhost:5000

# GPU
USE_GPU=true
GPU_DEVICE_ID=0

# OpenAI (RCA 기능)
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o

# JWT
SECRET_KEY=your-secret-key
```

### 프론트엔드 (`services/frontend/.env.local`)

```env
# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# 백엔드 API 주소 (서버 사이드)
AI_API_URL=http://localhost:8000

# 백엔드 API 주소 (클라이언트 사이드, 외부 접속 시)
NEXT_PUBLIC_AI_API_URL=http://192.168.x.x:8000
```

---

## 10. 데이터베이스 구성

| DB | 용도 | 기술 |
|----|------|------|
| PostgreSQL | 메인 데이터 (사양, 제품, 검사 결과) | SQLAlchemy ORM |
| MinIO | PCB 이미지 파일 저장 (S3 호환) | boto3 |
| SQLite | TAS 시스템 이상 분석 데이터 | sqlite3 |
| MLflow | AI 모델 실험 및 버전 관리 | MLflow |

---

## 11. 시스템 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend (Next.js) | 3001 | 웹 UI |
| Backend (FastAPI) | 8000 | REST API |
| PostgreSQL | 5432 | 메인 DB |
| MinIO API | 9000 | 스토리지 API |
| MinIO Console | 9001 | 스토리지 관리 UI |
| MLflow | 5000 | ML 실험 추적 UI |
| Prometheus | 9090 | 모니터링 |

---

## 12. 변경 이력

| 버전 | 날짜 | 내용 |
|------|------|------|
| v1.0 | 2026-03-22 | 최초 문서 작성 |

---

*본 문서는 SIMMTECH PCB Inspection AI 시스템 Ver 1.0 기준으로 작성되었습니다.*
