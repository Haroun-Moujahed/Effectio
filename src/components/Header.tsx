import logo from '../assets/logo.png'
import themeIcon from '../assets/theme-icon.png'
import userIcon from '../assets/user-icon.png'
import type { Theme } from '../theme'
import { MaskedIcon } from './MaskedIcon'
import { Tooltip } from './Tooltip'

type HeaderProps = {
  theme: Theme
  onToggleTheme: () => void
  userName?: string | null
  userEmail?: string | null
  onSignOut?: () => void
}

export function Header({
  theme,
  onToggleTheme,
  userName,
  userEmail,
  onSignOut,
}: HeaderProps) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  const displayName = userName?.trim() || userEmail || null
  const tooltipLabel = userEmail && userName ? `${userName} · ${userEmail}` : displayName

  return (
    <header className="app-header">
      <div className="brand">
        <img src={logo} alt="" className="brand-logo" />
        <h1>Effectio</h1>
      </div>
      <div className="header-actions">
        {displayName ? (
          <Tooltip label={tooltipLabel ?? displayName} placement="bottom">
            <div className="header-user">
              <img src={userIcon} alt="" className="header-user-avatar" />
              <span className="header-user-name">{displayName}</span>
            </div>
          </Tooltip>
        ) : null}

        <Tooltip label={`Switch to ${nextTheme} mode`} placement="bottom">
          <button
            type="button"
            className="icon-btn theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${nextTheme} mode`}
          >
            <MaskedIcon src={themeIcon} className="theme-toggle-icon" />
          </button>
        </Tooltip>

        {onSignOut ? (
          <Tooltip label="Sign out" placement="bottom">
            <button
              type="button"
              className="icon-btn sign-out-btn"
              onClick={onSignOut}
              aria-label="Sign out"
            >
              <SignOutIcon />
            </button>
          </Tooltip>
        ) : null}
      </div>
    </header>
  )
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="sign-out-icon" aria-hidden="true">
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
