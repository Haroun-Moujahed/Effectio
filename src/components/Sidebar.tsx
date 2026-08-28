import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Tooltip } from './Tooltip'
import { MaskedIcon } from './MaskedIcon'
import sidebarOpenIcon from '../assets/sidebar-open.png'
import sidebarCloseIcon from '../assets/sidebar-close.png'

type SidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-top">
        <Tooltip
          label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          placement="right"
        >
          <button
            type="button"
            className="sidebar-toggle"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <MaskedIcon
              src={collapsed ? sidebarOpenIcon : sidebarCloseIcon}
              className="sidebar-toggle-icon"
            />
          </button>
        </Tooltip>
      </div>

      <nav className="sidebar-nav" aria-label="Main">
        <SidebarItem
          collapsed={collapsed}
          to="/calendar"
          label="Calendar"
          icon={<CalendarNavIcon />}
        />
        <SidebarItem
          collapsed={collapsed}
          to="/schedule"
          label="Schedule"
          icon={<ScheduleNavIcon />}
        />
        <SidebarItem
          collapsed={collapsed}
          to="/backlog"
          label="Backlog"
          icon={<BacklogNavIcon />}
        />
      </nav>
    </aside>
  )
}

type SidebarItemProps = {
  collapsed: boolean
  to: string
  label: string
  icon: ReactNode
}

function SidebarItem({ collapsed, to, label, icon }: SidebarItemProps) {
  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-item ${isActive ? 'is-active' : ''}`
      }
      aria-label={label}
    >
      <span className="sidebar-item-icon" aria-hidden="true">
        {icon}
      </span>
      {!collapsed ? <span className="sidebar-item-label">{label}</span> : null}
    </NavLink>
  )

  if (!collapsed) return link

  return (
    <Tooltip label={label} placement="right">
      {link}
    </Tooltip>
  )
}

function CalendarNavIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="15"
        rx="2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M8 3.5v3M16 3.5v3M3.5 9.5h17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  )
}

function ScheduleNavIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M12 7v5l3 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BacklogNavIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 7h11M8 12h11M8 17h11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M5 7h.01M5 12h.01M5 17h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
