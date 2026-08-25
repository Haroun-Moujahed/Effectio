import type { ReactNode } from 'react'
import { Tooltip } from './Tooltip'
import { MaskedIcon } from './MaskedIcon'
import type { AppView } from '../types'
import sidebarOpenIcon from '../assets/sidebar-open.png'
import sidebarCloseIcon from '../assets/sidebar-close.png'

type SidebarProps = {
  collapsed: boolean
  activeView: AppView
  onToggleCollapsed: () => void
  onSelectView: (view: AppView) => void
}

export function Sidebar({
  collapsed,
  activeView,
  onToggleCollapsed,
  onSelectView,
}: SidebarProps) {
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
          active={activeView === 'calendar'}
          label="Calendar"
          onClick={() => onSelectView('calendar')}
          icon={<CalendarNavIcon />}
        />
        <SidebarItem
          collapsed={collapsed}
          active={activeView === 'backlog'}
          label="Backlog"
          onClick={() => onSelectView('backlog')}
          icon={<BacklogNavIcon />}
        />
      </nav>
    </aside>
  )
}

type SidebarItemProps = {
  collapsed: boolean
  active: boolean
  label: string
  onClick: () => void
  icon: ReactNode
}

function SidebarItem({
  collapsed,
  active,
  label,
  onClick,
  icon,
}: SidebarItemProps) {
  const button = (
    <button
      type="button"
      className={`sidebar-item ${active ? 'is-active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      aria-label={label}
    >
      <span className="sidebar-item-icon" aria-hidden="true">
        {icon}
      </span>
      {!collapsed ? <span className="sidebar-item-label">{label}</span> : null}
    </button>
  )

  if (!collapsed) return button

  return (
    <Tooltip label={label} placement="right">
      {button}
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
  );
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
  );
}
