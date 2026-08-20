import { useState, type FormEvent } from 'react'
import { isSupabaseConfigured, setRememberMe, supabase } from '../lib/supabase'

type AuthMode = 'signin' | 'signup'

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [rememberMe, setRememberMeChecked] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!isSupabaseConfigured || !supabase) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <h2>Supabase not configured</h2>
          <p>
            Copy <code>.env.example</code> to <code>.env.local</code> and add your project URL and
            anon key, then restart the dev server.
          </p>
        </div>
      </div>
    )
  }

  function switchMode(next: AuthMode) {
    setMode(next)
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setMessage(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }

        // New accounts stay signed in by default
        setRememberMe(true)

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signUpError) throw signUpError

        if (data.session) return

        setMessage('Check your email to confirm your account, then sign in.')
        switchMode('signin')
      } else {
        setRememberMe(rememberMe)

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2>{mode === 'signin' ? 'Sign in' : 'Sign up'}</h2>
        <p className="auth-lead">
          {mode === 'signin'
            ? 'Welcome back. Your tasks stay private to your account.'
            : 'Create an account to save your calendar across devices.'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {mode === 'signup' ? (
            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
          ) : (
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMeChecked(event.target.checked)}
              />
              <span>Keep me signed in</span>
            </label>
          )}

          {error ? <p className="auth-error">{error}</p> : null}
          {message ? <p className="auth-message">{message}</p> : null}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
        >
          {mode === 'signin'
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
