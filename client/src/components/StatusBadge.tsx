interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'idle';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <div className={`status-badge status-${status}`}>
      <span className={`dot dot-${status}`} />
      {label}
    </div>
  );
}
