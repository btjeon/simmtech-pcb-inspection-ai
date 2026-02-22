# PCB Inspection AI - Edge System v2.0

통합 지향 PCB 검사 AI 시스템입니다.

## 프로젝트 개요

이 프로젝트는 **Next.js**와 **FastAPI**를 명확하게 역할 분담하여 구성된 PCB 검사 AI 시스템입니다.

### 아키텍처 원칙

- **Next.js**: 비즈니스 로직, 데이터 CRUD, 사용자 인증, AI 작업 오케스트레이션
- **FastAPI**: AI/ML 전용 (추론, 학습, 이미지 처리, GPU 작업)

자세한 역할 분담은 [API_ROLE_SEPARATION_FIXED.md](API_ROLE_SEPARATION_FIXED.md)를 참조

## 프로젝트 구조

```
simmtech-pcb-inspection-ai/
├── services/
│   ├── frontend/                    # Next.js 프론트엔드 (활성)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/            # Next.js API Routes
│   │   │   │   │   ├── auth/       # 인증/인가 (NextAuth.js)
│   │   │   │   │   ├── customers/  # 고객 관리 CRUD
│   │   │   │   │   └── inference/  # 추론 오케스트레이션
│   │   │   │   └── (dashboard)/   # 대시보드 페이지들
│   │   │   ├── components/         # React 컴포넌트
│   │   │   ├── lib/               # 유틸리티
│   │   │   └── types/             # TypeScript 타입
│   │   ├── prisma/
│   │   │   └── schema.prisma      # 데이터베이스 스키마
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── backend-core/               # FastAPI 백엔드 AI/ML 전용 (활성)
│       ├── app/
│       │   ├── api/v1/
│       │   │   ├── inference.py   # AI 추론 실행
│       │   │   ├── training.py    # AI 학습
│       │   │   ├── models.py      # 모델 관리
│       │   │   ├── images.py      # 이미지 처리 (GAN, 검색)
│       │   │   ├── datasets.py    # 데이터셋 처리
│       │   │   ├── extraction.py  # 불량 추출
│       │   │   ├── slicer.py      # 이미지 슬라이서
│       │   │   ├── rca.py         # RCA 분석
│       │   │   └── customer_spec/ # 고객 스펙 관리
│       │   ├── core/              # 핵심 설정
│       │   ├── extractors/        # 추출기 모듈
│       │   ├── models/            # AI 모델
│       │   └── services/          # 비즈니스 로직
│       ├── requirements.txt
│       └── Dockerfile
│
├── infrastructure/                  # 인프라 설정
│   ├── observability/             # Prometheus, Grafana
│   └── postgres/                  # DB 초기화 스크립트
│
├── docs/                            # 문서
│   ├── GPU_ALLOCATION.md
│   ├── PORT_MAPPING.md
│   └── services/
│
├── docker-compose.infra.yml        # 인프라 서비스 (권장)
├── docker-compose.services.yml     # 앱 서비스 (Docker 배포용)
├── docker-compose.yml              # 전체 통합 (단일 파일 배포용)
└── QUICK_START.md                  # 빠른 시작 가이드
```

## 시작하기

### 필수 요구사항

- **Node.js** 20+
- **Python** 3.10+
- **Docker** & **Docker Compose**
- **NVIDIA GPU** (선택, AI 학습/추론용)
- **PostgreSQL** 15+

### 빠른 시작 (권장)

자세한 내용은 [QUICK_START.md](QUICK_START.md) 참조

```bash
# 1. 인프라 시작
docker-compose -f docker-compose.infra.yml up -d

# 2. 프론트엔드 실행
cd services/frontend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
# → http://localhost:3000

# 3. 백엔드 실행 (새 터미널)
cd services/backend-core
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000/docs
```

### Docker Compose로 전체 시스템 실행

```bash
# 루트 디렉토리에서
docker-compose up -d
```

이 명령어로 다음 서비스가 실행됩니다:
- PostgreSQL (포트 5432)
- MinIO (포트 9000, 9001)
- MLflow (포트 5000)
- Next.js Frontend (포트 3000)
- FastAPI Backend (포트 8000)

## 서비스 포트

| 서비스        | URL                        | 용도              |
|--------------|----------------------------|-------------------|
| Frontend     | http://localhost:3000      | 메인 UI           |
| Backend API  | http://localhost:8000/docs | API 문서          |
| MinIO Console| http://localhost:9001      | 파일 스토리지     |
| MLflow       | http://localhost:5000      | ML 실험 추적      |
| Grafana      | http://localhost:3001      | 모니터링          |
| Prometheus   | http://localhost:9090      | 메트릭 수집       |

## 데이터베이스

### Prisma 마이그레이션

```bash
cd services/frontend

# 마이그레이션 생성
npx prisma migrate dev --name init

# Prisma Studio 실행 (DB GUI)
npx prisma studio
```

## 주요 기능

### Next.js API Routes (포트 3000)

- **인증/인가**: NextAuth.js 기반
- **고객 관리**: CRUD 작업
- **제품 관리**: CRUD 작업
- **AI Spec 관리**: 판정 기준 설정
- **대시보드**: 메트릭 및 통계
- **추론 오케스트레이션**: FastAPI 호출 관리
- **리포트**: PDF/Excel 생성

### FastAPI (포트 8000)

- **AI 추론**: GPU 기반 실시간 추론
- **AI 학습**: 모델 학습 및 재학습
- **모델 관리**: MLflow 연동
- **이미지 처리**: GAN 합성, 벡터 검색
- **데이터셋 관리**: 학습 데이터 처리
- **RCA 분석**: 불량 원인 분석
- **이미지 슬라이서**: 대형 이미지 분할 처리

## 기술 스택

### Frontend
- **Next.js 14**: React 프레임워크
- **Prisma**: ORM
- **NextAuth.js**: 인증
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링

### Backend
- **FastAPI**: 웹 프레임워크
- **PyTorch**: AI/ML 프레임워크
- **MLflow**: 모델 관리
- **ONNX Runtime**: 모델 추론 최적화
- **OpenCV**: 이미지 처리

### Infrastructure
- **PostgreSQL**: 주 데이터베이스
- **MinIO**: 객체 스토리지 (S3 호환)
- **Redis**: 캐시/메시지 큐
- **Qdrant**: 벡터 데이터베이스
- **Docker**: 컨테이너화
- **Prometheus + Grafana**: 모니터링

## 보안

- JWT 기반 인증 (NextAuth.js)
- 환경 변수로 민감 정보 관리
- CORS 설정
- SQL Injection 방지 (Prisma ORM)

## 라이센스

이 프로젝트는 내부용입니다.

---

**프로젝트 버전**: 2.0.0
**최종 업데이트**: 2026-02-22
