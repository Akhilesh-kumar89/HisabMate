import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Pencil, Phone, Plus } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import { fmtDate, inr, initials } from '../utils/format.js';
import CustomerModal from '../components/CustomerModal.jsx';
import TransactionModal from '../components/TransactionModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import { EmptyState, ErrorState, ResponsiveTable, Skeleton, StatusBadge } from '../components/ui.jsx';

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(`/customers/${id}`);
  const [modal, setModal] = useState(null); // 'edit' | 'udhaar' | { pay: tx }

  if (error) return <div className="card"><ErrorState message={error} onRetry={() => navigate('/customers')} /></div>;
  if (loading && !data) return <div className="space-y-4"><Skeleton className="h-36" /><Skeleton className="h-64" /></div>;
  const { customer: c, transactions, payments, totals } = data;
  const done = () => { setModal(null); reload(); };

  return (
    <>
      <Link to="/customers" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-navy-800"><ArrowLeft size={16} /> All customers</Link>
      <div className="card mb-6 p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy-800 text-lg font-bold text-white">{initials(c.name)}</div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-navy-800">{c.name}</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Phone size={14} /> {c.mobile}</p>
              <p className="mt-1 flex items-start gap-2 text-sm text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0" /> {c.address}</p>
              {c.notes && <p className="mt-2 text-sm text-slate-600">{c.notes}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost" onClick={() => setModal('edit')}><Pencil size={16} /> Edit</button>
            <button className="btn-primary" onClick={() => setModal('udhaar')}><Plus size={18} /> Add udhaar</button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center">
          <div><p className="text-xs text-slate-500">Total udhaar</p><p className="font-bold text-navy-800">{inr(totals.totalUdhaar)}</p></div>
          <div><p className="text-xs text-slate-500">Paid</p><p className="font-bold text-emerald-700">{inr(totals.totalPaid)}</p></div>
          <div><p className="text-xs text-slate-500">Pending</p><p className="font-bold text-red-600">{inr(totals.pending)}</p></div>
        </div>
      </div>

      <div className="card mb-6 overflow-hidden">
        <h2 className="px-5 py-4 font-semibold text-navy-800">Transaction history</h2>
        {transactions.length === 0 ? <EmptyState title="No udhaar yet" hint="Add an udhaar entry for this customer." /> : (
          <ResponsiveTable rows={transactions} columns={[
            { header: 'Description', primary: true, render: (r) => r.description },
            { header: 'Date', render: (r) => fmtDate(r.date) },
            { header: 'Due', render: (r) => fmtDate(r.dueDate) },
            { header: 'Amount', render: (r) => inr(r.amount) },
            { header: 'Remaining', render: (r) => inr(r.remaining) },
            { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { header: 'Actions', actions: true, render: (r) => r.remaining > 0 && <button className="btn-ghost !min-h-[36px]" onClick={() => setModal({ pay: { ...r, customer: c } })}>Record payment</button> },
          ]} />
        )}
      </div>

      <div className="card overflow-hidden">
        <h2 className="px-5 py-4 font-semibold text-navy-800">Payment history</h2>
        {payments.length === 0 ? <EmptyState title="No payments recorded" /> : (
          <ResponsiveTable rows={payments} columns={[
            { header: 'For', primary: true, render: (r) => r.transaction?.description },
            { header: 'Date', render: (r) => fmtDate(r.date) },
            { header: 'Amount', render: (r) => <span className="font-semibold text-emerald-700">{inr(r.amount)}</span> },
            { header: 'Note', render: (r) => r.note || '—' },
          ]} />
        )}
      </div>

      {modal === 'edit' && <CustomerModal customer={c} onClose={() => setModal(null)} onSaved={done} />}
      {modal === 'udhaar' && <TransactionModal customerId={c._id} onClose={() => setModal(null)} onSaved={done} />}
      {modal?.pay && <PaymentModal transaction={modal.pay} onClose={() => setModal(null)} onSaved={done} />}
    </>
  );
}
