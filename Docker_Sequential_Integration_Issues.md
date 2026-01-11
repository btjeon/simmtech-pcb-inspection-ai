# 독립 Docker 순차 통합 - 문제점과 해결 방안
**점진적 통합 시 주의사항 및 베스트 프랙티스**

---

## 📋 목차
1. [발생 가능한 문제점](#1-발생-가능한-문제점)
2. [해결 방안](#2-해결-방안)
3. [권장 통합 전략](#3-권장-통합-전략)
4. [실전 체크리스트](#4-실전-체크리스트)

---

## 1. 발생 가능한 문제점

### 🔴 문제 1: 네트워크 충돌

#### 상황
```yaml
독립 개발 시:
  image-synthesis:
    - Network: synthesis-network
    - Port: 8003

통합 시:
  image-synthesis:
    - Network: pcb-network  # 다름!
    - Port: 8003
```

#### 증상
```bash
# 독립 개발 시 동작하던 것이
docker-compose -f services/image-synthesis/docker-compose.dev.yml up
# → 정상 동작 ✅

# 통합 후 동작 안 함
docker-compose up
# → 네트워크 연결 실패 ❌
```

#### 원인
```
독립: synthesis-network
통합: pcb-network

→ 네트워크 이름이 달라서
   서비스 간 통신 불가능
```

---

### 🔴 문제 2: 환경 변수 불일치

#### 상황
```yaml
# 독립 개발 (docker-compose.dev.yml)
environment:
  - MINIO_ENDPOINT=minio:9000
  - DATABASE_URL=postgresql://localhost:5432/test

# 통합 (docker-compose.yml)
environment:
  - MINIO_ENDPOINT=minio:9000
  - DATABASE_URL=postgresql://postgres:5432/pcb_inspection
```

#### 증상
```bash
독립 테스트: 성공 ✅
통합 후: DB 연결 실패 ❌

Error: could not connect to server: Connection refused
```

#### 원인
```
독립: localhost:5432 (호스트 DB)
통합: postgres:5432 (Docker 내부)

→ 환경 변수가 달라서 실패
```

---

### 🔴 문제 3: 포트 충돌

#### 상황
```yaml
# 독립 개발 시
image-synthesis:
  ports:
    - "8003:8003"

image-search:
  ports:
    - "8004:8004"

# 통합 시 동시 실행
docker-compose up
# → 포트는 충돌 없음 (다른 포트)
```

#### 하지만!
```yaml
# 독립 개발 중 MinIO
services/image-synthesis/docker-compose.dev.yml:
  minio:
    ports:
      - "9000:9000"  # MinIO 기본 포트

services/image-search/docker-compose.dev.yml:
  minio:
    ports:
      - "9000:9000"  # 충돌! ❌

# 동시에 독립 개발 시 포트 충돌
```

---

### 🔴 문제 4: 볼륨 데이터 불일치

#### 상황
```yaml
# 독립 개발
volumes:
  minio_data_dev:  # 독립용

# 통합
volumes:
  minio_data:      # 통합용
```

#### 증상
```bash
독립 테스트 시 업로드한 이미지:
  → minio_data_dev에 저장

통합 후:
  → minio_data는 비어있음
  → 이미지 없음 ❌
```

---

### 🔴 문제 5: 의존성 순서 문제

#### 상황
```yaml
# Week 4: 이미지 합성만 추가
docker-compose.yml:
  image-synthesis:
    depends_on:
      - minio  # MinIO 필요

# Week 6: 이미지 검색 추가
  image-search:
    depends_on:
      - qdrant  # Qdrant 필요
      - minio   # MinIO도 필요!

# 문제: MinIO가 이미 실행 중이라
#       image-search가 기존 MinIO를 인식 못할 수 있음
```

---

### 🔴 문제 6: 데이터베이스 스키마 진화

#### 상황
```sql
-- Week 4: 이미지 합성 (스키마 v1)
CREATE TABLE synthesis_jobs (
    id SERIAL PRIMARY KEY,
    status VARCHAR(20)
);

-- Week 12: AI 추론 (스키마 v2)
-- 기존 테이블에 컬럼 추가 필요
ALTER TABLE synthesis_jobs 
ADD COLUMN inference_id INTEGER;
```

#### 문제
```
독립 개발 시:
  → 각자 다른 DB 사용
  → 스키마 독립적

통합 시:
  → 공유 DB 사용
  → 스키마 충돌 가능
  → 마이그레이션 필요
```

---

### 🔴 문제 7: GPU 할당 충돌

#### 상황
```yaml
# Week 4
image-synthesis:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            device_ids: ['0']  # GPU 0

# Week 8
ai-training:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            device_ids: ['0']  # GPU 0 (충돌!)
```

#### 문제
```
GPU 1개만 있는 경우:
  → 두 서비스가 같은 GPU 요청
  → 리소스 부족 또는 성능 저하
```

---

## 2. 해결 방안

### ✅ 해결 1: 네트워크 통일

#### 방법: 독립 개발 시에도 통합 네트워크 이름 사용

```yaml
# services/image-synthesis/docker-compose.dev.yml
# 독립 개발 시에도 통합과 동일한 네트워크 이름!

version: '3.8'

services:
  image-synthesis:
    build: .
    networks:
      - pcb-network  # 통합과 동일!

  minio:
    image: minio/minio:latest
    networks:
      - pcb-network  # 통합과 동일!

networks:
  pcb-network:  # 통합과 동일!
    driver: bridge
```

**장점**:
```
✅ 독립 개발 환경 ≈ 통합 환경
✅ 통합 시 네트워크 이슈 없음
```

---

### ✅ 해결 2: 환경 변수 표준화

#### 방법: .env 파일로 통일

```bash
# .env.dev (독립 개발용)
MINIO_ENDPOINT=minio:9000
DATABASE_URL=postgresql://postgres:5432/pcb_inspection_dev
REDIS_URL=redis://redis:6379

# .env.prod (통합용)
MINIO_ENDPOINT=minio:9000
DATABASE_URL=postgresql://postgres:5432/pcb_inspection
REDIS_URL=redis://redis:6379
```

```yaml
# services/image-synthesis/docker-compose.dev.yml
version: '3.8'

services:
  image-synthesis:
    env_file:
      - ../../.env.dev  # 공통 환경 변수!
```

**장점**:
```
✅ 환경 변수 일관성
✅ 통합 시 변경 최소화
```

---

### ✅ 해결 3: 포트 범위 사전 할당

#### 방법: 포트 맵 문서화

```yaml
# docs/PORT_MAPPING.md

서비스 포트 할당:
  Frontend:        3000
  AI Inference:    8001
  AI Training:     8002
  Image Synthesis: 8003
  Image Search:    8004

인프라 포트:
  PostgreSQL:      5432
  Redis:           6379
  MinIO:           9000, 9001
  Qdrant:          6333
  MLflow:          5000

독립 개발 시 테스트 포트:
  MinIO (dev):     9010-9019  # 충돌 방지
  PostgreSQL (dev): 5433      # 충돌 방지
  Redis (dev):     6380       # 충돌 방지
```

```yaml
# services/image-synthesis/docker-compose.dev.yml
services:
  minio:
    ports:
      - "9010:9000"  # 개발용 포트 (충돌 방지)
```

---

### ✅ 해결 4: 통합 볼륨 사용

#### 방법: 독립 개발 시에도 통합 볼륨 마운트

```yaml
# services/image-synthesis/docker-compose.dev.yml

services:
  minio:
    volumes:
      - ../../volumes/minio_data:/data  # 통합과 동일 경로!

# 또는 external volume 사용
volumes:
  minio_data:
    external: true  # 통합에서 생성한 볼륨 사용
```

**장점**:
```
✅ 데이터 일관성
✅ 독립 개발 → 통합 시 데이터 유지
```

---

### ✅ 해결 5: 공유 인프라 활용

#### 방법: 인프라는 통합에서 실행, 서비스만 독립 개발

```yaml
# 전략: 인프라는 통합, 서비스만 독립

# 1. 통합 인프라 실행 (루트)
docker-compose up -d postgres redis minio

# 2. 독립 서비스 개발 (연결만)
# services/image-synthesis/docker-compose.dev.yml

version: '3.8'

services:
  image-synthesis:
    build: .
    environment:
      - MINIO_ENDPOINT=minio:9000
    networks:
      - pcb-network

networks:
  pcb-network:
    external: true  # 통합 네트워크 사용!
```

**실행 순서**:
```bash
# 1. 통합 인프라 시작
cd /project-root
docker-compose up -d postgres redis minio

# 2. 독립 서비스 개발
cd services/image-synthesis
docker-compose -f docker-compose.dev.yml up -d

# → 통합 인프라 공유!
```

---

### ✅ 해결 6: DB 마이그레이션 전략

#### 방법: Alembic/Prisma 마이그레이션

```bash
# 프로젝트 구조
project/
├── migrations/            # 통합 마이그레이션
│   ├── versions/
│   │   ├── 001_initial.py
│   │   ├── 002_add_synthesis.py
│   │   ├── 003_add_search.py
│   │   └── 004_add_inference.py
│   └── alembic.ini
│
└── services/
    ├── image-synthesis/
    └── image-search/
```

```python
# migrations/versions/002_add_synthesis.py

def upgrade():
    op.create_table(
        'synthesis_jobs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(20), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

def downgrade():
    op.drop_table('synthesis_jobs')
```

**Phase별 적용**:
```bash
# Week 4: 이미지 합성 추가 전
alembic upgrade head  # 002_add_synthesis 적용

# Week 6: 이미지 검색 추가 전
alembic upgrade head  # 003_add_search 적용
```

---

### ✅ 해결 7: GPU 할당 계획

#### 방법: GPU 리소스 맵 사전 작성

```yaml
# docs/GPU_ALLOCATION.md

GPU 할당 계획 (GPU 2개 가정):

GPU 0:
  - AI Inference (8001)     [Primary]
  - Image Synthesis (8003)  [Shared]

GPU 1:
  - AI Training (8002)      [Primary]

우선순위:
  1. AI Inference (실시간)
  2. AI Training (배치)
  3. Image Synthesis (온디맨드)
```

```yaml
# docker-compose.yml

services:
  ai-inference:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']  # GPU 0 전용

  ai-training:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['1']  # GPU 1 전용

  image-synthesis:
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              device_ids: ['0']  # GPU 0 공유
```

---

## 3. 권장 통합 전략

### 🎯 전략: "하이브리드 접근"

```yaml
개념:
  - 인프라는 통합에서 실행 (공유)
  - 서비스만 독립 개발
  - 환경 변수 표준화
  - 네트워크 통일

장점:
  ✅ 독립 개발 가능
  ✅ 통합 시 충돌 없음
  ✅ 데이터 일관성
  ✅ 리소스 효율적
```

### 📐 구조

```
┌─────────────────────────────────────────┐
│        통합 docker-compose.yml          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  공유 인프라 (항상 실행)        │   │
│  │  - postgres                     │   │
│  │  - redis                        │   │
│  │  - minio                        │   │
│  │  - qdrant                       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  서비스 (Phase별 추가)          │   │
│  │  - image-synthesis (Week 4)     │   │
│  │  - image-search (Week 6)        │   │
│  │  - ai-training (Week 8)         │   │
│  │  - ai-inference (Week 12)       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

독립 개발:
  services/image-synthesis/
    docker-compose.dev.yml
      → 통합 인프라 연결 (external network)
      → 서비스만 독립 빌드/테스트
```

---

## 4. 실전 체크리스트

### Phase 0: 기반 준비 (Week 1-2)

```yaml
☐ 통합 docker-compose.yml 작성
  ☐ 공유 인프라 정의
  ☐ 네트워크 정의 (pcb-network)
  ☐ 볼륨 정의

☐ 환경 변수 파일 생성
  ☐ .env.dev
  ☐ .env.prod

☐ 포트 맵 문서화
  ☐ docs/PORT_MAPPING.md

☐ GPU 할당 계획
  ☐ docs/GPU_ALLOCATION.md

☐ DB 마이그레이션 초기화
  ☐ alembic init migrations

☐ 공유 인프라 실행 테스트
  docker-compose up -d postgres redis minio
```

---

### Phase 1: 이미지 합성 (Week 3-4)

```yaml
Week 3: 독립 개발
  ☐ services/image-synthesis/ 생성
  ☐ docker-compose.dev.yml 작성
    ☐ external network 사용 (pcb-network)
    ☐ .env.dev 참조
    ☐ 포트 맵 준수
  
  ☐ 독립 실행 테스트
    ☐ 통합 인프라와 연결 확인
    ☐ API 테스트
    ☐ GPU 동작 확인

Week 4: 통합
  ☐ DB 마이그레이션 작성/적용
  ☐ docker-compose.yml에 추가
  ☐ 통합 실행 테스트
  ☐ Frontend 연결 테스트
  ☐ 독립 개발 환경 정리
```

---

### Phase 2: 이미지 검색 (Week 5-6)

```yaml
Week 5: 독립 개발
  ☐ 기존 통합 환경 동작 확인
    docker-compose ps
    # image-synthesis 실행 중이어야 함
  
  ☐ services/image-search/ 생성
  ☐ docker-compose.dev.yml 작성
    ☐ external network 사용
    ☐ .env.dev 참조
  
  ☐ Qdrant 추가 고려
    ☐ 통합에 추가? (권장)
    ☐ 독립에 추가? (테스트만)

Week 6: 통합
  ☐ Qdrant 통합에 추가 (없으면)
  ☐ DB 마이그레이션 (필요 시)
  ☐ docker-compose.yml에 추가
  ☐ 통합 테스트
    ☐ image-synthesis 여전히 동작? ✅
    ☐ image-search 정상 동작? ✅
```

---

### Phase별 반복 패턴

```yaml
각 Phase마다:
  1. 기존 통합 환경 백업
     docker-compose down
     # volumes 백업

  2. 독립 개발
     - external network 사용
     - 통합 인프라 공유
     - 독립 테스트

  3. 통합 전 체크
     ☐ 네트워크 설정 동일?
     ☐ 환경 변수 동일?
     ☐ 포트 충돌 없음?
     ☐ DB 마이그레이션 준비?
     ☐ GPU 할당 확인?

  4. 통합
     - docker-compose.yml에 추가
     - 단계적 실행
       docker-compose up -d <new-service>

  5. 통합 테스트
     ☐ 신규 서비스 동작?
     ☐ 기존 서비스 여전히 동작?
     ☐ Frontend 연결?
     ☐ 로그 확인?

  6. 롤백 계획
     # 문제 발생 시
     docker-compose stop <new-service>
     # 원복
```

---

## 5. 예시: Week 4 → Week 6 통합

### Week 4: 이미지 합성 통합 완료 후

```bash
# 현재 실행 중인 서비스
$ docker-compose ps

NAME                STATUS
pcb-postgres        Up
pcb-redis           Up
pcb-minio           Up
pcb-frontend        Up
pcb-image-synthesis Up  ← 추가됨
```

### Week 5: 이미지 검색 독립 개발

```bash
# 1. 기존 통합 환경은 그대로 유지
$ docker-compose ps
# → image-synthesis 실행 중 ✅

# 2. 독립 개발 시작
$ cd services/image-search

# 3. docker-compose.dev.yml 작성
version: '3.8'
services:
  image-search:
    build: .
    networks:
      - pcb-network

networks:
  pcb-network:
    external: true  # 통합 네트워크 사용!

# 4. 독립 실행
$ docker-compose -f docker-compose.dev.yml up -d

# 5. 테스트
$ curl http://localhost:8004/api/v1/search

# 6. 개발 완료 후 정리
$ docker-compose -f docker-compose.dev.yml down
```

### Week 6: 이미지 검색 통합

```bash
# 1. 백업 (선택)
$ docker-compose down
$ cp docker-compose.yml docker-compose.yml.backup

# 2. docker-compose.yml 수정
# image-search 추가

# 3. Qdrant 먼저 추가
$ docker-compose up -d qdrant

# 4. image-search 추가
$ docker-compose up -d image-search

# 5. 확인
$ docker-compose ps

NAME                  STATUS
pcb-postgres          Up
pcb-redis             Up
pcb-minio             Up
pcb-frontend          Up
pcb-image-synthesis   Up  ← 여전히 동작 ✅
pcb-qdrant            Up  ← 새로 추가
pcb-image-search      Up  ← 새로 추가

# 6. 통합 테스트
# - Frontend에서 image-synthesis 동작 확인
# - Frontend에서 image-search 동작 확인
```

---

## 6. 최종 권장사항

### ✅ DO (권장)

```yaml
1. 통합 인프라 먼저 구축
   - postgres, redis, minio 등
   - 항상 실행 유지

2. 서비스는 독립 개발
   - external network 사용
   - 통합 인프라 공유

3. 환경 변수 표준화
   - .env.dev, .env.prod

4. 포트/GPU 사전 계획
   - 문서화

5. DB 마이그레이션 관리
   - Phase별 마이그레이션

6. 단계적 통합
   - 하나씩 추가
   - 매번 테스트

7. 롤백 계획
   - 백업
   - 복구 절차
```

### ❌ DON'T (피하기)

```yaml
1. 독립 개발 시 완전히 다른 환경
   - 네트워크 다름
   - 환경 변수 다름
   → 통합 시 문제!

2. 포트 사전 계획 없이 개발
   → 충돌!

3. 여러 서비스 동시 통합
   → 문제 발생 시 원인 파악 어려움

4. 롤백 계획 없이 통합
   → 문제 시 복구 불가

5. DB 마이그레이션 관리 안 함
   → 스키마 충돌

6. GPU 할당 계획 없음
   → 리소스 부족
```

---

## 7. 최종 답변

### Q: 독립 Docker를 순서대로 통합하는 건 문제 없나?

**A: 문제 있을 수 있지만, 해결 가능합니다!**

### 🔴 잠재적 문제들

```yaml
1. 네트워크 충돌
2. 환경 변수 불일치
3. 포트 충돌
4. 볼륨 데이터 불일치
5. 의존성 순서 문제
6. DB 스키마 진화
7. GPU 할당 충돌
```

### ✅ 해결 방법

```yaml
1. 하이브리드 접근
   - 인프라는 통합에서 실행 (공유)
   - 서비스만 독립 개발
   - external network 사용

2. 표준화
   - 환경 변수 (.env)
   - 포트 맵
   - GPU 할당

3. 단계적 통합
   - 하나씩 추가
   - 매번 테스트
   - 롤백 준비

4. 문서화
   - 포트 맵
   - GPU 할당
   - DB 마이그레이션
```

### 💡 한 줄 요약

> **"문제 있을 수 있지만, 하이브리드 접근(통합 인프라 + 독립 서비스)과 표준화로 해결 가능!"** 🚀

---

**문서 버전**: 1.0  
**작성일**: 2025-01-07  
**결론**: 순차 통합 가능! 단, 사전 계획과 표준화 필수!
