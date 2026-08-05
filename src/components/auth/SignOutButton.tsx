import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../lib/dialogs';

/**
 * Sign-out button shown in the app headers. Clears the TanStack Query cache on
 * sign-out so a subsequent sign-in never sees the previous user's cached data.
 */
export default function SignOutButton() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  if (!user) return null;

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Sign out of this account?',
      confirmLabel: 'Sign out',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    await signOut();
    // Drop cached queries for the previous account.
    queryClient.clear();
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
