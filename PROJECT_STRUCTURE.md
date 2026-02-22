# 프로젝트 구조 상세 설명

## 전체 디렉토리 구조

```
simmtech-pcb-inspection-ai/
│
├── services/                              # 애플리케이션 서비스 (활성 코드)
│   │
│   ├── frontend/                          # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/                       # Next.js 14 App Router
│   │   │   │   ├── api/                   # Next.js API Routes (서버 사이드)
│   │   │   │   │   ├── auth/              # 인증/인가 (NextAuth.js)
│   │   │   │   │   │   └── [...nextauth]/
│   │   │   │   │   │       └── route.ts   # NextAuth 설정
│   │   │   │   │   ├── customers/         # 고객사 관리
│   │   │   │   │   │   └── route.ts       # GET, POST
│   │   │   │   │   └── inference/         # AI 추론 오케스트레이션
│   │   │   │   │       └── execute/
│   │   │   │   │           └── route.ts   # POST → FastAPI 호출
│   │   │   │   │
│   │   │   │   ├── (auth)/               # 인증 페이지
│   │   │   │   │   └── login/page.tsx
│   │   │   │   │
│   │   │   │   └── (dashboard)/          # 대시보드 페이지들
│   │   │   │       ├── dashboard/         # 메인 대시보드
│   │   │   │       ├── analysis/          # 검사 분석
│   │   │   │       │   ├── detail/
│   │   │   │       │   ├── metrics/
│   │   │   │       │   └── status/
│   │   │   │       ├── customer-spec/     # 고객 스펙 관리
│   │   │   │       ├── inference/         # 추론 실행
│   │   │   │       ├── products/          # 제품 관리
│   │   │   │       │   ├── customers/
│   │   │   │       │   ├── defect-class/
│   │   │   │       │   ├── defect-types/
│   │   │   │       │   └── info/
│   │   │   │       ├── rca/               # RCA 분석
│   │   │   │       │   ├── history/
│   │   │   │       │   └── image-diagnosis/
│   │   │   │       ├── specs/             # AI 판정 스펙
│   │   │   │       │   ├── criteria-v2/
│   │   │   │       │   ├── management/
│   │   │   │       │   └── measurement-params/
│   │   │   │       ├── system/            # 시스템 설정
│   │   │   │       │   ├── ai-server/
│   │   │   │       │   ├── equipment/
│   │   │   │       │   ├── monitoring/
│   │   │   │       │   └── settings/
│   │   │   │       └── training/          # AI 학습 관리
│   │   │   │           ├── auto-labeling/
│   │   │   │           ├── data-validation/
│   │   │   │           ├── dataset/
│   │   │   │           ├── extraction/
│   │   │   │           ├── model-training/
│   │   │   │           ├── search/
│   │   │   │           ├── slicer/
│   │   │   │           └── synthesis/
│   │   │   │
│   │   │   ├── components/                # React 컴포넌트
│   │   │   │   ├── canvas/
│   │   │   │   │   └── ImageCanvas.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── PageHeader.tsx
│   │   │   │   │   └── Sidebar.tsx
│   │   │   │   └── providers/
│   │   │   │       └── SessionProvider.tsx
│   │   │   │
│   │   │   ├── lib/                       # 유틸리티 라이브러리
│   │   │   │   ├── ai-client.ts           # FastAPI 클라이언트
│   │   │   │   ├── menu-items.ts          # 사이드바 메뉴 정의
│   │   │   │   ├── prisma.ts              # Prisma Client 싱글톤
│   │   │   │   └── api/
│   │   │   │       ├── customer-spec.ts
│   │   │   │       └── extraction.ts
│   │   │   │
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   │
│   │   ├── prisma/
│   │   │   └── schema.prisma              # Prisma 스키마 정의
│   │   │
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── Dockerfile
│   │
│   └── backend-core/                      # FastAPI 백엔드 (AI/ML 전용)
│       ├── app/
│       │   ├── main.py                    # FastAPI 앱 엔트리포인트
│       │   │
│       │   ├── api/
│       │   │   └── v1/
│       │   │       ├── inference.py       # AI 추론 실행
│       │   │       ├── training.py        # AI 학습
│       │   │       ├── models.py          # 모델 관리 (MLflow)
│       │   │       ├── images.py          # 이미지 처리 (GAN, 검색)
│       │   │       ├── datasets.py        # 데이터셋 처리
│       │   │       ├── extraction.py      # 불량 추출
│       │   │       ├── slicer.py          # 이미지 슬라이서
│       │   │       ├── rca.py             # RCA 분석
│       │   │       └── customer_spec/     # 고객 스펙 관리
│       │   │           ├── ai_judgment.py
│       │   │           ├── measurement_param.py
│       │   │           ├── spec_crud.py
│       │   │           ├── spec_json.py
│       │   │           └── spec_routes.py
│       │   │
│       │   ├── core/
│       │   │   └── config.py
│       │   │
│       │   ├── database/
│       │   │   ├── connection.py
│       │   │   └── schema.py
│       │   │
│       │   ├── extractors/                # 불량 추출기
│       │   │   ├── base_extractor.py
│       │   │   ├── box_auto_extractor.py
│       │   │   ├── mask_post_processor.py
│       │   │   ├── polygon_extractor.py
│       │   │   └── yolo_extractor.py
│       │   │
│       │   ├── models/                    # AI 모델 정의
│       │   │
│       │   ├── services/
│       │   │   └── rca_service.py
│       │   │
│       │   └── utils/
│       │
│       ├── tests/
│       ├── .env.example
│       ├── requirements.txt
│       └── Dockerfile
│
├── infrastructure/                        # 인프라 설정
│   ├── observability/
│   │   └── prometheus/
│   │       ├── prometheus.yml
│   │       └── alerts.yml
│   └── postgres/
│       └── init-scripts/
│           └── 01-init-databases.sql      # DB 초기화 (MLflow DB 생성)
│
├── docs/                                  # 문서
│   ├── GPU_ALLOCATION.md
│   ├── PORT_MAPPING.md
│   └── services/
│       └── auto_labeling_mockup.html
│
├── shared/                                # 공유 모듈 (향후 구현)
│   ├── python-common/
│   └── typescript-common/
│
├── .env.example
├── .gitignore
├── docker-compose.infra.yml               # 인프라 서비스 (권장 개발용)
├── docker-compose.services.yml            # 앱 서비스 (Docker 배포용)
├── docker-compose.yml                     # 전체 통합 (단일 파일 배포용)
├── start-dev.bat                          # Windows 개발 시작 스크립트
├── stop-all.bat                           # Windows 전체 중지 스크립트
├── QUICK_START.md                         # 빠른 시작 가이드
├── SETUP_GUIDE.md                         # 상세 설치 가이드
├── API_ROLE_SEPARATION_FIXED.md           # API 역할 분담 명세
└── README.md
```

## 주요 디렉토리 설명

### services/frontend (Next.js)

#### `src/app/api`
- **역할**: Next.js API Routes - 비즈니스 로직 및 데이터 CRUD
- **특징**:
  - Prisma ORM으로 PostgreSQL 직접 접근
  - NextAuth.js로 인증/인가
  - FastAPI 오케스트레이션 (AI 작업 위임)

#### `src/components`
- **역할**: React 컴포넌트
- **구성**:
  - `canvas/`: 이미지 캔버스 (불량 영역 오버레이 표시)
  - `layout/`: Header, Sidebar, PageHeader

#### `src/lib`
- **역할**: 핵심 라이브러리
- **주요 파일**:
  - `prisma.ts`: Prisma Client 싱글톤
  - `ai-client.ts`: FastAPI 통신 클라이언트
  - `menu-items.ts`: 사이드바 메뉴 구성

### services/backend-core (FastAPI)

#### `app/api/v1`
- **역할**: FastAPI 라우터 - AI/ML 전용
- **구성**:
  - `inference.py`: GPU 기반 AI 추론
  - `training.py`: 모델 학습
  - `models.py`: MLflow 연동 모델 관리
  - `images.py`: GAN 합성, 벡터 검색
  - `datasets.py`: 학습 데이터 처리
  - `extraction.py`: 불량 영역 추출
  - `slicer.py`: 대형 이미지 슬라이싱
  - `rca.py`: 불량 원인 분석 (RCA)
  - `customer_spec/`: 고객별 판정 스펙 관리

#### `app/extractors`
- **역할**: 불량 추출 엔진
- **구성**:
  - `yolo_extractor.py`: YOLO 기반 추출
  - `polygon_extractor.py`: 다각형 마스크 추출
  - `box_auto_extractor.py`: 자동 박스 추출
  - `mask_post_processor.py`: 마스크 후처리

## Docker Compose 파일 설명

| 파일 | 용도 | 포함 서비스 |
|------|------|------------|
| `docker-compose.infra.yml` | 인프라만 실행 (개발 권장) | PostgreSQL, Redis, MinIO, Qdrant, MLflow, Prometheus, Grafana, Jaeger |
| `docker-compose.services.yml` | 앱 서비스만 실행 | backend-core |
| `docker-compose.yml` | 전체 통합 (단일 파일) | 인프라 + frontend + backend |

## 데이터 흐름

### 1. 사용자 인증
```
Browser → Next.js /api/auth/[...nextauth] → NextAuth.js → JWT 발급
```

### 2. 고객사/제품 관리
```
Browser → Next.js API /api/customers → Prisma → PostgreSQL
```

### 3. AI 추론 실행
```
Browser → Next.js API /api/inference/execute
    ↓
    1. Prisma → PostgreSQL (요청 저장)
    ↓
    2. ai-client.ts → FastAPI /api/v1/inference
        ↓
        - MinIO (이미지 로드)
        - GPU (AI 추론)
        - PostgreSQL (결과 저장)
    ↓
    3. 응답 반환
```

### 4. RCA 분석
```
Browser → FastAPI /api/v1/rca
    ↓
    - GPT-4o Vision API 호출
    - 불량 원인 추론
    - 리포트 생성
```

## 기술 스택 요약

### Frontend (services/frontend)
- Next.js 14 (App Router)
- React 18
- TypeScript
- Prisma ORM
- NextAuth.js
- Tailwind CSS

### Backend (services/backend-core)
- FastAPI
- PyTorch
- ONNX Runtime
- MLflow
- OpenCV
- SQLAlchemy

### Infrastructure
- PostgreSQL 15
- MinIO (S3 호환)
- Redis 7
- Qdrant (벡터 DB)
- Docker & Docker Compose
- Prometheus + Grafana

## 다음 단계

1. [QUICK_START.md](QUICK_START.md) - 빠른 설치 및 실행
2. [SETUP_GUIDE.md](SETUP_GUIDE.md) - 상세 설치 가이드
3. [API_ROLE_SEPARATION_FIXED.md](API_ROLE_SEPARATION_FIXED.md) - API 역할 이해
4. [docs/PORT_MAPPING.md](docs/PORT_MAPPING.md) - 포트 매핑 확인
