# PCB Inspection AI - 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1단계: 환경 변수 설정 (1분)

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (필수 항목만)
# - POSTGRES_PASSWORD: 강력한 비밀번호로 변경
# - MINIO_ROOT_PASSWORD: 강력한 비밀번호로 변경
# - NEXTAUTH_SECRET: openssl rand -base64 32로 생성
```

### 2단계: 인프라 시작 (2분)

```bash
# 인프라만 먼저 실행 (PostgreSQL, Redis, MinIO, etc.)
docker-compose -f docker-compose.infra.yml up -d

# 상태 확인
docker-compose -f docker-compose.infra.yml ps

# 로그 확인 (문제 발생 시)
docker-compose -f docker-compose.infra.yml logs -f
```

**확인 사항:**
- ✅ PostgreSQL: `localhost:5432`
- ✅ MinIO Console: http://localhost:9001
- ✅ MLflow UI: http://localhost:5000
- ✅ Grafana: http://localhost:3001
- ✅ Prometheus: http://localhost:9090

### 3단계: 애플리케이션 시작 (2분)

```bash
# Frontend (Next.js)
cd services/frontend
npm install
npm run dev
# → http://localhost:3000

# Backend (FastAPI) - 다른 터미널
cd services/backend-core
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000/docs
```

### 완료! 🎉

브라우저에서 http://localhost:3000 접속

---

## 📋 서비스 포트 정리

| 서비스           | URL                        | 용도                |
|-----------------|----------------------------|---------------------|
| Frontend        | http://localhost:3000      | 메인 UI             |
| Backend API     | http://localhost:8000/docs | API 문서            |
| MinIO Console   | http://localhost:9001      | 파일 스토리지 관리   |
| MLflow          | http://localhost:5000      | ML 실험 추적        |
| Grafana         | http://localhost:3001      | 모니터링 대시보드    |
| Prometheus      | http://localhost:9090      | 메트릭 수집         |
| Jaeger          | http://localhost:16686     | 분산 추적           |

---

## 🛠️ 주요 명령어

### 인프라 관리

```bash
# 인프라 시작
docker-compose -f docker-compose.infra.yml up -d

# 인프라 중지
docker-compose -f docker-compose.infra.yml down

# 인프라 중지 (볼륨 삭제 - 주의!)
docker-compose -f docker-compose.infra.yml down -v

# 로그 확인
docker-compose -f docker-compose.infra.yml logs -f [서비스명]

# 특정 서비스만 재시작
docker-compose -f docker-compose.infra.yml restart postgres
```

### 개발 서버

```bash
# Frontend
cd services/frontend
npm run dev          # 개발 서버
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버

# Backend
cd services/backend-core
uvicorn app.main:app --reload  # 개발 서버 (핫 리로드)
uvicorn app.main:app           # 프로덕션 서버
```

### 데이터베이스

```bash
# PostgreSQL 접속
docker exec -it pcb-postgres psql -U postgres -d pcb_inspection

# 데이터베이스 백업
docker exec pcb-postgres pg_dump -U postgres pcb_inspection > backup.sql

# 데이터베이스 복원
docker exec -i pcb-postgres psql -U postgres pcb_inspection < backup.sql

# Prisma 마이그레이션 (Frontend)
cd services/frontend
npx prisma migrate dev
npx prisma studio    # DB GUI
```

---

## 🐛 문제 해결

### 포트 충돌 에러

```bash
# 문제: "port is already allocated"
# 해결: 사용 중인 포트 확인 및 종료

# Windows
netstat -ano | findstr :3000
taskkill /PID [PID번호] /F

# Linux/Mac
lsof -i :3000
kill -9 [PID]
```

### PostgreSQL 연결 실패

```bash
# 1. PostgreSQL 실행 상태 확인
docker-compose -f docker-compose.infra.yml ps postgres

# 2. 로그 확인
docker-compose -f docker-compose.infra.yml logs postgres

# 3. 직접 접속 테스트
docker exec -it pcb-postgres psql -U postgres

# 4. 재시작
docker-compose -f docker-compose.infra.yml restart postgres
```

### MinIO 버킷 없음 에러

```bash
# MinIO 초기화 컨테이너 로그 확인
docker logs pcb-minio-init

# 수동으로 버킷 생성
docker exec -it pcb-minio mc alias set minio http://localhost:9000 minioadmin minioadmin123
docker exec -it pcb-minio mc mb minio/images
docker exec -it pcb-minio mc mb minio/models
docker exec -it pcb-minio mc mb minio/datasets
```

### npm install 에러

```bash
# node_modules 삭제 후 재설치
cd services/frontend
rm -rf node_modules package-lock.json
npm install

# npm 캐시 클리어
npm cache clean --force
```

### Python 패키지 에러

```bash
# 가상환경 재생성
cd services/backend-core
rm -rf venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🔧 고급 설정

### GPU 사용 설정

```bash
# NVIDIA Driver 설치 확인
nvidia-smi

# Docker GPU 지원 확인
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi

# GPU 사용하는 서비스 시작 (향후)
docker-compose up -d ai-inference ai-training
```

### 개발 환경 vs 프로덕션 환경

```bash
# 개발 환경
cp .env.example .env.dev
docker-compose -f docker-compose.dev.yml up

# 프로덕션 환경
cp .env.example .env.prod
# .env.prod 수정 (강력한 비밀번호, HTTPS 설정 등)
docker-compose -f docker-compose.yml up -d
```

### 로그 레벨 조정

```bash
# .env 파일에서
LOG_LEVEL=DEBUG    # 개발 시
LOG_LEVEL=INFO     # 프로덕션
LOG_LEVEL=ERROR    # 문제 발생 시만
```

---

## 📚 다음 단계

1. **사용자 가이드**: [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
2. **API 문서**: http://localhost:8000/docs
3. **아키텍처**: [docs/architecture/MSA_DESIGN.md](docs/architecture/MSA_DESIGN.md)
4. **포트 매핑**: [docs/PORT_MAPPING.md](docs/PORT_MAPPING.md)
5. **GPU 설정**: [docs/GPU_ALLOCATION.md](docs/GPU_ALLOCATION.md)

---

## 💡 팁

### 자동 시작 스크립트

```bash
# start-dev.bat (Windows) 또는 start-dev.sh (Linux/Mac)
#!/bin/bash
echo "Starting PCB Inspection AI Platform..."
docker-compose -f docker-compose.infra.yml up -d
cd services/frontend && npm run dev &
cd services/backend-core && uvicorn app.main:app --reload &
echo "All services started!"
```

### VS Code 통합 터미널

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Infrastructure",
      "type": "shell",
      "command": "docker-compose -f docker-compose.infra.yml up -d"
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "cd services/frontend && npm run dev"
    },
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "cd services/backend-core && uvicorn app.main:app --reload"
    }
  ]
}
```

---

**문서 버전**: 1.0
**최종 업데이트**: 2025-01-11
