import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Tooltip } from './Tooltip'
import { MaskedIcon } from './MaskedIcon'
import sidebarOpenIcon from '../assets/sidebar-open.png'
import sidebarCloseIcon from '../assets/sidebar-close.png'
import themeIcon from '../assets/theme-icon.png'
import type { Theme } from '../theme'

type SidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
  isMobile?: boolean
  mobileOpen?: boolean
  onMobileClose?: () => void
  theme?: Theme
  onToggleTheme?: () => void
  onSignOut?: () => void
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  isMobile = false,
  mobileOpen = false,
  onMobileClose,
  theme,
  onToggleTheme,
  onSignOut,
}: SidebarProps) {
  const showFooter = Boolean(onToggleTheme || onSignOut)
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const showLabels = isMobile ? true : !collapsed

  useEffect(() => {
    if (!mobileOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onMobileClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen, onMobileClose])

  return (
    <>
      {isMobile && mobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        className={[
          'app-sidebar',
          !isMobile && collapsed ? 'is-collapsed' : '',
          isMobile && mobileOpen ? 'is-mobile-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="sidebar-top">
          {!isMobile ? (
            <Tooltip
              label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              placement="right"
            >
              <button
                type="button"
                className="sidebar-toggle sidebar-toggle-desktop"
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
          ) : null}

          {isMobile ? (
            <button
              type="button"
              className="sidebar-toggle sidebar-toggle-mobile"
              onClick={onMobileClose}
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
          ) : null}
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          <SidebarItem
            showLabels={showLabels}
            to="/calendar"
            label="Calendar"
            icon={<CalendarNavIcon />}
            onNavigate={isMobile ? onMobileClose : undefined}
          />
          <SidebarItem
            showLabels={showLabels}
            to="/schedule"
            label="Schedule"
            icon={<ScheduleNavIcon />}
            onNavigate={isMobile ? onMobileClose : undefined}
          />
          <SidebarItem
            showLabels={showLabels}
            to="/backlog"
            label="Backlog"
            icon={<BacklogNavIcon />}
            onNavigate={isMobile ? onMobileClose : undefined}
          />
        </nav>

        {showFooter ? (
          <div className="sidebar-footer">
            {onToggleTheme ? (
              <SidebarAction
                showLabels={showLabels}
                label={`Switch to ${nextTheme} mode`}
                onClick={onToggleTheme}
                className="sidebar-theme-btn"
                icon={<MaskedIcon src={themeIcon} className="sidebar-action-icon" />}
              >
                {nextTheme === 'light' ? 'Light mode' : 'Dark mode'}
              </SidebarAction>
            ) : null}

            {onSignOut ? (
              <SidebarAction
                showLabels={showLabels}
                label="Sign out"
                onClick={() => {
                  if (isMobile) onMobileClose?.()
                  onSignOut()
                }}
                className="sidebar-sign-out-btn"
                icon={<SignOutIcon />}
              >
                Sign out
              </SidebarAction>
            ) : null}
          </div>
        ) : null}
      </aside>
    </>
  )
}

type SidebarItemProps = {
  showLabels: boolean
  to: string
  label: string
  icon: ReactNode
  onNavigate?: () => void
}

function SidebarItem({ showLabels, to, label, icon, onNavigate }: SidebarItemProps) {
  const link = (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar-item ${isActive ? 'is-active' : ''}`
      }
      aria-label={label}
      onClick={onNavigate}
    >
      <span className="sidebar-item-icon" aria-hidden="true">
        {icon}
      </span>
      {showLabels ? <span className="sidebar-item-label">{label}</span> : null}
    </NavLink>
  )

  if (showLabels) return link

  return (
    <Tooltip label={label} placement="right">
      {link}
    </Tooltip>
  )
}

type SidebarActionProps = {
  showLabels: boolean
  label: string
  onClick: () => void
  className?: string
  icon: ReactNode
  children: ReactNode
}

function SidebarAction({
  showLabels,
  label,
  onClick,
  className = '',
  icon,
  children,
}: SidebarActionProps) {
  const button = (
    <button
      type="button"
      className={`sidebar-item sidebar-action ${className}`.trim()}
      onClick={onClick}
      aria-label={label}
    >
      <span className="sidebar-item-icon" aria-hidden="true">
        {icon}
      </span>
      {showLabels ? <span className="sidebar-item-label">{children}</span> : null}
    </button>
  )

  if (showLabels) return button

  return (
    <Tooltip label={label} placement="right">
      {button}
    </Tooltip>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="sidebar-toggle-icon" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7 7 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
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
      <rect
        x="3"
        y="3.5"
        width="18"
        height="4.5"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M5 8v9.5A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5V8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path
        d="M10 13h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="sidebar-action-icon" aria-hidden="true">
      <path
        d="M10 4H7.5A2.5 2.5 0 0 0 5 6.5v11A2.5 2.5 0 0 0 7.5 20H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 8.5 17.5 12 14 15.5M9.5 12h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
