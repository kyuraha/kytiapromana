import { useAuth } from '../../lib/auth';

export default function Login() {
  const { signIn, signingIn, error, clearError } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl text-white">
          🎮
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">Studio PM</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage all your games — Vision, Quarter & Sprint — in one place.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-left text-sm text-red-700"
          >
            <div className="flex items-start justify-between gap-2">
              <p>{error}</p>
              <button
                type="button"
                onClick={clearError}
                className="shrink-0 text-red-400 hover:text-red-600"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void signIn()}
          disabled={signingIn}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleIcon />
          {signingIn ? 'Signing in…' : 'Sign in with Google'}
        </button>

        <p className="mt-4 text-xs text-slate-400">
          Data is stored in your Firebase project and only visible to your
          account.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.14H42V20H24v8h11.3C33.7 32.66 29.2 36 24 36c-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.86 1.16 8 3.04l5.66-5.66C34.46 6.1 29.5 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.32-.13-2.6-.4-3.86z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.69l6.57 4.82C14.72 15.28 18.96 12 24 12c3.06 0 5.86 1.16 8 3.04l5.66-5.66C34.46 6.1 29.5 4 24 4 16.32 4 9.66 8.34 6.3 14.69z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.17 0 9.93-1.99 13.41-5.24l-6.19-5.24C29.23 35.02 26.7 36 24 36c-5.2 0-9.6-3.43-11.13-8.2l-6.42 4.95C9.54 39.67 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.14H42V20H24v8h11.3c-.79 2.25-2.25 4.16-4.09 5.53l6.2 5.25C40.28 36.08 44 30.51 44 24c0-1.32-.13-2.6-.4-3.86z"
      />
    </svg>
  );
}
