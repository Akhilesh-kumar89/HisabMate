import { useMemo, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import { daysUntil, fmtDate, inr } from '../utils/format.js';
import PaymentModal from '../components/PaymentModal.jsx';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui.jsx';

const GROUPS = [
  { key: 'today', title: 'Due today', dot: 'bg-amber-500', ring: 'border-l-amber-500' },
  { key: 'overdue', title: 'Overdue', dot: 'bg-red-500', ring: 'border-l-red-500' },
  { key: 'upcoming', title: 'Upcoming', dot: 'bg-sky-500', ring: 'border-l-sky-500' },
  { key: 'paid', title: 'Paid', dot: 'bg-emerald-500', ring: 'border-l-emerald-500' },
];

export default function DueDates() {
  const { data, loading, error, reload } = useFetch('/transactions');
  const [paying, setPaying] = useState(null);

  const grouped = useMemo(() => {
    const g = { today: [], overdue: [], upcoming: [], paid: [] };
    (data?.transactions || []).forEach((t) => {
      if (t.remaining <= 0) return g.paid.push(t);
      if (!t.dueDate) return;
      const d = daysUntil(t.dueDate);
      (d === 0 ? g.today : d < 0 ? g.overdue : g.upcoming).push(t);
    });
    g.overdue.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    g.upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    return g;
  }, [data]);

  const whatsapp = (t) => {
    const msg = `Namaste ${t.customer.name}, a gentle reminder: ${inr(t.remaining)} is pending for "${t.description}" (due ${fmtDate(t.dueDate)}). Thank you!`;
    window.open(`https://wa.me/91${t.customer.mobile}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  };
  const label = (t) => {
    if (t.remaining <= 0) return 'Paid in full';
    const d = daysUntil(t.dueDate);
    return d === 0 ? 'Due today' : d < 0 ? `${-d} day${d < -1 ? 's' : ''} overdue` : `Due in ${d} day${d > 1 ? 's' : ''}`;
  };

  return (
    <>
      <PageHeader title="Due dates" subtitle="Know who to remind, and when." />
      {error ? <div className="card"><ErrorState message={error} onRetry={reload} /></div> : loading && !data ? (
        <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-56" />)}</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {GROUPS.map((g) => (
            <section key={g.key} className="card p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold text-navy-800">
                <span className={`h-2.5 w-2.5 rounded-full ${g.dot}`} /> {g.title}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{grouped[g.key].length}</span>
              </h2>
              {grouped[g.key].length === 0 ? <EmptyState title={`Nothing ${g.key === 'paid' ? 'paid yet' : g.title.toLowerCase()}`} /> : (
                <ul className="space-y-3">
                  {grouped[g.key].map((t) => (
                    <li key={t._id} className={`rounded-xl border border-l-4 border-slate-200 ${g.ring} p-3.5`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate font-semibold">{t.customer?.name}</p><p className="truncate text-sm text-slate-500">{t.description}</p></div>
                        <p className="shrink-0 font-bold text-navy-800">{inr(t.remaining > 0 ? t.remaining : t.amount)}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">{label(t)}{t.dueDate && ` · ${fmtDate(t.dueDate)}`}</p>
                        {t.remaining > 0 && (
                          <div className="flex gap-2">
                            <button className="btn-ghost !min-h-[36px] !px-3" onClick={() => whatsapp(t)}><MessageCircle size={15} /> Remind</button>
                            <button className="btn-primary !min-h-[36px] !px-3" onClick={() => setPaying(t)}>Record payment</button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
      {paying && <PaymentModal transaction={paying} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); reload(); }} />}
    </>
  );
}
