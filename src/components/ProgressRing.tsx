import { getProgressColor } from '../progressColor'

type ProgressRingProps = {
  percent: number
  hasTasks: boolean
}

const RADIUS = 15.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ProgressRing({ percent, hasTasks }: ProgressRingProps) {
  if (!hasTasks) return null

  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE
  const color = getProgressColor(percent)

  return (
    <div className="progress-ring">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle className="progress-track" cx="18" cy="18" r={RADIUS} />
        <circle
          className="progress-value"
          cx="18"
          cy="18"
          r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="progress-label">{percent}%</span>
    </div>
  )
}
