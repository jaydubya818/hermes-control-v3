export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  return (
    <div className="loading-spinner" style={{ width: dim, height: dim }} />
  );
}
