interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-text-primary mb-2">{title}</h2>
      {subtitle && <p className="text-text-secondary">{subtitle}</p>}
    </div>
  );
}
