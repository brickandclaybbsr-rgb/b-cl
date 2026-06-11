export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-content-secondary">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
