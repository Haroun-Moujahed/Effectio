import { getProgressColor } from '../progressColor'

type ProgressRingProps = {
  percent: number
  hasTasks: boolean
}

const RADIUS = 15.5
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ProgressRing({ percent, hasTasks }: ProgressRingProps) {
  if (!hasTasks) return null

  const complete = percent >= 100
  const offset = CIRCUMFERENCE - (Math.min(percent, 100) / 100) * CIRCUMFERENCE
  const color = getProgressColor(percent)

  return (
    <div className={`progress-ring ${complete ? 'is-complete' : ''}`}>
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
      {complete ? (
        <span className="progress-label progress-tick" aria-label="100% complete">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5 10.5 8.2 13.7 15 6.8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : (
        <span className="progress-label">{percent}%</span>
      )}
    </div>
  )
}
