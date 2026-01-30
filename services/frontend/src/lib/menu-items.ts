/**
 * 메뉴 구조 정의
 * 기존 frontend-shell/index.html의 메뉴 구조를 그대로 반영
 */

export interface MenuItem {
  id: string;
  label: string;
  href?: string;
  icon?: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '메인 대시보드',
    href: '/dashboard',
    icon: '◯',
  },
  {
    id: 'products',
    label: '제품 정보 관리',
    icon: '◯',
    children: [
      {
        id: 'product-info',
        label: '제품_고객_불량 유형 정보',
        href: '/products',
        icon: '▪',
      },
    ],
  },
  {
    id: 'specs',
    label: 'AI 판정 기준 관리',
    icon: '◯',
    children: [
      {
        id: 'customer-spec',
        label: '고객사 Spec 관리',
        href: '/customer-spec',
        icon: '▪',
      },
      {
        id: 'spec-search',
        label: '고객 Spec 관리 (검색)',
        href: '/specs/search',
        icon: '▪',
      },
      {
        id: 'spec-management',
        label: 'AI 판정 기준 관리',
        href: '/specs/management',
        icon: '▪',
      },
      {
        id: 'measurement-params',
        label: 'Measurement Parameter 기준정보 관리',
        href: '/specs/measurement-params',
        icon: '▪',
      },
    ],
  },
  {
    id: 'operation',
    label: 'AI 운영 관리',
    icon: '◯',
    children: [
      {
        id: 'ai-inference',
        label: 'AI 추론 실행',
        href: '/inference/execute',
        icon: '▪',
      },
    ],
  },
  {
    id: 'analysis',
    label: 'AI 추론 결과 분석',
    icon: '◯',
    children: [
      {
        id: 'metrics-report',
        label: '지표 현황 Report',
        href: '/analysis/metrics',
        icon: '▪',
      },
      {
        id: 'detail-analysis',
        label: 'AI 추론 결과 상세 분석',
        href: '/analysis/detail',
        icon: '▪',
      },
    ],
  },
  {
    id: 'learning',
    label: 'AI 학습 관리',
    icon: '◯',
    children: [
      {
        id: 'learning-data',
        label: '학습 데이터 추가 및 정합성 검증',
        href: '/training/data-validation',
        icon: '▪',
      },
      {
        id: 'model-training',
        label: '모델 학습 및 결과 분석',
        href: '/training/model-training',
        icon: '▪',
      },
      {
        id: 'dataset-management',
        label: '학습 데이터셋 조회 및 관리',
        href: '/training/dataset',
        icon: '▪',
      },
      {
        id: 'image-search',
        label: '이미지 검색',
        href: '/training/search',
        icon: '◐',
      },
      {
        id: 'defect-extraction',
        label: '불량 이미지 추출',
        href: '/training/extraction',
        icon: '◈',
      },
      {
        id: 'defect-synthesis',
        label: '불량 이미지 합성',
        href: '/training/synthesis',
        icon: '◈',
      },
      {
        id: 'image-slicer',
        label: '이미지 슬라이서',
        href: '/training/slicer',
        icon: '▪',
      },
    ],
  },
  {
    id: 'system',
    label: '시스템 관리',
    icon: '◯',
    children: [
      {
        id: 'monitoring',
        label: '시스템 모니터링',
        href: '/system/monitoring',
        icon: '△',
      },
      {
        id: 'user-settings',
        label: '사용자 환경 설정',
        href: '/system/settings',
        icon: '⬟',
      },
    ],
  },
];
