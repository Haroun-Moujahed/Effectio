import type { DayProgress } from '../types'
import {
  WEEKDAYS,
  formatMonthTitle,
  getCalendarDays,
  isSameDay,
  isSameMonth,
} from '../dates'
import { ProgressRing } from './ProgressRing'

type CalendarGridProps = {
  viewDate: Date
  selected: Date
  today: Date
  tasksOpen: boolean
  onSelect: (date: Date) => void
  onPrevMonth: () => void
  onNextMonth: () => void
  getProgress: (date: Date) => DayProgress
}

export function CalendarGrid({
  viewDate,
  selected,
  today,
  tasksOpen,
  onSelect,
  onPrevMonth,
  onNextMonth,
  getProgress,
}: CalendarGridProps) {
  const days = getCalendarDays(viewDate)
  const weekRows = days.length / 7

  return (
    <section className="calendar-card">
      <div className="month-nav">
        <button
          type="button"
          className="nav-btn"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <Chevron direction="left" />
        </button>
        <h2>{formatMonthTitle(viewDate)}</h2>
        <button
          type="button"
          className="nav-btn"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div className="weekday-row">
        {WEEKDAYS.map((day) => (
          <div key={day.full} className="weekday">
            <span className="weekday-full">{day.full}</span>
            <span className="weekday-short">{day.short}</span>
          </div>
        ))}
      </div>

      <div
        className="day-grid"
        style={{ ['--week-rows' as string]: String(weekRows) }}
      >
        {days.map((date) => {
          const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          const progress = getProgress(date)
          const outside = !isSameMonth(date, viewDate)
          const selectedDay = tasksOpen && isSameDay(date, selected)
          const isToday = isSameDay(date, today)

          return (
            <button
              key={key}
              type="button"
              className={[
                'day-cell',
                outside ? 'is-outside' : '',
                selectedDay ? 'is-selected' : '',
                isToday ? 'is-today' : '',
              ].join(' ')}
              onClick={() => onSelect(date)}
              aria-label={`${date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}${
                progress.total
                  ? `, ${progress.percent}% complete`
                  : ', no tasks'
              }`}
              aria-pressed={selectedDay}
            >
              <span className="day-number">
                {String(date.getDate()).padStart(2, '0')}
              </span>
              <ProgressRing
                percent={progress.percent}
                hasTasks={progress.total > 0}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {direction === 'left' ? (
        <path
          d="M14.5 6.5 9 12l5.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M9.5 6.5 15 12l-5.5 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
