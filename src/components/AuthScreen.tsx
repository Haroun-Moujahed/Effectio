import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isSupabaseConfigured, setRememberMe, supabase } from '../lib/supabase'
import { Tooltip } from './Tooltip'

type AuthScreenProps = {
  mode: 'signin' | 'signup'
}

export function AuthScreen({ mode }: AuthScreenProps) {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'signup') {
        const name = fullName.trim()
        if (!name) {
          throw new Error('Please enter your full name.')
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.')
        }

        setRememberMe(true)

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (signUpError) throw signUpError

        if (data.session) {
          navigate('/calendar', { replace: true })
          return
        }

        setMessage('Check your email to confirm your account, then sign in.')
        navigate('/sign-in', { replace: true })
      } else {
        setRememberMe(rememberMe)

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) throw signInError
        navigate('/calendar', { replace: true })
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
          {mode === 'signup' ? (
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                autoComplete="name"
                required
                maxLength={80}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
          ) : null}

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
            <div className="auth-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Tooltip label={showPassword ? 'Hide password' : 'Show password'} placement="left">
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </Tooltip>
            </div>
          </label>

          {mode === 'signup' ? (
            <label className="auth-field">
              <span>Confirm password</span>
              <div className="auth-password-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <Tooltip
                  label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  placement="left"
                >
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </Tooltip>
              </div>
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

        <Link
          to={mode === 'signin' ? '/sign-up' : '/sign-in'}
          className="auth-switch"
        >
          {mode === 'signin'
            ? 'Need an account? Sign up'
            : 'Already have an account? Sign in'}
        </Link>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.5 12S6.2 5.5 12 5.5 21.5 12 21.5 12 17.8 18.5 12 18.5 2.5 12 2.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 3 21 21M10.1 10.2A3.1 3.1 0 0 0 12 15.1a3.1 3.1 0 0 0 2.9-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.1 6.4C4.1 7.8 2.5 12 2.5 12S6.2 18.5 12 18.5c1.7 0 3.2-.4 4.5-1M9.4 5.8C10.2 5.6 11.1 5.5 12 5.5 17.8 5.5 21.5 12 21.5 12c-.5 1-1.2 2.1-2.1 3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
