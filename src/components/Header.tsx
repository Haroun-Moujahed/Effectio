import logo from '../assets/logo.png'
import themeIcon from '../assets/theme-icon.png'
import type { Theme } from '../theme'
import { MaskedIcon } from './MaskedIcon'

type HeaderProps = {
  theme: Theme
  onToggleTheme: () => void
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className="app-header">
      <div className="brand">
        <img src={logo} alt="" className="brand-logo" />
        <h1>Effectio</h1>
      </div>
      <button
        type="button"
        className="theme-toggle"
        onClick={onToggleTheme}
        aria-label={`Switch to ${nextTheme} mode`}
        title={`Switch to ${nextTheme} mode`}
      >
        <MaskedIcon src={themeIcon} className="theme-toggle-icon" />
      </button>
    </header>
  )
}
