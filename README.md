# PCB Inspection AI - Edge System v2.0

통합 지향 PCB 검사 AI 시스템입니다.

## 📋 프로젝트 개요

이 프로젝트는 **Next.js**와 **FastAPI**를 명확하게 역할 분담하여 구성된 PCB 검사 AI 시스템입니다.

### 아키텍처 원칙

- **Next.js**: 비즈니스 로직, 데이터 CRUD, 사용자 인증, AI 작업 오케스트레이션
- **FastAPI**: AI/ML 전용 (추론, 학습, 이미지 처리, GPU 작업)

자세한 역할 분담은 [API_ROLE_SEPARATION_FIXED.md](API_ROLE_SEPARATION_FIXED.md)를 참조하세요.

## 🏗️ 프로젝트 구조

```
simmtech-pcb-inspection-ai-edge-mlops/
├── frontend/                    # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/
│   │   │   └── api/            # Next.js API Routes
│   │   │       ├── auth/       # 인증/인가
│   │   │       ├── customers/  # 고객 관리 CRUD
│   │   │       ├── products/   # 제품 관리 CRUD
│   │   │       ├── specs/      # AI Spec 관리
│   │   │       ├── dashboard/  # 대시보드
│   │   │       ├── inference/  # 추론 오케스트레이션
│   │   │       ├── datasets/   # 데이터셋 관리
│   │   │       ├── images/     # 이미지 업로드/조회
│   │   │       └── reports/    # 리포트
│   │   ├── components/         # React 컴포넌트
│   │   ├── lib/               # 유틸리티
│   │   └── types/             # TypeScript 타입
│   ├── prisma/
│   │   └── schema.prisma      # 데이터베이스 스키마
│   ├── package.json
│   └── Dockerfile
│
├── backend/                     # FastAPI 백엔드 (AI/ML 전용)
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── inference.py   # AI 추론 실행
│   │   │   ├── training.py    # AI 학습
│   │   │   ├── models.py      # 모델 관리
│   │   │   ├── images.py      # 이미지 처리 (GAN, 검색)
│   │   │   └── datasets.py    # 데이터셋 처리
│   │   ├── core/              # 핵심 설정
│   │   ├── models/            # AI 모델
│   │   └── services/          # 비즈니스 로직
│   ├── requirements.txt
│   └── Dockerfile
│
├── infrastructure/              # 인프라 설정
│   ├── docker/                # Docker 설정
│   ├── nginx/                 # Nginx 설정
│   └── scripts/               # 유틸리티 스크립트
│
├── shared/                      # 공유 모듈
│
├── docs/                        # 문서
│
├── docker-compose.yml          # Docker Compose 설정
└── README.md
```

## 🚀 시작하기

### 필수 요구사항

- **Node.js** 20+
- **Python** 3.10+
- **Docker** & **Docker Compose**
- **NVIDIA GPU** (선택, AI 학습/추론용)
- **PostgreSQL** 15+

### 1. 환경 설정

```bash
# 프론트엔드 환경 변수
cd frontend
cp .env.example .env
# .env 파일을 수정하여 실제 값 입력

# 백엔드 환경 변수
cd ../backend
cp .env.example .env
# .env 파일을 수정하여 실제 값 입력
```

### 2. Docker Compose로 전체 시스템 실행

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

### 3. 개별 실행 (개발 모드)

#### 프론트엔드 (Next.js)

```bash
cd frontend

# 의존성 설치
npm install

# Prisma 설정
npx prisma generate
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

프론트엔드는 http://localhost:3000 에서 접근 가능합니다.

#### 백엔드 (FastAPI)

```bash
cd backend

# 가상환경 생성 (선택)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 API는 http://localhost:8000 에서 접근 가능합니다.
API 문서: http://localhost:8000/docs

## 📊 데이터베이스

### Prisma 마이그레이션

```bash
cd frontend

# 마이그레이션 생성
npx prisma migrate dev --name init

# Prisma Studio 실행 (DB GUI)
npx prisma studio
```

## 🔧 주요 기능

### Next.js API Routes (포트 3000)

- ✅ **인증/인가**: NextAuth.js 기반
- ✅ **고객 관리**: CRUD 작업
- ✅ **제품 관리**: CRUD 작업
- ✅ **AI Spec 관리**: 판정 기준 설정
- ✅ **대시보드**: 메트릭 및 통계
- ✅ **추론 오케스트레이션**: FastAPI 호출 관리
- ✅ **리포트**: PDF/Excel 생성

### FastAPI (포트 8000)

- ✅ **AI 추론**: GPU 기반 실시간 추론
- ✅ **AI 학습**: 모델 학습 및 재학습
- ✅ **모델 관리**: MLflow 연동
- ✅ **이미지 처리**: GAN 합성, 벡터 검색
- ✅ **데이터셋 관리**: 학습 데이터 처리

## 🔄 데이터 흐름 예시

### AI 추론 실행

```
사용자 (프론트엔드)
    ↓
POST /api/inference/execute (Next.js)
    │
    ├─→ 1. 요청 검증
    ├─→ 2. DB에 추론 요청 저장 (status: pending)
    ├─→ 3. 고객/제품 정보 조회
    │
    └─→ POST /api/v1/inference (FastAPI)
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

## 📚 API 문서

- **Next.js API**: http://localhost:3000/api
- **FastAPI Swagger**: http://localhost:8000/docs
- **FastAPI ReDoc**: http://localhost:8000/redoc

## 🛠️ 개발 도구

### 프론트엔드

- **Next.js 14**: React 프레임워크
- **Prisma**: ORM
- **NextAuth.js**: 인증
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 스타일링

### 백엔드

- **FastAPI**: 웹 프레임워크
- **PyTorch**: AI/ML 프레임워크
- **MLflow**: 모델 관리
- **ONNX Runtime**: 모델 추론 최적화
- **OpenCV**: 이미지 처리

### 인프라

- **PostgreSQL**: 주 데이터베이스
- **MinIO**: 객체 스토리지 (S3 호환)
- **MLflow**: 실험 추적
- **Docker**: 컨테이너화

## 🔐 보안

- JWT 기반 인증
- 환경 변수로 민감 정보 관리
- CORS 설정
- SQL Injection 방지 (Prisma ORM)

## 📝 라이센스

이 프로젝트는 내부용입니다.

## 🤝 기여

내부 팀원만 접근 가능합니다.

## 📞 문의

프로젝트 관련 문의사항

---

**프로젝트 버전**: 2.0.0
**최종 업데이트**: 2026-01-06
**기반 프로젝트**: C:\Users\gogot\pcb_inspection_ai
