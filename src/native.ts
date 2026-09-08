import { useEffect, useRef } from 'react'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { Theme } from './theme'

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export async function applyNativeTheme(theme: Theme): Promise<void> {
  if (!isNativeApp()) return

  try {
    await StatusBar.setStyle({
      style: theme === 'dark' ? Style.Light : Style.Dark,
    })
  } catch {
    // Status bar styling is unavailable on some emulators.
  }
}

export async function hideNativeSplash(): Promise<void> {
  if (!isNativeApp()) return

  try {
    await SplashScreen.hide()
  } catch {
    // Splash may already be hidden.
  }
}

/** Fires when the app or tab becomes visible again (native resume + browser tab). */
export function useAppForeground(onForeground: () => void): void {
  const onForegroundRef = useRef(onForeground)
  onForegroundRef.current = onForeground

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') onForegroundRef.current()
    }
    document.addEventListener('visibilitychange', onVisible)

    let handle: { remove: () => Promise<void> } | undefined
    if (isNativeApp()) {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) onForegroundRef.current()
      }).then((listener) => {
        handle = listener
      })
    }

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      void handle?.remove()
    }
  }, [])
}

/** Returns true if the back press was consumed (overlay / panel closed). */
export function useNativeBackButton(onDismissOverlay: () => boolean): void {
  const onDismissRef = useRef(onDismissOverlay)
  onDismissRef.current = onDismissOverlay

  useEffect(() => {
    if (!isNativeApp()) return

    let handle: { remove: () => Promise<void> } | undefined
    const listen = App.addListener('backButton', ({ canGoBack }) => {
      if (onDismissRef.current()) return
      if (canGoBack) {
        window.history.back()
        return
      }
      void App.exitApp()
    })

    void listen.then((listener) => {
      handle = listener
    })

    return () => {
      void handle?.remove()
    }
  }, [])
}
