/**
 * 메뉴 구조 정의
 * 기존 frontend-shell/index.html의 메뉴 구조를 그대로 반영
 * 아이콘: lucide-react 아이콘 이름
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
    icon: 'LayoutDashboard',
  },
  {
    id: 'products',
    label: '제품기준정보관리',
    icon: 'Package',
    children: [
      {
        id: 'customer-management',
        label: '고객사관리',
        href: '/products/customers',
        icon: 'Users',
      },
      {
        id: 'product-info',
        label: '제품정보관리',
        href: '/products/info',
        icon: 'Box',
      },
      {
        id: 'area-defect-class',
        label: 'Area별 불량명',
        href: '/products/defect-class',
        icon: 'Grid3X3',
      },
      {
        id: 'defect-type-detail',
        label: '불량유형상세관리',
        href: '/products/defect-types',
        icon: 'List',
      },
    ],
  },
  {
    id: 'specs',
    label: 'AI 판정 기준 관리',
    icon: 'Settings',
    children: [
      {
        id: 'customer-spec',
        label: '고객사 Spec 관리',
        href: '/customer-spec',
        icon: 'FileText',
      },
      {
        id: 'spec-management',
        label: 'AI 판정 기준 관리',
        href: '/specs/management',
        icon: 'SlidersHorizontal',
      },
      {
        id: 'measurement-params',
        label: 'Measurement Parameter 관리',
        href: '/specs/measurement-params',
        icon: 'Ruler',
      },
    ],
  },
  {
    id: 'operation',
    label: 'AI 운영 관리',
    icon: 'Cpu',
    children: [
      {
        id: 'ai-inference',
        label: 'AI 추론 실행',
        href: '/inference/execute',
        icon: 'Zap',
      },
    ],
  },
  {
    id: 'analysis',
    label: 'AI 추론 결과 분석',
    icon: 'TrendingUp',
    children: [
      {
        id: 'metrics-report',
        label: '지표 현황 Report',
        href: '/analysis/metrics',
        icon: 'BarChart3',
      },
      {
        id: 'inference-status',
        label: 'AI 추론 현황 조회',
        href: '/analysis/status',
        icon: 'Database',
      },
      {
        id: 'detail-analysis',
        label: 'AI 추론 결과 상세 분석',
        href: '/analysis/detail',
        icon: 'LineChart',
      },
    ],
  },
  {
    id: 'learning',
    label: 'AI 학습 관리',
    icon: 'Brain',
    children: [
      {
        id: 'dataset-management',
        label: '학습데이터 조회 및 품질관리',
        href: '/training/dataset',
        icon: 'Database',
      },
      {
        id: 'learning-data',
        label: '학습 데이터 추가 및 정합성 검증',
        href: '/training/data-validation',
        icon: 'Upload',
      },
      {
        id: 'model-training',
        label: '모델 학습 및 결과 분석',
        href: '/training/model-training',
        icon: 'Play',
      },
      {
        id: 'image-search',
        label: '이미지 검색',
        href: '/training/search',
        icon: 'Search',
      },
      {
        id: 'defect-extraction',
        label: '불량 이미지 추출',
        href: '/training/extraction',
        icon: 'Scissors',
      },
      {
        id: 'defect-synthesis',
        label: '불량 이미지 합성',
        href: '/training/synthesis',
        icon: 'Image',
      },
      {
        id: 'image-slicer',
        label: '이미지 슬라이서',
        href: '/training/slicer',
        icon: 'Grid3X3',
      },
    ],
  },
  {
    id: 'system',
    label: '설정 관리',
    icon: 'Server',
    children: [
      {
        id: 'monitoring',
        label: '시스템 모니터링',
        href: '/system/monitoring',
        icon: 'Activity',
      },
      {
        id: 'equipment-settings',
        label: '검사 장비 환경 설정',
        href: '/system/equipment',
        icon: 'HardDrive',
      },
      {
        id: 'ai-server-settings',
        label: 'AI 추론 서버 설정',
        href: '/system/ai-server',
        icon: 'Cpu',
      },
      {
        id: 'user-settings',
        label: '사용자 환경 설정',
        href: '/system/settings',
        icon: 'Settings',
      },
    ],
  },
];
