# 프로젝트 구조 상세 설명

## 전체 디렉토리 구조

```
simmtech-pcb-inspection-ai-edge-mlops/
│
├── frontend/                           # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/                       # Next.js 14 App Router
│   │   │   ├── api/                   # Next.js API Routes (서버 사이드)
│   │   │   │   ├── auth/              # 인증/인가 (NextAuth.js)
│   │   │   │   │   └── [...nextauth]/
│   │   │   │   │       └── route.ts   # NextAuth 설정
│   │   │   │   │
│   │   │   │   ├── customers/         # 고객사 관리
│   │   │   │   │   ├── route.ts       # GET, POST
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── route.ts   # PUT, DELETE
│   │   │   │   │
│   │   │   │   ├── products/          # 제품 관리
│   │   │   │   ├── specs/             # AI 판정 Spec 관리
│   │   │   │   ├── dashboard/         # 대시보드 API
│   │   │   │   │   ├── metrics/       # 메트릭 조회
│   │   │   │   │   └── stats/         # 통계 조회
│   │   │   │   │
│   │   │   │   ├── inference/         # AI 추론 오케스트레이션
│   │   │   │   │   ├── execute/
│   │   │   │   │   │   └── route.ts   # POST → FastAPI 호출
│   │   │   │   │   ├── status/
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── route.ts # GET (DB 조회)
│   │   │   │   │   └── results/
│   │   │   │   │
│   │   │   │   ├── datasets/          # 데이터셋 메타데이터
│   │   │   │   ├── images/            # 이미지 업로드/조회 (MinIO)
│   │   │   │   ├── reports/           # 리포트 생성
│   │   │   │   ├── health/            # Health Check
│   │   │   │   ├── users/             # 사용자 관리
│   │   │   │   └── settings/          # 설정 관리
│   │   │   │
│   │   │   ├── (pages)/              # 페이지 라우트
│   │   │   │   ├── dashboard/         # 대시보드 페이지
│   │   │   │   ├── customers/         # 고객사 관리 페이지
│   │   │   │   ├── products/          # 제품 관리 페이지
│   │   │   │   ├── inference/         # 추론 관리 페이지
│   │   │   │   └── training/          # 학습 관리 페이지
│   │   │   │
│   │   │   └── layout.tsx             # 루트 레이아웃
│   │   │
│   │   ├── components/                # React 컴포넌트
│   │   │   ├── ui/                    # 기본 UI 컴포넌트
│   │   │   ├── forms/                 # 폼 컴포넌트
│   │   │   ├── charts/                # 차트 컴포넌트
│   │   │   └── layouts/               # 레이아웃 컴포넌트
│   │   │
│   │   ├── lib/                       # 유틸리티 라이브러리
│   │   │   ├── prisma.ts              # Prisma Client 싱글톤
│   │   │   ├── ai-client.ts           # FastAPI 클라이언트
│   │   │   ├── auth.ts                # NextAuth 설정
│   │   │   └── utils.ts               # 공통 유틸리티
│   │   │
│   │   ├── types/                     # TypeScript 타입 정의
│   │   │   ├── api.ts                 # API 응답 타입
│   │   │   ├── models.ts              # 데이터 모델 타입
│   │   │   └── index.ts               # 타입 export
│   │   │
│   │   ├── hooks/                     # React Hooks
│   │   │   ├── useCustomers.ts        # 고객사 관련 hooks
│   │   │   ├── useInference.ts        # 추론 관련 hooks
│   │   │   └── useAuth.ts             # 인증 관련 hooks
│   │   │
│   │   └── styles/                    # 스타일
│   │       └── globals.css            # 전역 스타일
│   │
│   ├── prisma/
│   │   ├── schema.prisma              # Prisma 스키마 정의
│   │   └── migrations/                # DB 마이그레이션
│   │
│   ├── public/                        # 정적 파일
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── .env.example                   # 환경 변수 템플릿
│   ├── package.json                   # 프로젝트 의존성
│   ├── tsconfig.json                  # TypeScript 설정
│   ├── next.config.js                 # Next.js 설정
│   ├── tailwind.config.js             # Tailwind CSS 설정
│   └── Dockerfile                     # Docker 이미지 빌드
│
├── backend/                           # FastAPI 백엔드 (AI/ML 전용)
│   ├── app/
│   │   ├── main.py                    # FastAPI 앱 엔트리포인트
│   │   │
│   │   ├── api/
│   │   │   └── v1/                    # API v1
│   │   │       ├── __init__.py
│   │   │       ├── inference.py       # AI 추론 실행
│   │   │       ├── training.py        # AI 학습
│   │   │       ├── models.py          # 모델 관리
│   │   │       ├── images.py          # 이미지 처리 (GAN, 검색)
│   │   │       └── datasets.py        # 데이터셋 처리
│   │   │
│   │   ├── core/                      # 핵심 설정
│   │   │   ├── config.py              # 설정 관리
│   │   │   ├── security.py            # JWT 인증
│   │   │   ├── ai_engine.py           # AI 엔진 (추론)
│   │   │   ├── gan_engine.py          # GAN 엔진 (합성)
│   │   │   └── training_engine.py     # 학습 엔진
│   │   │
│   │   ├── models/                    # AI 모델
│   │   │   ├── detector.py            # 불량 검출 모델
│   │   │   ├── gan.py                 # GAN 모델
│   │   │   └── embeddings.py          # 이미지 임베딩
│   │   │
│   │   ├── services/                  # 비즈니스 로직
│   │   │   ├── minio_service.py       # MinIO 연동
│   │   │   ├── mlflow_service.py      # MLflow 연동
│   │   │   └── db_service.py          # DB 연동
│   │   │
│   │   └── utils/                     # 유틸리티
│   │       ├── preprocessing.py       # 이미지 전처리
│   │       ├── postprocessing.py      # 후처리
│   │       └── metrics.py             # 메트릭 계산
│   │
│   ├── tests/                         # 테스트
│   │   ├── test_inference.py
│   │   ├── test_training.py
│   │   └── test_models.py
│   │
│   ├── models/                        # 학습된 모델 저장
│   │   └── .gitkeep
│   │
│   ├── mlflow/                        # MLflow 아티팩트
│   │   └── .gitkeep
│   │
│   ├── .env.example                   # 환경 변수 템플릿
│   ├── requirements.txt               # Python 의존성
│   └── Dockerfile                     # Docker 이미지 빌드
│
├── infrastructure/                    # 인프라 설정
│   ├── docker/                        # Docker 설정
│   │   ├── postgres/
│   │   │   └── init.sql               # DB 초기화 스크립트
│   │   └── nginx/
│   │       └── nginx.conf             # Nginx 설정
│   │
│   ├── nginx/                         # Nginx 리버스 프록시
│   │   └── default.conf
│   │
│   ├── minio/                         # MinIO 설정
│   │   └── config.json
│   │
│   └── scripts/                       # 유틸리티 스크립트
│       ├── setup.sh                   # 초기 설정 스크립트
│       ├── backup.sh                  # 백업 스크립트
│       └── deploy.sh                  # 배포 스크립트
│
├── shared/                            # 공유 모듈
│   └── types/                         # 공유 타입 정의
│       └── common.ts
│
├── docs/                              # 문서
│   ├── api/                           # API 문서
│   ├── architecture/                  # 아키텍처 문서
│   └── guides/                        # 가이드
│
├── .gitignore                         # Git 제외 파일
├── docker-compose.yml                 # Docker Compose 설정
├── README.md                          # 프로젝트 소개
├── SETUP_GUIDE.md                     # 설치 가이드
├── PROJECT_STRUCTURE.md               # 이 파일
└── API_ROLE_SEPARATION_FIXED.md       # API 역할 분담 명세서
```

## 주요 디렉토리 설명

### Frontend (Next.js)

#### `/frontend/src/app/api`
- **역할**: Next.js API Routes - 비즈니스 로직 및 데이터 CRUD
- **특징**:
  - Prisma ORM으로 PostgreSQL 직접 접근
  - NextAuth.js로 인증/인가
  - FastAPI 오케스트레이션 (AI 작업 위임)
  - RESTful API 엔드포인트

#### `/frontend/src/components`
- **역할**: React 컴포넌트
- **구성**:
  - `ui/`: 버튼, 입력, 모달 등 기본 UI
  - `forms/`: 폼 컴포넌트
  - `charts/`: 차트 및 시각화
  - `layouts/`: 페이지 레이아웃

#### `/frontend/src/lib`
- **역할**: 핵심 라이브러리
- **주요 파일**:
  - `prisma.ts`: Prisma Client 싱글톤
  - `ai-client.ts`: FastAPI 통신 클라이언트
  - `auth.ts`: NextAuth 설정

### Backend (FastAPI)

#### `/backend/app/api/v1`
- **역할**: FastAPI 라우터 - AI/ML 전용
- **구성**:
  - `inference.py`: GPU 기반 AI 추론
  - `training.py`: 모델 학습
  - `models.py`: MLflow 연동 모델 관리
  - `images.py`: GAN 합성, 벡터 검색
  - `datasets.py`: 학습 데이터 처리

#### `/backend/app/core`
- **역할**: 핵심 AI 엔진
- **구성**:
  - `ai_engine.py`: 추론 엔진
  - `gan_engine.py`: 이미지 합성
  - `training_engine.py`: 학습 파이프라인

#### `/backend/app/models`
- **역할**: AI 모델 정의
- **구성**:
  - PyTorch 모델 클래스
  - ONNX 변환 유틸리티

### Infrastructure

#### `/infrastructure/docker`
- **역할**: Docker 설정 및 초기화
- **구성**:
  - PostgreSQL 초기화 SQL
  - Nginx 설정

#### `/infrastructure/scripts`
- **역할**: 자동화 스크립트
- **구성**:
  - 배포 스크립트
  - 백업 스크립트

## 데이터 흐름

### 1. 사용자 인증

```
Browser → Next.js API /api/auth → NextAuth.js → PostgreSQL
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
    2. axios → FastAPI /api/v1/inference
        ↓
        - MinIO (이미지 로드)
        - GPU (AI 추론)
        - PostgreSQL (결과 저장)
    ↓
    3. 응답 반환
```

### 4. AI 모델 학습

```
Browser → Next.js API /api/training/start
    ↓
    1. Prisma → PostgreSQL (학습 작업 생성)
    ↓
    2. axios → FastAPI /api/v1/training/start
        ↓
        - MinIO (데이터셋 로드)
        - GPU (모델 학습)
        - MLflow (메트릭 기록)
        - PostgreSQL (상태 업데이트)
```

## 기술 스택 요약

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Prisma ORM
- NextAuth.js
- Tailwind CSS
- React Query

### Backend
- FastAPI
- PyTorch
- ONNX Runtime
- MLflow
- OpenCV
- FAISS

### Infrastructure
- PostgreSQL 16
- MinIO (S3 호환)
- Docker & Docker Compose
- Nginx

## 환경별 설정

### 개발 (Development)
- 프론트엔드: http://localhost:3000
- 백엔드: http://localhost:8000
- 데이터베이스: localhost:5432
- MinIO: localhost:9000

### 프로덕션 (Production)
- Nginx 리버스 프록시
- HTTPS 적용
- 환경 변수 분리
- GPU 최적화

## 다음 단계

1. [SETUP_GUIDE.md](SETUP_GUIDE.md) - 설치 및 실행
2. [API_ROLE_SEPARATION_FIXED.md](API_ROLE_SEPARATION_FIXED.md) - API 역할 이해
3. API 문서 확인
