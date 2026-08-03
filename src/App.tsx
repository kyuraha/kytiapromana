import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './lib/auth';
import { isFirebaseConfigured } from './lib/firebase';
import GameShell from './components/layout/GameShell';
import GamesPage from './pages/GamesPage';
import OverviewPage from './pages/OverviewPage';
import QuarterPage from './pages/QuarterPage';
import SprintPage from './pages/SprintPage';
import Login from './components/auth/Login';
import Spinner from './components/common/Spinner';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[mutation error]', error);
      // Surface real failures so the exact cause is visible (not silent).
      alert(`Action failed: ${msg}`);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();

  // Firestore security rules require a signed-in user.
  // Mock mode (no Firebase) skips login entirely.
  if (loading) return <Spinner />;
  if (isFirebaseConfigured && !user) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/games" replace />} />
      <Route path="/games" element={<GamesPage />} />
      <Route path="/games/:gameId" element={<GameShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="quarter" element={<QuarterPage />} />
        <Route path="sprint" element={<SprintPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/games" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
