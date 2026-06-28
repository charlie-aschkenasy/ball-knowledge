// ===========================================================================
// Login / sign-up screen. Shown whenever there is no session. Email + password
// only. Toggling between "sign in" and "create account" reuses the same form.
// ===========================================================================

import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';

type Mode = 'signin' | 'signup';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        const hasSession = await signUp(email.trim(), password);
        if (!hasSession) {
          setNotice('Check your email to confirm your account, then sign in.');
          setMode('signin');
        }
      }
      // On success the auth listener flips the session and the app swaps in.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen auth">
      <header className="brand">
        <h1 className="brand-title">
          Ball<span className="accent"> Knowledge</span>
        </h1>
        <p className="brand-tag">Your daily sports IQ check.</p>
      </header>

      <form className="card auth-card" onSubmit={onSubmit}>
        <h2 className="auth-heading">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>

        <label className="auth-field">
          <span className="label">Email</span>
          <input
            className="fib-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="auth-field">
          <span className="label">Password</span>
          <input
            className="fib-input"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {notice && <p className="auth-notice">{notice}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
          {busy ? 'One sec…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-small"
          onClick={() => {
            setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
            setError(null);
            setNotice(null);
          }}
        >
          {mode === 'signin'
            ? "New here? Create an account"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
