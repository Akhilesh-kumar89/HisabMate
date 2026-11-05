import { useEffect } from 'react';
import { X, Inbox, AlertCircle } from 'lucide-react';

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`sheet-enter flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-navy-800">{title}</h2>
          <button className="icon-btn -mr-2" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmText = 'Delete', onConfirm, onClose, busy }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmText}</button>
      </div>
    </Modal>
  );
}

const STATUS_STYLES = {
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  'Partially Paid': 'bg-sky-50 text-sky-700 ring-sky-600/20',
  Overdue: 'bg-red-50 text-red-700 ring-red-600/20',
};
export const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status] || STATUS_STYLES.Pending}`}>{status}</span>
);

export const Skeleton = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
export const SkeletonRows = ({ rows = 5 }) => (
  <div className="space-y-3 p-5">{Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
);

export const EmptyState = ({ title, hint, action }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400"><Inbox size={22} /></div>
    <p className="font-semibold text-slate-700">{title}</p>
    {hint && <p className="mt-1 max-w-sm text-sm text-slate-500">{hint}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-500"><AlertCircle size={22} /></div>
    <p className="font-semibold text-slate-700">Could not load data</p>
    <p className="mt-1 text-sm text-slate-500">{message}</p>
    {onRetry && <button className="btn-ghost mt-4" onClick={onRetry}>Try again</button>}
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-3">{children}</div>}
  </div>
);

export const Field = ({ label, error, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

/**
 * Table on md+ screens, stacked cards on phones.
 * columns: [{ header, render(row), primary?, actions? }]
 */
export function ResponsiveTable({ columns, rows, onRowClick }) {
  const primary = columns.find((c) => c.primary) || columns[0];
  const actions = columns.find((c) => c.actions);
  const rest = columns.filter((c) => c !== primary && c !== actions);
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold text-slate-500">
            <tr>{columns.map((c) => <th key={c.header} className="whitespace-nowrap px-5 py-3">{c.header}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r._id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={`transition hover:bg-slate-50 ${onRowClick ? 'cursor-pointer' : ''}`}>
                {columns.map((c) => <td key={c.header} className="px-5 py-3.5 align-middle" onClick={c.actions ? (e) => e.stopPropagation() : undefined}>{c.render(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {rows.map((r) => (
          <div key={r._id} onClick={onRowClick ? () => onRowClick(r) : undefined} className="space-y-3 p-4">
            <div className="font-semibold text-navy-800">{primary.render(r)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {rest.map((c) => (
                <div key={c.header} className="min-w-0">
                  <dt className="text-xs text-slate-500">{c.header}</dt>
                  <dd className="break-words text-slate-800">{c.render(r)}</dd>
                </div>
              ))}
            </dl>
            {actions && <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>{actions.render(r)}</div>}
          </div>
        ))}
      </div>
    </>
  );
}
