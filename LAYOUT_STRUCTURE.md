# 레이아웃 구조 명세서

## 📐 기존 구조 (C:\Users\gogot\pcb_inspection_ai\frontend-shell\index.html)

### 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│  Header (고정, 전체 너비)                                │
│  ┌─────────────┬───────────────────────────────────┐   │
│  │ Logo + 제목  │  User Info + 로그아웃 버튼         │   │
│  └─────────────┴───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
┌──────────┬──────────────────────────────────────────────┐
│          │                                              │
│ Sidebar  │  Content Area (main)                         │
│          │                                              │
│ 접기/펴기│  ┌────────────────────────────────────────┐ │
│          │  │ Page Header                            │ │
│ - 로고   │  │ - 제목                                  │ │
│          │  │ - 부제목                                │ │
│ - 메뉴   │  └────────────────────────────────────────┘ │
│   (계층) │                                              │
│          │  ┌────────────────────────────────────────┐ │
│          │  │                                        │ │
│          │  │  Module Content                        │ │
│          │  │  (동적 로드)                            │ │
│          │  │                                        │ │
│          │  └────────────────────────────────────────┘ │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 메뉴 구조

```
◯ 메인 대시보드

◯ 제품 정보 관리
  └─ 제품_고객_불량 유형 정보

◯ AI 판정 기준 관리
  ├─ 고객 Spec 관리 (검색)
  └─ AI 판정 기준 관리

◯ AI 운영 관리
  └─ AI 추론 실행

◯ AI 추론 결과 분석
  ├─ 지표 현황 Report
  └─ AI 추론 결과 상세 분석

◯ AI 학습 관리
  ├─ 학습 데이터 추가 및 정합성 검증
  ├─ 모델 학습 및 결과 분석
  ├─ 학습 데이터셋 조회 및 관리
  ├─ 이미지 검색
  ├─ 이미지 합성
  └─ 이미지 슬라이서

◯ 시스템 관리
  ├─ 시스템 모니터링
  └─ 사용자 환경 설정
```

---

## 🎯 Next.js 구현 계획

### 디렉토리 구조

```
frontend/src/
├── app/
│   ├── layout.tsx                      ← Root Layout (전체 구조)
│   ├── page.tsx                        ← 임시 랜딩 페이지
│   │
│   ├── (auth)/                         ← 인증 그룹 (레이아웃 없음)
│   │   └── login/
│   │       └── page.tsx                ← 로그인 페이지
│   │
│   └── (dashboard)/                    ← 대시보드 그룹 (공통 레이아웃)
│       ├── layout.tsx                  ← Dashboard Layout
│       │                                  (Header + Sidebar + Content)
│       │
│       ├── dashboard/                  ← 메인 대시보드
│       │   └── page.tsx
│       │
│       ├── products/                   ← 제품 정보 관리
│       │   └── page.tsx
│       │
│       ├── specs/                      ← AI 판정 기준 관리
│       │   ├── search/                 ← 고객 Spec 검색
│       │   │   └── page.tsx
│       │   └── management/             ← AI 판정 기준 관리
│       │       └── page.tsx
│       │
│       ├── inference/                  ← AI 운영 관리
│       │   ├── execute/                ← AI 추론 실행
│       │   │   └── page.tsx
│       │   └── results/                ← 추론 결과
│       │       └── page.tsx
│       │
│       ├── analysis/                   ← AI 추론 결과 분석
│       │   ├── metrics/                ← 지표 현황
│       │   │   └── page.tsx
│       │   └── detail/                 ← 상세 분석
│       │       └── page.tsx
│       │
│       ├── training/                   ← AI 학습 관리
│       │   ├── data/                   ← 학습 데이터
│       │   │   └── page.tsx
│       │   ├── model/                  ← 모델 학습
│       │   │   └── page.tsx
│       │   ├── dataset/                ← 데이터셋 관리
│       │   │   └── page.tsx
│       │   ├── search/                 ← 이미지 검색
│       │   │   └── page.tsx
│       │   ├── synthesis/              ← 이미지 합성
│       │   │   └── page.tsx
│       │   └── slicer/                 ← 이미지 슬라이서
│       │       └── page.tsx
│       │
│       └── system/                     ← 시스템 관리
│           ├── monitoring/             ← 시스템 모니터링
│           │   └── page.tsx
│           └── settings/               ← 사용자 설정
│               └── page.tsx
│
└── components/
    ├── layout/
    │   ├── Header.tsx                  ← 헤더 컴포넌트
    │   ├── Sidebar.tsx                 ← 사이드바 컴포넌트
    │   └── PageHeader.tsx              ← 페이지 헤더
    │
    └── ui/
        ├── Button.tsx
        ├── Card.tsx
        └── ...
```

---

## 🎨 컴포넌트 구조

### 1. Dashboard Layout
```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  return (
    <div className="main-container">
      <Header />                    {/* 상단 고정 헤더 */}
      <div className="main-layout">
        <Sidebar />                 {/* 좌측 사이드바 (접기/펴기) */}
        <main className="content-area">
          {children}                {/* 페이지 컨텐츠 */}
        </main>
      </div>
    </div>
  );
}
```

### 2. Header
```tsx
// components/layout/Header.tsx
export function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <Logo />
        <Title />
      </div>
      <div className="header-right">
        <UserInfo />
        <LogoutButton />
      </div>
    </header>
  );
}
```

### 3. Sidebar
```tsx
// components/layout/Sidebar.tsx
export function Sidebar() {
  return (
    <nav className="sidebar">
      <MenuToggle />
      <Logo />
      <NavMenu items={menuItems} />
    </nav>
  );
}
```

### 4. 메뉴 데이터
```typescript
// lib/menu-items.ts
export const menuItems = [
  {
    id: 'dashboard',
    label: '메인 대시보드',
    href: '/dashboard',
    icon: 'Dashboard',
  },
  {
    id: 'products',
    label: '제품 정보 관리',
    icon: 'Package',
    children: [
      {
        id: 'product-info',
        label: '제품_고객_불량 유형 정보',
        href: '/products',
      },
    ],
  },
  {
    id: 'specs',
    label: 'AI 판정 기준 관리',
    icon: 'Settings',
    children: [
      { id: 'spec-search', label: '고객 Spec 관리 (검색)', href: '/specs/search' },
      { id: 'spec-management', label: 'AI 판정 기준 관리', href: '/specs/management' },
    ],
  },
  // ... 나머지 메뉴
];
```

---

## 🔄 URL 매핑

| 기존 모듈 | Next.js URL | 파일 경로 |
|----------|-------------|-----------|
| dashboard | `/dashboard` | `app/(dashboard)/dashboard/page.tsx` |
| product-info | `/products` | `app/(dashboard)/products/page.tsx` |
| ai-spec | `/specs/search` | `app/(dashboard)/specs/search/page.tsx` |
| ai-judgment | `/specs/management` | `app/(dashboard)/specs/management/page.tsx` |
| ai-inference | `/inference/execute` | `app/(dashboard)/inference/execute/page.tsx` |
| metrics-report | `/analysis/metrics` | `app/(dashboard)/analysis/metrics/page.tsx` |
| detail-analysis | `/analysis/detail` | `app/(dashboard)/analysis/detail/page.tsx` |
| learning-data | `/training/data` | `app/(dashboard)/training/data/page.tsx` |
| model-training | `/training/model` | `app/(dashboard)/training/model/page.tsx` |
| dataset-management | `/training/dataset` | `app/(dashboard)/training/dataset/page.tsx` |
| image-search | `/training/search` | `app/(dashboard)/training/search/page.tsx` |
| image-synthesis | `/training/synthesis` | `app/(dashboard)/training/synthesis/page.tsx` |
| image-slicer | `/training/slicer` | `app/(dashboard)/training/slicer/page.tsx` |
| monitoring | `/system/monitoring` | `app/(dashboard)/system/monitoring/page.tsx` |
| user-settings | `/system/settings` | `app/(dashboard)/system/settings/page.tsx` |

---

## 📝 구현 우선순위

### Phase 0: 기본 레이아웃 (지금 할 것!)
- [ ] Dashboard Layout 구현
- [ ] Header 컴포넌트
- [ ] Sidebar 컴포넌트 (메뉴 포함)
- [ ] 로그인 페이지

### Phase 1: 핵심 페이지
- [ ] 메인 대시보드
- [ ] 이미지 합성
- [ ] 이미지 검색

### Phase 2: 관리 페이지
- [ ] 제품 정보 관리
- [ ] AI 판정 기준 관리

### Phase 3: 운영 페이지
- [ ] AI 추론 실행
- [ ] 추론 결과 분석

---

## 🎯 다음 작업

1. Dashboard Layout 생성
2. Header 컴포넌트 생성
3. Sidebar 컴포넌트 생성 (메뉴 구조 포함)
4. 메인 대시보드 페이지 생성

**준비되면 말씀해주세요!**
