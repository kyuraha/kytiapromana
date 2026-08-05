import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

/**
 * Aesthetic, in-app replacements for the browser-native `confirm()` and
 * `alert()` dialogs. Rendered through a context provider so any component can
 * trigger a confirmation modal or an auto-dismissing toast that matches the
 * app's visual design.
 */

export interface DialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When true, only the confirm button is shown (a notice / warning). */
  confirmOnly?: boolean;
}

type DialogState = {
  resolve: (v: boolean) => void;
  opts: DialogOptions;
} | null;

type ToastKind = 'error' | 'success' | 'info';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

let notifyHandler: ((message: string, kind?: ToastKind) => void) | null = null;

/** Fire an in-app toast from anywhere (including outside React, e.g. TanStack mutation errors). */
export function notify(message: string, kind: ToastKind = 'error') {
  notifyHandler?.(message, kind);
}

type ConfirmFn = (opts: DialogOptions) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn>(async () => false);

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmCtx);
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  notifyHandler = (message, kind: ToastKind = 'error') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, kind }]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      6000,
    );
  };

  const confirm = useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ resolve, opts });
    });
  }, []);

  const close = (result: boolean) => {
    if (dialog) dialog.resolve(result);
    setDialog(null);
  };

  const closeOnBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Don't allow backdrop-dismiss on confirm-only notices (they have a button).
      close(dialog?.opts.confirmOnly ? false : false);
    }
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}

      {/* Confirmation / notice modal */}
      {dialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={closeOnBackdrop}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  dialog.opts.danger
                    ? 'bg-rose-100 text-rose-600'
                    : dialog.opts.confirmOnly
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-brand/10 text-brand'
                }`}
              >
                {dialog.opts.danger ? (
                  <XCircle size={18} />
                ) : dialog.opts.confirmOnly ? (
                  <Info size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-ink">
                  {dialog.opts.title ?? 'Confirm'}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {dialog.opts.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {!dialog.opts.confirmOnly && (
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
                >
                  {dialog.opts.cancelLabel ?? 'Cancel'}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
                  dialog.opts.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-brand hover:bg-brand-dark'
                }`}
              >
                {dialog.opts.confirmLabel ??
                  (dialog.opts.confirmOnly ? 'OK' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts (top-right, auto-dismiss) */}
      <div className="pointer-events-none fixed right-4 top-4 z-[110] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => {
          const Icon =
            t.kind === 'error'
              ? XCircle
              : t.kind === 'success'
                ? CheckCircle2
                : AlertTriangle;
          const tone =
            t.kind === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : t.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700';
          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${tone}`}
            >
              <Icon size={17} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ConfirmCtx.Provider>
  );
}
