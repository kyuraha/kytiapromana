import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';

/**
 * Sign-out button shown in the app headers. Clears the TanStack Query cache on
 * sign-out so a subsequent sign-in never sees the previous user's cached data.
 */
export default function SignOutButton() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  if (!user) return null;

  const handleSignOut = () => {
    if (!confirm('Sign out of this account?')) return;
    void signOut().then(() => {
      // Drop cached queries for the previous account.
      queryClient.clear();
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      title="Sign out"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
