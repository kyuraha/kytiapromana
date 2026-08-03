import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  getAuth,
  getAnalyticsIfSupported,
  isFirebaseConfigured,
  MOCK_USER_ID,
  requireAuth,
} from './firebase';

// ---- global "current user id" cache -------------------------------------
// The Firestore Repo needs the signed-in uid on every read/write (security
// rules enforce `userId == auth.uid`). Hooked in by the AuthProvider below;
// in mock mode it always resolves to MOCK_USER_ID so the offline demo works.

let currentUid = isFirebaseConfigured ? '' : MOCK_USER_ID;

export function setCurrentUid(uid: string) {
  currentUid = uid;
}

export function getCurrentUid(): string {
  return currentUid;
}

/** Throws a clear error when a write/read needs a signed-in user. */
export function requireUid(): string {
  const uid = currentUid;
  if (!uid) {
    throw new Error('Not signed in. Please sign in with Google and try again.');
  }
  return uid;
}

// ---- human-readable Firebase Auth errors --------------------------------
export function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completing.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by the browser. Trying redirect sign-in…';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt was already in progress.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase Auth settings. Add localhost (and your host) under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, enable Google.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with a different sign-in method.';
    case 'auth/internal-error':
      return 'Firebase Auth internal error. Confirm Google provider is enabled and the OAuth client is set up.';
    default: {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Sign-in failed. Please try again.';
      return msg;
    }
  }
}

// ---- React auth context ---------------------------------------------------
interface AuthCtx {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  error: string | null;
  clearError: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signingIn: false,
  error: null,
  clearError: () => {},
  signIn: async () => {},
  signOut: async () => {},
});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setCurrentUid(MOCK_USER_ID);
      setUser(null);
      setLoading(false);
      return;
    }

    void getAnalyticsIfSupported();

    const auth = getAuth();
    if (!auth) {
      setError('Firebase Auth failed to initialize. Check .env config.');
      setLoading(false);
      return;
    }

    // Complete redirect-based sign-in (fallback when popup is blocked).
    void getRedirectResult(auth).catch((err) => {
      // Ignore "no redirect" style noise; surface real failures.
      if (err && typeof err === 'object' && 'code' in err) {
        const code = String((err as { code: string }).code);
        if (code !== 'auth/redirect-operation-pending') {
          setError(authErrorMessage(err));
        }
      }
    });

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setCurrentUid(u?.uid ?? '');
        setUser(u);
        setLoading(false);
        if (u) setError(null);
      },
      (err) => {
        setError(authErrorMessage(err));
        setLoading(false);
      },
    );
    return () => unsub();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const signIn = useCallback(async () => {
    setError(null);
    setSigningIn(true);
    try {
      const auth = requireAuth();
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (popupErr) {
        const code =
          popupErr && typeof popupErr === 'object' && 'code' in popupErr
            ? String((popupErr as { code: string }).code)
            : '';
        // Popup blocked / closed mid-flow → full-page redirect.
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
          if (code === 'auth/popup-blocked') {
            setError(authErrorMessage(popupErr));
            await signInWithRedirect(auth, googleProvider);
            return;
          }
          // User closed popup intentionally — soft message, no redirect.
          setError(authErrorMessage(popupErr));
          return;
        }
        throw popupErr;
      }
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const auth = getAuth();
      if (auth) await fbSignOut(auth);
      setCurrentUid('');
    } catch (err) {
      setError(authErrorMessage(err));
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signingIn, error, clearError, signIn, signOut }),
    [user, loading, signingIn, error, clearError, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
