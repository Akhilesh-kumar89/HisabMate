import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import { fmtDate, inr } from '../utils/format.js';
import PaymentModal from '../components/PaymentModal.jsx';
import { EmptyState, ErrorState, PageHeader, ResponsiveTable, SkeletonRows } from '../components/ui.jsx';

export default function Payments() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(!!params.get('new'));
  const { data, loading, error, reload } = useFetch('/payments');
  const close = () => { setOpen(false); if (params.get('new')) setParams({}); };

  return (
    <>
      <PageHeader title="Payments" subtitle="Every payment you have received.">
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Record payment</button>
      </PageHeader>
      <div className="card overflow-hidden">
        {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <SkeletonRows /> : data.payments.length === 0 ? (
          <EmptyState title="No payments yet" hint="Payments you record against an udhaar entry appear here."
            action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={18} /> Record payment</button>} />
        ) : (
          <ResponsiveTable rows={data.payments} columns={[
            { header: 'Customer', primary: true, render: (r) => r.customer?.name },
            { header: 'For', render: (r) => r.transaction?.description },
            { header: 'Date', render: (r) => fmtDate(r.date) },
            { header: 'Amount', render: (r) => <span className="font-semibold text-emerald-700">{inr(r.amount)}</span> },
            { header: 'Note', render: (r) => r.note || '—' },
          ]} />
        )}
      </div>
      {open && <PaymentModal onClose={close} onSaved={() => { close(); reload(); }} />}
    </>
  );
}
