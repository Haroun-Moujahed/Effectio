export function getProgressColor(percent: number): string {
  if (percent < 20) return 'var(--progress-red)'
  if (percent < 40) return 'var(--progress-orange)'
  if (percent < 60) return 'var(--progress-yellow)'
  if (percent < 80) return 'var(--progress-green-soft)'
  return 'var(--progress-green)'
}
