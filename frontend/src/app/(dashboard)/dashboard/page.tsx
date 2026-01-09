import { PageHeader } from '@/components/layout/PageHeader';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="운영 대시보드"
        subtitle="PCB 검사 AI 시스템의 실시간 운영 현황을 모니터링합니다"
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-accent-primary" />
            <span className="text-2xl font-bold text-accent-primary">0</span>
          </div>
          <h3 className="text-text-secondary text-sm">총 검사 수</h3>
        </div>

        <div className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-status-success" />
            <span className="text-2xl font-bold text-status-success">0</span>
          </div>
          <h3 className="text-text-secondary text-sm">정상 (OK)</h3>
        </div>

        <div className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="w-8 h-8 text-status-error" />
            <span className="text-2xl font-bold text-status-error">0</span>
          </div>
          <h3 className="text-text-secondary text-sm">불량 (NG)</h3>
        </div>

        <div className="bg-background-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-accent-primary" />
            <span className="text-2xl font-bold text-accent-primary">100%</span>
          </div>
          <h3 className="text-text-secondary text-sm">시스템 가동률</h3>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-background-card border border-border rounded-lg p-6">
        <h3 className="text-xl font-bold text-text-primary mb-4">최근 활동</h3>
        <div className="text-center py-12 text-text-muted">
          <p>아직 활동 내역이 없습니다</p>
        </div>
      </div>
    </>
  );
}
