import { useEffect, useId, useRef, useState } from 'react'
import {
  addMonths,
  dateKey,
  formatMonthTitle,
  getCalendarDays,
  isSameDay,
  isSameMonth,
  WEEKDAYS,
} from '../dates'

type AssignDateDialogProps = {
  open: boolean
  initialDate: Date
  onConfirm: (date: Date) => void
  onClose: () => void
}

export function AssignDateDialog({
  open,
  initialDate,
  onConfirm,
  onClose,
}: AssignDateDialogProps) {
  const titleId = useId()
  const confirmRef = useRef<HTMLButtonElement>(null)
  const [viewDate, setViewDate] = useState(() => new Date(initialDate))
  const [selected, setSelected] = useState(() => new Date(initialDate))

  useEffect(() => {
    if (!open) return
    setViewDate(new Date(initialDate))
    setSelected(new Date(initialDate))
  }, [open, initialDate])

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const days = getCalendarDays(viewDate)
  const weekRows = Math.ceil(days.length / 7)
  const today = new Date()

  return (
    <div
      className="assign-dialog-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="assign-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="assign-dialog-header">
          <h2 id={titleId}>Assign to day</h2>
          <button
            type="button"
            className="assign-dialog-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="assign-month-nav">
          <button
            type="button"
            className="nav-btn"
            onClick={() => setViewDate((current) => addMonths(current, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <p className="assign-month-title">{formatMonthTitle(viewDate)}</p>
          <button
            type="button"
            className="nav-btn"
            onClick={() => setViewDate((current) => addMonths(current, 1))}
            aria-label="Next month"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="assign-weekday-row">
          {WEEKDAYS.map((day) => (
            <span key={day.full}>{day.short}</span>
          ))}
        </div>

        <div
          className="assign-day-grid"
          style={{ ['--week-rows' as string]: String(weekRows) }}
        >
          {days.map((date) => {
            const outside = !isSameMonth(date, viewDate)
            const isSelected = isSameDay(date, selected)
            const isToday = isSameDay(date, today)

            return (
              <button
                key={dateKey(date)}
                type="button"
                className={[
                  'assign-day-cell',
                  outside ? 'is-outside' : '',
                  isSelected ? 'is-selected' : '',
                  isToday ? 'is-today' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setSelected(date)}
              >
                {String(date.getDate()).padStart(2, '0')}
              </button>
            )
          })}
        </div>

        <div className="assign-dialog-actions">
          <button
            type="button"
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            className="modal-btn modal-btn-primary"
            onClick={() => onConfirm(selected)}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  )
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.5 6.5 9 12l5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9.5 6.5 15 12l-5.5 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
