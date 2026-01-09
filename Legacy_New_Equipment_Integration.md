# PCB Inspection AI - 레거시/신규 장비 혼재 통합 전략
**복잡한 양산 환경에서의 점진적 MLOps 구축**

---

## 📋 목차
1. [현재 상황 정확한 파악](#현재-상황-정확한-파악)
2. [3-Track 병행 전략](#3-track-병행-전략)
3. [개발 우선순위](#개발-우선순위)
4. [통합 로드맵](#통합-로드맵)
5. [데이터 아키텍처](#데이터-아키텍처)
6. [리스크 관리](#리스크-관리)

---

## 1. 현재 상황 정확한 파악

### 1.1 장비 그룹 현황

```yaml
레거시 장비 그룹 (Legacy):
  상태: 양산 운영 중
  시스템: C# WinForm (분산)
  데이터:
    - ❌ DB화 안 됨
    - ⚠️ 파일 기반 (JSON? CSV?)
    - ⚠️ 데이터 정의서만 일부 있음
  문제:
    - 통합 어려움
    - 데이터 분산
    - 추적 불가능
  
신규 장비 그룹 (New):
  상태: 양산 운영 중
  시스템: C# WinForm (개선)
  데이터:
    - ✅ 일부 DB화 완료
    - ✅ AI 추론 결과 → DB
    - ✅ 검사 결과 → DB
    - ⚠️ 완전하지는 않음
  장점:
    - 통합 가능한 구조
    - 데이터 접근 가능
  
목표 시스템 (Edge MLOps):
  상태: 개발 예정
  시스템: Next.js + FastAPI
  데이터:
    - ✅ 완전 DB 통합
    - ✅ MLOps 적용
    - ✅ 통합 관리
```

### 1.2 데이터 상태

```
┌─────────────────────────────────────────┐
│          레거시 장비 그룹                │
├─────────────────────────────────────────┤
│ 검사 결과: 파일 (JSON/CSV/XML?)         │
│ AI 추론: 파일 또는 없음                  │
│ 데이터 정의서: 일부만 (불완전)          │
│ 통합: 매우 어려움 ❌                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           신규 장비 그룹                 │
├─────────────────────────────────────────┤
│ 검사 결과: DB (PostgreSQL?) ✅           │
│ AI 추론: DB 저장 ✅                      │
│ 이미지: MinIO/NAS? ✅                    │
│ 통합: 가능 ✅                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         목표: Edge MLOps                │
├─────────────────────────────────────────┤
│ 모든 데이터: PostgreSQL 통합 ✅          │
│ MLOps: MLflow, 학습 관리 ✅              │
│ 통합 UI: Next.js ✅                      │
│ AI API: FastAPI ✅                       │
└─────────────────────────────────────────┘
```

---

## 2. 3-Track 병행 전략

### 🎯 전략: "독립 → 신규 통합 → 레거시 통합"

```yaml
Track 1: 독립 모듈 (가장 빠름)
  대상: DB 불필요한 기능
  기간: Week 1-8
  장점:
    - 양산 영향 없음
    - 즉시 가치 제공
    - 레거시/신규 무관
  기능:
    ✅ 이미지 합성 (GAN)
    ✅ 이미지 검색 (벡터)
    ✅ 모델 학습 도구

Track 2: 신규 장비 통합 (중간 속도)
  대상: 신규 장비 그룹만
  기간: Week 9-14
  장점:
    - DB 이미 있음
    - 통합 용이
    - 검증 후 확장
  기능:
    ✅ AI 추론 실행 (신규 장비만)
    ✅ 추론 결과 분석 (신규 장비만)
    ✅ 대시보드 (신규 장비만)

Track 3: 레거시 장비 통합 (느림)
  대상: 레거시 장비 그룹
  기간: Week 15-24 (3개월 이후)
  작업:
    1. 데이터 정의서 완성
    2. 파일 → DB 마이그레이션
    3. 어댑터 개발
    4. 점진적 전환
  기능:
    ⚠️ 레거시 데이터 통합
    ⚠️ 통합 대시보드
```

---

## 3. 개발 우선순위

### Phase 0: 기반 구축 (Week 1-2)

```yaml
인프라:
  - Docker Compose
  - PostgreSQL (신규 장비 DB 활용)
  - Redis
  - MinIO

Frontend:
  - Next.js 초기화
  - 기본 레이아웃
  - 로그인

Backend:
  - FastAPI 초기화
  - DB 연결 (신규 장비 DB)

배포: ✅ 기본 프레임
```

---

### Phase 1: 독립 모듈 #1 - 이미지 합성 (Week 3-4)

```yaml
목표: GAN 이미지 합성

특징:
  ✅ 레거시/신규 무관
  ✅ DB 불필요
  ✅ FastAPI 단독
  ✅ 즉시 사용 가능

기능:
  - 불량 유형 선택
  - 이미지 생성 (GAN)
  - MinIO 저장
  - 다운로드

사용자:
  - AI 팀
  - 데이터 증강 필요한 모든 팀

배포: ✅ 전체 사이트
가치: ✅ 학습 데이터 확보

코드:
  Frontend: Next.js UI
  Backend: FastAPI + GAN
  저장소: MinIO
```

**화면:**
```typescript
// app/(dashboard)/image-synthesis/page.tsx
export default function ImageSynthesisPage() {
  return (
    <div>
      <h1>◈ 이미지 합성 (GAN)</h1>
      
      <Card>
        <h3>불량 유형 선택</h3>
        <Select>
          <option>스크래치</option>
          <option>보이드</option>
          <option>쇼트</option>
        </Select>
        
        <Input type="number" placeholder="생성 개수" />
        
        <Button>생성 시작</Button>
      </Card>
      
      <ImageGrid images={generatedImages} />
    </div>
  );
}
```

---

### Phase 2: 독립 모듈 #2 - 이미지 검색 (Week 5-6)

```yaml
목표: 벡터 기반 유사 이미지 검색

특징:
  ✅ 레거시/신규 무관
  ✅ Qdrant만 사용
  ✅ 즉시 사용 가능

기능:
  - 이미지 업로드
  - 유사 이미지 검색
  - 과거 불량 사례 조회

사용자:
  - 품질 팀
  - 검사원
  - 엔지니어

배포: ✅ 전체 사이트
가치: ✅ 불량 원인 분석
```

---

### Phase 3: 독립 모듈 #3 - 모델 학습 (Week 7-8)

```yaml
목표: AI 모델 학습 도구

특징:
  ✅ MLflow 연동
  ✅ 독립 실행
  ✅ 즉시 사용

기능:
  - 데이터셋 업로드
  - 하이퍼파라미터 설정
  - 학습 실행
  - 실험 관리
  - 모델 성능 비교

사용자:
  - AI 팀 (당신)
  - 모델 개발자

배포: ✅ 전체 사이트
가치: ✅ 모델 개발 가속
```

---

### Phase 4: 신규 장비 통합 준비 (Week 9-10)

```yaml
목표: 신규 장비 DB 분석 및 통합 설계

작업:
  1. 신규 장비 DB 스키마 분석
     - 테이블 구조 파악
     - 데이터 흐름 분석
     - API 인터페이스 확인
  
  2. Edge MLOps DB 설계
     - 기존 스키마 확장
     - 추가 테이블 설계
     - 통합 뷰 생성
  
  3. 데이터 마이그레이션 계획
     - 신규 → MLOps DB
     - 동기화 전략
     - 롤백 계획
  
  4. 통합 API 설계
     - FastAPI 엔드포인트
     - 데이터 모델 (Pydantic)

배포: ⚠️ 준비만 (배포 안 함)

결과물:
  - DB 스키마 문서
  - 마이그레이션 스크립트
  - API 명세서
```

---

### Phase 5: 신규 장비 - AI 추론 통합 (Week 11-12)

```yaml
목표: 신규 장비만 MLOps 통합

데이터 흐름:
  [신규 검사 장비]
    ↓ 검사 결과 (JSON)
  [신규 C# WinForm]
    ↓ INSERT
  [PostgreSQL - 신규 장비 테이블]
    ↑ SELECT (추론 대상)
  [FastAPI - AI 추론]
    ↓ UPDATE (추론 결과)
  [PostgreSQL - 추론 결과 테이블]
    ↑ SELECT
  [Next.js - 추론 실행 UI]

기능:
  - LOT/번들 선택 (신규 장비만)
  - AI 추론 실행
  - 실시간 진행 상황
  - 결과 조회

제약:
  ⚠️ 신규 장비만 지원
  ❌ 레거시는 아직 안 됨

배포: ✅ AITECH (신규 장비만)
가치: ✅ 신규 장비 MLOps 적용

코드:
  Next.js:
    - 추론 실행 UI
    - 신규 장비 LOT만 표시
  
  FastAPI:
    - 신규 장비 DB 조회
    - AI 추론 실행
    - 결과 저장
```

**API 구조:**
```python
# app/api/v1/inference.py
@router.post("/inference")
async def execute_inference(request: InferenceRequest):
    """AI 추론 실행 (신규 장비만)"""
    
    # 1. 신규 장비 DB에서 검사 데이터 조회
    query = """
        SELECT * FROM new_equipment_inspections 
        WHERE lot_id = %s AND bundle_id = %s
    """
    inspection_data = await db.fetch_all(query, (lot_id, bundle_id))
    
    # 2. 이미지 로드
    images = await load_images_from_minio(inspection_data)
    
    # 3. AI 추론
    with torch.no_grad():
        results = model.predict(images)
    
    # 4. 결과 저장
    await save_inference_results(results)
    
    return {"status": "completed", "results": results}
```

---

### Phase 6: 신규 장비 - 결과 분석 (Week 13-14)

```yaml
목표: 신규 장비 추론 결과 분석

기능:
  - 추론 결과 조회 (신규 장비만)
  - 통계 대시보드
  - 불량률 트렌드
  - 상세 결과 뷰어

제약:
  ⚠️ 신규 장비 데이터만
  
배포: ✅ AITECH, DME (신규 장비 사이트)
가치: ✅ 데이터 기반 의사결정

3개월 마일스톤 완료! 🎉
```

---

### Phase 7+: 레거시 통합 (Week 15-24, 3개월 이후)

```yaml
목표: 레거시 장비 통합

복잡도: 🔴 높음

작업:
  1. 데이터 정의서 완성 (Week 15-16)
     현재: 일부만 작성됨
     필요:
       - 파일 형식 정의 (JSON? CSV? XML?)
       - 데이터 스키마 확정
       - 필드 매핑 정의
       - 샘플 데이터 수집
  
  2. 파일 파서 개발 (Week 17-18)
     - 파일 형식별 파서
     - 데이터 검증
     - 에러 핸들링
     - 배치 처리
  
  3. DB 마이그레이션 (Week 19-20)
     - 파일 → DB 변환
     - 히스토리 데이터 이관
     - 데이터 정합성 검증
  
  4. 어댑터 개발 (Week 21-22)
     - 레거시 C# ↔ Edge MLOps
     - 데이터 동기화
     - 실시간 연동
  
  5. 통합 테스트 (Week 23-24)
     - 레거시 + 신규 통합
     - 전체 대시보드
     - 통합 리포트

결과:
  ✅ 레거시 + 신규 완전 통합
  ✅ 통합 대시보드
  ✅ MLOps 전체 적용
```

---

## 4. 통합 로드맵

### 📅 전체 타임라인 (6개월)

```
Week 1-2:   [████░░░░] Phase 0: 기반 구축
            배포: 기본 프레임

Week 3-4:   [████░░░░] Phase 1: 이미지 합성
            배포: ✅ 전체
            사용: ✅ 즉시 가능 (레거시/신규 무관)

Week 5-6:   [████░░░░] Phase 2: 이미지 검색
            배포: ✅ 전체
            사용: ✅ 즉시 가능 (레거시/신규 무관)

Week 7-8:   [████░░░░] Phase 3: 모델 학습
            배포: ✅ 전체
            사용: ✅ AI 팀 활용 (레거시/신규 무관)

Week 9-10:  [████░░░░] Phase 4: 신규 장비 준비
            배포: 준비만

Week 11-12: [████░░░░] Phase 5: 신규 AI 추론
            배포: ✅ 신규 장비만
            사용: ✅ 신규 장비 MLOps 시작 🚀

Week 13-14: [████░░░░] Phase 6: 신규 결과 분석
            배포: ✅ 신규 장비만
            사용: ✅ 신규 장비 완전 통합 🎉

------- 3개월 마일스톤 -------

Week 15-16: [████░░░░] Phase 7: 레거시 정의서
Week 17-18: [████░░░░] Phase 8: 파일 파서
Week 19-20: [████░░░░] Phase 9: DB 마이그레이션
Week 21-22: [████░░░░] Phase 10: 어댑터 개발
Week 23-24: [████░░░░] Phase 11: 통합 완료 🎊
```

---

## 5. 데이터 아키텍처

### 5.1 3-Layer 데이터 구조

```
┌─────────────────────────────────────────┐
│      Layer 1: 독립 모듈 데이터           │
├─────────────────────────────────────────┤
│ - MinIO: 합성 이미지, 검색 이미지        │
│ - Qdrant: 벡터 인덱스                   │
│ - MLflow: 학습 실험, 모델                │
│                                         │
│ 특징: 레거시/신규 무관, 독립 실행        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Layer 2: 신규 장비 데이터           │
├─────────────────────────────────────────┤
│ PostgreSQL:                             │
│ - new_equipment_inspections             │
│ - new_equipment_inference_results       │
│ - new_equipment_images (메타데이터)     │
│                                         │
│ 특징: DB 통합 완료, MLOps 적용 가능      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Layer 3: 레거시 장비 데이터         │
├─────────────────────────────────────────┤
│ 현재:                                   │
│ - 파일 기반 (JSON/CSV/XML?)             │
│ - 데이터 정의서 불완전                   │
│                                         │
│ 목표 (Phase 7+):                        │
│ PostgreSQL:                             │
│ - legacy_equipment_inspections          │
│ - legacy_equipment_inference_results    │
│                                         │
│ 특징: 마이그레이션 필요, 복잡도 높음     │
└─────────────────────────────────────────┘
```

### 5.2 DB 스키마 (신규 장비 중심)

```sql
-- 신규 장비 검사 데이터 (기존 테이블 활용)
CREATE TABLE new_equipment_inspections (
    id SERIAL PRIMARY KEY,
    lot_id VARCHAR(50) NOT NULL,
    bundle_id VARCHAR(50) NOT NULL,
    equipment_id VARCHAR(50),
    inspection_time TIMESTAMP,
    raw_data JSONB,  -- 검사 장비 원본 데이터
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI 추론 요청
CREATE TABLE inference_requests (
    id SERIAL PRIMARY KEY,
    lot_id VARCHAR(50),
    bundle_id VARCHAR(50),
    equipment_type VARCHAR(20),  -- 'NEW' or 'LEGACY'
    status VARCHAR(20),  -- 'pending', 'processing', 'completed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI 추론 결과
CREATE TABLE inference_results (
    id SERIAL PRIMARY KEY,
    inference_request_id INTEGER REFERENCES inference_requests(id),
    image_id VARCHAR(100),
    decision VARCHAR(10),  -- 'OK', 'NG', 'UNK'
    confidence FLOAT,
    defect_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 통합 뷰 (신규만, 나중에 레거시 추가)
CREATE VIEW unified_inspections AS
SELECT 
    'NEW' as equipment_type,
    lot_id,
    bundle_id,
    inspection_time,
    raw_data
FROM new_equipment_inspections
-- 나중에 UNION ALL legacy_equipment_inspections
;
```

---

## 6. 리스크 관리

### 6.1 레거시 통합 리스크 (높음 🔴)

```yaml
리스크 1: 데이터 정의서 불완전
  현재: 일부만 작성
  문제:
    - 파일 형식 불명확
    - 필드 의미 모호
    - 샘플 데이터 부족
  
  대응:
    - Week 15-16에 집중 작업
    - 현장 담당자 인터뷰
    - 실제 파일 수집 및 분석
    - 역공학 (파일 → 스키마)

리스크 2: 파일 형식 다양성
  문제:
    - JSON? CSV? XML? 혼재?
    - 장비별로 다를 수 있음
    - 버전별 차이
  
  대응:
    - 범용 파서 개발
    - 형식별 어댑터 패턴
    - 변환 로직 모듈화

리스크 3: 히스토리 데이터 품질
  문제:
    - 과거 데이터 손실
    - 일관성 없음
    - 결측값 많음
  
  대응:
    - 데이터 정제 파이프라인
    - 검증 로직 강화
    - 불완전 데이터 플래그
```

### 6.2 신규 장비 통합 리스크 (중간 🟡)

```yaml
리스크 1: DB 스키마 변경
  문제:
    - 기존 C# 시스템도 사용 중
    - 스키마 변경 시 영향
  
  대응:
    - 읽기만 수행 (변경 최소화)
    - 뷰 활용 (원본 테이블 보호)
    - 신규 테이블만 추가

리스크 2: 성능 이슈
  문제:
    - 동일 DB에 부하 증가
    - 쿼리 느려질 수 있음
  
  대응:
    - 인덱스 최적화
    - 읽기 전용 레플리카
    - 캐싱 (Redis)
```

### 6.3 독립 모듈 리스크 (낮음 🟢)

```yaml
리스크: 거의 없음
  이유:
    - 양산 시스템 독립
    - 롤백 쉬움
    - 영향 범위 제한
```

---

## 7. 3개월 후 결과

### ✅ 완성된 것

```yaml
독립 모듈 (전체 사용 가능):
  ✅ 이미지 합성 (GAN)
  ✅ 이미지 검색 (벡터)
  ✅ 모델 학습 도구

신규 장비 통합 (신규 장비만):
  ✅ AI 추론 실행
  ✅ 추론 결과 분석
  ✅ 대시보드 (신규만)

가치:
  ✅ 독립 모듈: 즉시 활용
  ✅ 신규 장비: MLOps 적용
  ✅ 데이터 축적 시작
```

### ⚠️ 진행 중

```yaml
레거시 장비 통합:
  ⚠️ 데이터 정의서 작업 중
  ⚠️ 파일 파싱 개발 중
  ⚠️ DB 마이그레이션 준비 중

통합 대시보드:
  ⚠️ 신규만 지원 (레거시 추후)
```

### 📅 추가 3개월 필요

```yaml
+3개월 (Week 15-24):
  목표: 레거시 완전 통합
  
  결과:
    ✅ 레거시 + 신규 통합
    ✅ 통합 대시보드
    ✅ 전체 MLOps 적용
```

---

## 8. 최종 권장 전략

### 🎯 현실적 계획

```yaml
3개월 계약:
  목표:
    ✅ 독립 모듈 전체
    ✅ 신규 장비 MLOps 통합
    ⚠️ 레거시는 준비만
  
  가치:
    - 즉시 사용 가능한 도구들
    - 신규 장비 혁신
    - 레거시 통합 계획 수립

+3개월 확장 (권장):
  목표:
    ✅ 레거시 장비 통합
    ✅ 완전 통합 대시보드
    ✅ MLOps 전체 적용
  
  가치:
    - 전체 시스템 통합
    - 데이터 기반 운영
```

### 💡 클라이언트 제안

```
"3개월 계획:

Phase 1 (Week 1-8):
  - 독립 모듈 개발 (이미지 합성, 검색, 학습)
  → 모든 팀 즉시 활용 가능

Phase 2 (Week 9-14):
  - 신규 장비 MLOps 통합
  → 신규 장비 AI 적용 완료

결과:
  ✅ 즉시 사용 가능한 AI 도구들
  ✅ 신규 장비 MLOps 혁신
  ⚠️ 레거시는 별도 계약 필요

권장:
  3개월 후 추가 3개월 계약으로
  레거시 장비 완전 통합"
```

---

## 9. 결론

### ✅ 3개월 가능 (조건부)

**조건:**
- ✅ 독립 모듈만 완성
- ✅ 신규 장비만 통합
- ⚠️ 레거시는 추후

**가치:**
- ✅ 즉시 ROI (독립 모듈)
- ✅ 신규 장비 혁신
- ✅ 레거시 통합 준비

### 📊 현실적 일정

```
3개월: 독립 + 신규 통합
+3개월: 레거시 통합
총 6개월: 완전 통합

또는

3개월: MVP (독립 + 신규)
이후: 점진적 확장
```

### 💡 한 줄 요약

> **"3개월로 독립 모듈 + 신규 장비 통합, 레거시는 추가 3개월 - 현실적이고 안전한 계획!"** 🎯

---

**문서 버전**: 3.0  
**작성일**: 2025-01-07  
**복잡도**: 🔴 매우 높음  
**권장**: 3개월 + 3개월 단계적 접근
