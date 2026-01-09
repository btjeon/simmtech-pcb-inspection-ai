# PCB Inspection AI - 설치 및 실행 가이드

## 목차

1. [시스템 요구사항](#시스템-요구사항)
2. [초기 설정](#초기-설정)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [프론트엔드 설정](#프론트엔드-설정)
5. [백엔드 설정](#백엔드-설정)
6. [Docker Compose 실행](#docker-compose-실행)
7. [문제 해결](#문제-해결)

## 시스템 요구사항

### 필수 소프트웨어

- **Node.js**: 20.x 이상
- **Python**: 3.10 이상
- **PostgreSQL**: 15 이상
- **Docker**: 20.x 이상
- **Docker Compose**: 2.x 이상

### 선택 사항

- **NVIDIA GPU**: CUDA 12.1 지원 GPU (AI 학습/추론 가속화)
- **CUDA Toolkit**: 12.1
- **cuDNN**: 8.x

### 하드웨어 권장사양

- **CPU**: 8코어 이상
- **RAM**: 16GB 이상 (32GB 권장)
- **GPU**: NVIDIA RTX 시리즈 (8GB VRAM 이상)
- **디스크**: SSD 100GB 이상

## 초기 설정

### 1. 저장소 클론 (이미 완료됨)

현재 디렉토리: `C:\Users\gogot\simmtech-pcb-inspection-ai-edge-mlops`

### 2. 환경 변수 설정

#### 프론트엔드 환경 변수

```bash
cd frontend
copy .env.example .env
```

`.env` 파일 편집:

```env
# Database
DATABASE_URL="postgresql://pcb_user:secure_password@localhost:5432/pcb_inspection"

# NextAuth
NEXTAUTH_SECRET="생성된-랜덤-시크릿-키"
NEXTAUTH_URL="http://localhost:3000"

# AI Backend API
AI_API_URL="http://localhost:8000"

# MinIO
NEXT_PUBLIC_MINIO_ENDPOINT="localhost:9000"
NEXT_PUBLIC_MINIO_BUCKET="pcb-images"
```

#### 백엔드 환경 변수

```bash
cd ../backend
copy .env.example .env
```

`.env` 파일 편집:

```env
# Database
DATABASE_URL="postgresql://pcb_user:secure_password@localhost:5432/pcb_inspection"

# MinIO
MINIO_ENDPOINT="localhost:9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_NAME="pcb-images"
MINIO_SECURE=false

# MLflow
MLFLOW_TRACKING_URI="http://localhost:5000"
MLFLOW_EXPERIMENT_NAME="pcb-inspection"

# AI Models
MODEL_PATH="./models"
DEFAULT_MODEL_NAME="pcb_detector_v1"

# GPU
USE_GPU=true
GPU_DEVICE_ID=0

# JWT
SECRET_KEY="생성된-랜덤-시크릿-키"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3. 시크릿 키 생성

**NextAuth Secret 생성:**

```bash
# PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))
```

또는

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 데이터베이스 설정

### 옵션 1: Docker로 PostgreSQL 실행 (권장)

```bash
# docker-compose.yml 사용
docker-compose up -d postgres
```

### 옵션 2: 로컬 PostgreSQL 사용

1. PostgreSQL 설치 (이미 설치된 경우 스킵)
2. 데이터베이스 및 사용자 생성:

```sql
-- PostgreSQL에 접속
psql -U postgres

-- 사용자 생성
CREATE USER pcb_user WITH PASSWORD 'secure_password';

-- 데이터베이스 생성
CREATE DATABASE pcb_inspection OWNER pcb_user;

-- 권한 부여
GRANT ALL PRIVILEGES ON DATABASE pcb_inspection TO pcb_user;
```

### Prisma 마이그레이션 실행

```bash
cd frontend

# Prisma Client 생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev --name init

# (선택) Prisma Studio로 DB 확인
npx prisma studio
```

## 프론트엔드 설정

### 개발 모드로 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드: http://localhost:3000

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 백엔드 설정

### 개발 모드로 실행

```bash
cd backend

# 가상환경 생성 (권장)
python -m venv venv

# 가상환경 활성화
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 개발 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 API: http://localhost:8000
API 문서: http://localhost:8000/docs

### GPU 지원 확인

```bash
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}')"
```

## Docker Compose 실행

### 전체 시스템 실행 (권장)

```bash
# 루트 디렉토리에서
docker-compose up -d
```

실행되는 서비스:
- **PostgreSQL**: 포트 5432
- **MinIO**: 포트 9000 (API), 9001 (Console)
- **MLflow**: 포트 5000
- **Frontend**: 포트 3000
- **Backend**: 포트 8000

### 서비스 상태 확인

```bash
docker-compose ps
```

### 로그 확인

```bash
# 전체 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f frontend
docker-compose logs -f backend
```

### 서비스 중지

```bash
docker-compose down
```

### 볼륨 포함 완전 삭제

```bash
docker-compose down -v
```

## MinIO 설정

### MinIO 콘솔 접속

1. 브라우저에서 http://localhost:9001 접속
2. 로그인:
   - Username: `minioadmin`
   - Password: `minioadmin`

### 버킷 생성

1. MinIO 콘솔에서 **Buckets** 메뉴
2. **Create Bucket** 클릭
3. Bucket Name: `pcb-images`
4. **Create** 클릭

## MLflow 설정

### MLflow UI 접속

브라우저에서 http://localhost:5000 접속

### 실험(Experiment) 확인

자동으로 `pcb-inspection` 실험이 생성됩니다.

## 문제 해결

### 1. PostgreSQL 연결 실패

**증상**: `connection refused` 에러

**해결**:
```bash
# Docker 컨테이너 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 재시작
docker-compose restart postgres
```

### 2. Prisma 마이그레이션 실패

**증상**: `P1001: Can't reach database server`

**해결**:
1. DATABASE_URL이 올바른지 확인
2. PostgreSQL이 실행 중인지 확인
3. 방화벽 설정 확인

### 3. GPU 인식 안됨

**증상**: `torch.cuda.is_available() = False`

**해결**:
1. NVIDIA 드라이버 최신 버전 설치
2. CUDA Toolkit 12.1 설치
3. Docker GPU 지원 확인:
   ```bash
   docker run --rm --gpus all nvidia/cuda:12.1.0-base-ubuntu22.04 nvidia-smi
   ```

### 4. MinIO 접속 불가

**증상**: MinIO 콘솔 접속 안됨

**해결**:
```bash
# MinIO 상태 확인
docker-compose ps minio

# 로그 확인
docker-compose logs minio

# 재시작
docker-compose restart minio
```

### 5. 포트 충돌

**증상**: `port is already allocated`

**해결**:
```bash
# 포트 사용 확인
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# 프로세스 종료 또는 docker-compose.yml에서 포트 변경
```

## 다음 단계

1. [API_ROLE_SEPARATION_FIXED.md](API_ROLE_SEPARATION_FIXED.md) - API 역할 분담 이해
2. [README.md](README.md) - 프로젝트 개요
3. API 문서:
   - Next.js: http://localhost:3000/api
   - FastAPI: http://localhost:8000/docs

## 지원

문제가 계속되면 개발팀에 문의하세요.
