import { MONTH_BACKGROUNDS } from '../assets/months'
import type { DayProgress } from '../types'
import {
  MONTHS,
  WEEKDAYS,
  formatMonthTitle,
  formatYearTitle,
  getCalendarDays,
  isSameDay,
  isSameMonth,
} from '../dates'
import { ProgressRing } from './ProgressRing'
import { Tooltip } from './Tooltip'
import { YearPicker } from './YearPicker'

export type CalendarMode = 'month' | 'year'

type CalendarGridProps = {
  mode: CalendarMode
  viewDate: Date
  selected: Date
  today: Date
  tasksOpen: boolean
  onSelect: (date: Date) => void
  onPrev: () => void
  onNext: () => void
  onOpenYearView: () => void
  onSelectMonth: (monthIndex: number) => void
  onSelectYear: (year: number) => void
  getProgress: (date: Date) => DayProgress
}

export function CalendarGrid({
  mode,
  viewDate,
  selected,
  today,
  tasksOpen,
  onSelect,
  onPrev,
  onNext,
  onOpenYearView,
  onSelectMonth,
  onSelectYear,
  getProgress,
}: CalendarGridProps) {
  const days = getCalendarDays(viewDate)
  const weekRows = days.length / 7
  const isYear = mode === 'year'

  return (
    <section className="calendar-card">
      <div className="month-nav">
        <Tooltip label={isYear ? 'Previous year' : 'Previous month'} placement="bottom">
          <button
            type="button"
            className="nav-btn"
            onClick={onPrev}
            aria-label={isYear ? 'Previous year' : 'Previous month'}
          >
            <Chevron direction="left" />
          </button>
        </Tooltip>

        {isYear ? (
          <YearPicker year={viewDate.getFullYear()} onSelectYear={onSelectYear} />
        ) : (
          <Tooltip label="Show year view" placement="bottom">
            <button
              type="button"
              className="calendar-title-btn"
              onClick={onOpenYearView}
              aria-label={`Open year view for ${formatYearTitle(viewDate)}`}
            >
              {formatMonthTitle(viewDate)}
            </button>
          </Tooltip>
        )}

        <Tooltip label={isYear ? 'Next year' : 'Next month'} placement="bottom">
          <button
            type="button"
            className="nav-btn"
            onClick={onNext}
            aria-label={isYear ? 'Next year' : 'Next month'}
          >
            <Chevron direction="right" />
          </button>
        </Tooltip>
      </div>

      {isYear ? (
        <div className="year-grid">
          {MONTHS.map((month, index) => {
            const monthDate = new Date(viewDate.getFullYear(), index, 1)
            const isCurrentMonth = isSameMonth(monthDate, today)
            const isViewMonth = isSameMonth(monthDate, selected)

            return (
              <button
                key={month}
                type="button"
                className={[
                  'year-month-cell',
                  isCurrentMonth ? 'is-current' : '',
                  isViewMonth ? 'is-selected' : '',
                ].join(' ')}
                onClick={() => onSelectMonth(index)}
                aria-label={`Open ${month} ${viewDate.getFullYear()}`}
              >
                <img
                  className="year-month-art"
                  src={MONTH_BACKGROUNDS[index]}
                  alt=""
                  draggable={false}
                />
                <span className="year-month-name">{month}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <>
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
        </>
      )}
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
