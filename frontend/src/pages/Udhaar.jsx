import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Plus, Search, Trash2, Wallet } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { fmtDate, inr } from '../utils/format.js';
import TransactionModal from '../components/TransactionModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, ResponsiveTable, SkeletonRows, StatusBadge } from '../components/ui.jsx';

const STATUSES = ['Pending', 'Partially Paid', 'Paid', 'Overdue'];

export default function Udhaar() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(params.get('new') ? 'new' : null); // 'new' | tx | { pay: tx }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch('/transactions', { status });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.transactions || []).filter((t) => !q || t.customer?.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [data, search]);

  const close = () => { setModal(null); if (params.get('new')) setParams({}); };
  const done = () => { close(); reload(); };
  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/transactions/${toDelete._id}`); toast.success('Udhaar deleted'); setToDelete(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Udhaar" subtitle="Every credit entry across all customers.">
        <button className="btn-primary" onClick={() => setModal('new')}><Plus size={18} /> Add udhaar</button>
      </PageHeader>
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search customer or description" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <SkeletonRows /> : rows.length === 0 ? (
          <EmptyState title="No udhaar entries found" hint="Add an entry or change the filters." />
        ) : (
          <ResponsiveTable rows={rows} columns={[
            { header: 'Customer', primary: true, render: (r) => r.customer?.name },
            { header: 'Description', render: (r) => r.description },
            { header: 'Date', render: (r) => fmtDate(r.date) },
            { header: 'Due date', render: (r) => fmtDate(r.dueDate) },
            { header: 'Amount', render: (r) => inr(r.amount) },
            { header: 'Paid', render: (r) => inr(r.paidAmount) },
            { header: 'Remaining', render: (r) => <span className="font-semibold">{inr(r.remaining)}</span> },
            { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { header: 'Actions', actions: true, render: (r) => (
              <div className="flex justify-end gap-1">
                {r.remaining > 0 && <button className="icon-btn hover:!text-emerald-700" aria-label="Record payment" title="Record payment" onClick={() => setModal({ pay: r })}><Wallet size={18} /></button>}
                <button className="icon-btn" aria-label="Edit" onClick={() => setModal(r)}><Pencil size={18} /></button>
                <button className="icon-btn hover:!text-red-600" aria-label="Delete" onClick={() => setToDelete(r)}><Trash2 size={18} /></button>
              </div>) },
          ]} />
        )}
      </div>
      {modal && !modal.pay && <TransactionModal transaction={modal === 'new' ? null : modal} onClose={close} onSaved={done} />}
      {modal?.pay && <PaymentModal transaction={modal.pay} onClose={close} onSaved={done} />}
      {toDelete && <ConfirmDialog title="Delete this udhaar?" busy={busy} onClose={() => setToDelete(null)} onConfirm={remove}
        message={`This removes ${inr(toDelete.amount)} for ${toDelete.customer?.name} and any payments recorded against it.`} />}
    </>
  );
}
