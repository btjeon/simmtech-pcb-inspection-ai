# 기존 프로젝트 → 신규 시스템 마이그레이션 가이드

## 📋 개요

기존 `C:\Users\gogot\pcb_inspection_ai` 프로젝트의 HTML/CSS/JS 기반 모듈을 Next.js + FastAPI 기반의 새로운 시스템으로 전환합니다.

**기존 프로젝트**: HTML/CSS/JS (단순 웹 기반)
**신규 프로젝트**: Next.js 14 + FastAPI (Palantir 테마)

---

## 🗂️ 기존 모듈 분석

### 1. 제품 정보 관리 (01_product_info_management)

#### 기존 화면 구성
```
- 통계 카드 (4개)
  ├─ 제품정보 수
  ├─ 고객사 수
  ├─ 불량유형 수
  └─ 공통코드 수

- 탭 구조 (4개 탭)
  ├─ 제품정보 (products)
  ├─ 고객사 (customers)
  ├─ 불량유형 (defects)
  └─ 공통코드 (codes)

- 각 탭 기능
  ├─ 필터 (드롭다운)
  ├─ 정렬 (클릭)
  ├─ 체크박스 선택
  ├─ 새로고침
  ├─ DB 업로드 (JSON)
  └─ 내보내기
```

#### 신규 구조 매핑

**페이지**: `frontend/src/app/(dashboard)/products/page.tsx`

**컴포넌트**:
- `components/dashboard/StatCard.tsx` - 통계 카드
- `components/products/ProductsTable.tsx` - 제품 테이블
- `components/products/CustomersTable.tsx` - 고객사 테이블
- `components/products/DefectTypesTable.tsx` - 불량유형 테이블
- `components/products/CommonCodesTable.tsx` - 공통코드 테이블

**API Routes**:
- `GET /api/products` - 제품 목록
- `POST /api/products` - 제품 생성
- `PUT /api/products/:id` - 제품 수정
- `DELETE /api/products/:id` - 제품 삭제
- (고객사, 불량유형, 공통코드도 동일 패턴)

**데이터베이스**:
```prisma
model Product {
  id          String
  name        String
  code        String
  customerId  String
  category    String?  // 제품 유형
  ...
}

model DefectType {
  id          String
  productId   String
  name        String
  code        String
  ...
}

model CommonCode {
  id          String
  category    String
  code        String
  name        String
  ...
}
```

---

### 2. 이미지 합성 (03_image_synthesis)

#### 기존 화면 구성
```
- 헤더
  ├─ 아이콘 (◈)
  ├─ 제목: "이미지 합성 시스템"
  └─ 설명

- 탭 (2개)
  ├─ 불량 추출 (YOLO)
  │   ├─ 불량 이미지 경로 선택
  │   ├─ 출력 폴더 선택
  │   ├─ 신뢰도 임계값 슬라이더
  │   └─ YOLO 추출 시작 버튼
  │
  └─ 이미지 합성
      ├─ 양품 이미지 폴더
      ├─ 불량 이미지 폴더
      ├─ 출력 설정
      └─ 합성 시작 버튼

- 결과 뷰
  └─ 이미지 그리드
```

#### 신규 구조 매핑

**페이지**: `frontend/src/app/(dashboard)/image-synthesis/page.tsx`

**컴포넌트**:
- `components/synthesis/YOLOExtraction.tsx` - 불량 추출 탭
- `components/synthesis/ImageBlending.tsx` - 이미지 합성 탭
- `components/synthesis/ImageGrid.tsx` - 결과 이미지 그리드
- `components/synthesis/ProgressBar.tsx` - 진행 상황

**API Routes (FastAPI)**:
- `POST /api/v1/images/synthesis` - GAN 이미지 합성 시작
- `GET /api/v1/images/synthesis/:id/status` - 합성 상태 조회
- `GET /api/v1/images/synthesis/:id/download` - 결과 다운로드

**데이터베이스**:
```prisma
model ImageSynthesisJob {
  id           String
  defectType   String
  count        Int
  status       SynthesisStatus
  outputPath   String?
  resultImages Json?
  ...
}
```

---

### 3. 고객 Spec 관리 (04_customer_spec_management)

#### 기존 화면 구성
```
- Spec 검색 섹션
  ├─ 고객사 선택 (드롭다운)
  ├─ 제품 유형 선택
  ├─ Customized 입력
  └─ 검색 버튼 / 초기화 / 통계 보기 / 신규 생성

- 검색 결과 테이블
  ├─ ID, 고객사, 제품 유형, Customized, Rev, 날짜
  ├─ 불량 유형 수
  └─ 액션 (상세보기, 수정, 삭제)

- Spec 상세 모달
  ├─ 기본 정보
  ├─ 불량 유형 목록
  └─ JSON 구조
```

#### 신규 구조 매핑

**페이지**: `frontend/src/app/(dashboard)/specs/page.tsx`

**컴포넌트**:
- `components/specs/SpecSearch.tsx` - 검색 폼
- `components/specs/SpecsTable.tsx` - 결과 테이블
- `components/specs/SpecDetailModal.tsx` - 상세 모달
- `components/specs/SpecStatsModal.tsx` - 통계 모달

**API Routes**:
- `GET /api/specs` - Spec 목록 조회
- `POST /api/specs` - Spec 생성
- `GET /api/specs/:id` - Spec 상세 조회
- `PUT /api/specs/:id` - Spec 수정
- `DELETE /api/specs/:id` - Spec 삭제
- `GET /api/specs/stats` - 통계 조회

**데이터베이스**:
```prisma
model AISpec {
  id           String
  name         String
  customerId   String
  productId    String
  category     String?  // 제품 유형
  customized   String?  // None, Waiver
  rev          String?  // Rev 번호
  version      String
  specData     Json     // 복잡한 Spec 데이터
  defectCount  Int
  ...
}
```

---

## 🎨 UI/UX 변환

### 기존 스타일 → Palantir 테마

| 기존 | 신규 (Palantir) |
|------|-----------------|
| 배경색 | `#0F1117` (더 어두운 배경) |
| 카드 배경 | `#1A1E2E` |
| 강조 색상 | `#00E3AE` (민트 계열) |
| 텍스트 | `#E1E5E9` |
| 보더 | `#2C3038` |

### 아이콘

기존 HTML에서 사용한 아이콘 심볼을 유지:
- ◈ (이미지 합성)
- ◐ (이미지 검색)
- ▶ (모델 학습)
- ⟐ (AI 추론)
- ▤ (리포트)
- ◆ (상세 분석)

**Lucide React 아이콘**으로 대체하되, 필요시 커스텀 아이콘 컴포넌트 생성

---

## 🔄 데이터 마이그레이션

### 1. 제품 정보 데이터

**기존 형식**: JSON 파일
```json
{
  "products": [
    {
      "id": 1,
      "customer": "삼성",
      "itemname": "PCB-001",
      ...
    }
  ]
}
```

**신규 형식**: PostgreSQL (Prisma)
```sql
INSERT INTO products (id, name, code, customer_id, category, ...)
VALUES (...);
```

**마이그레이션 스크립트**: `scripts/migrate-products.ts`

### 2. Spec 데이터

**기존 형식**: JSON 파일 (복잡한 nested 구조)
```json
{
  "Customer": "삼성",
  "ProductType": "TYPE-A",
  "Customized": "None",
  "Rev": "R1.0",
  "defects": [...]
}
```

**신규 형식**: PostgreSQL (JSON 컬럼)
```sql
INSERT INTO ai_specs (
  customer_id,
  product_id,
  category,
  customized,
  rev,
  spec_data  -- JSON 컬럼에 전체 저장
)
VALUES (...);
```

---

## 📝 개발 우선순위 (Phase별)

### Phase 1: 이미지 합성 (Week 3-4)
**✅ 독립 모듈 - 즉시 배포 가능**

- [ ] FastAPI GAN 엔진 개발
- [ ] Next.js 이미지 합성 UI
- [ ] MinIO 연동
- [ ] 진행 상황 WebSocket

### Phase 2: 이미지 검색 (Week 5-6)
**✅ 독립 모듈 - 즉시 배포 가능**

- [ ] Qdrant 벡터 DB 설정
- [ ] FastAPI 벡터 검색 API
- [ ] Next.js 검색 UI
- [ ] 이미지 업로드

### Phase 3: 모델 학습 (Week 7-8)
**✅ 독립 모듈 - AI 팀 활용**

- [ ] FastAPI 학습 엔진
- [ ] MLflow 연동
- [ ] Next.js 학습 관리 UI
- [ ] 실험 추적

### Phase 4-6: 신규 장비 통합 (Week 9-14)
**⚠️ 신규 장비만 지원**

- [ ] 제품 정보 관리 (CRUD)
- [ ] Spec 관리 (CRUD)
- [ ] AI 추론 실행
- [ ] 결과 분석 대시보드

---

## 🚀 빠른 시작 (기존 모듈 재현)

### 1. 제품 정보 관리 페이지 생성

```bash
# 페이지 생성
mkdir -p frontend/src/app/\(dashboard\)/products
touch frontend/src/app/\(dashboard\)/products/page.tsx

# 컴포넌트 생성
mkdir -p frontend/src/components/products
touch frontend/src/components/products/ProductsTable.tsx

# API Routes 생성
mkdir -p frontend/src/app/api/products
touch frontend/src/app/api/products/route.ts
```

### 2. 이미지 합성 페이지 생성

```bash
# 페이지 생성
mkdir -p frontend/src/app/\(dashboard\)/image-synthesis
touch frontend/src/app/\(dashboard\)/image-synthesis/page.tsx

# FastAPI 라우터
touch backend/app/api/v1/images.py
```

---

## 📌 주의사항

### 1. 데이터베이스 스키마

- 기존 JSON 구조를 최대한 유지하되, 정규화 필요
- `specData` 컬럼에 복잡한 JSON 저장 (검색 불가능한 부분)
- 검색 가능한 필드는 별도 컬럼으로 분리

### 2. UI 컴포넌트

- 기존 HTML의 레이아웃 구조는 최대한 유지
- Palantir 테마 적용하여 다크 모드 최적화
- 반응형 디자인 추가

### 3. API 설계

- RESTful API 원칙 준수
- Next.js API Routes vs FastAPI 역할 명확히 분리
- 에러 처리 일관성 유지

---

## 다음 단계

1. ✅ Docker Compose 업데이트 (Redis, Qdrant 추가) - 완료
2. ✅ Prisma 스키마 업데이트 - 완료
3. ✅ Palantir 테마 설정 - 완료
4. [ ] 공통 UI 컴포넌트 라이브러리 생성
5. [ ] Phase 1 기능 구현 (이미지 합성)
6. [ ] 기존 데이터 마이그레이션 스크립트

---

**작성일**: 2026-01-06
**버전**: 1.0
**참조 문서**:
- `API_ROLE_SEPARATION_FIXED.md`
- `PCB_Inspection_AI_Development_Specification_v1.0.md`
