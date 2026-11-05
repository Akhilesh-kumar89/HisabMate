import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { inr } from '../utils/format.js';
import CustomerModal from '../components/CustomerModal.jsx';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader, ResponsiveTable, SkeletonRows } from '../components/ui.jsx';

export default function Customers() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | customer
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch('/customers', { search: q });

  useEffect(() => { const t = setTimeout(() => setQ(search), 300); return () => clearTimeout(t); }, [search]);

  const remove = async () => {
    setBusy(true);
    try { await api.delete(`/customers/${toDelete._id}`); toast.success('Customer deleted'); setToDelete(null); reload(); }
    catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader title="Customers" subtitle="Everyone who buys on credit from your shop.">
        <button className="btn-primary" onClick={() => setModal('new')}><Plus size={18} /> Add customer</button>
      </PageHeader>
      <div className="card overflow-hidden">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search by name or mobile number" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <SkeletonRows /> : data.customers.length === 0 ? (
          <EmptyState title={q ? 'No customers match your search' : 'No customers yet'} hint={q ? 'Try a different name or number.' : 'Add your first customer to start tracking udhaar.'}
            action={!q && <button className="btn-primary" onClick={() => setModal('new')}><Plus size={18} /> Add customer</button>} />
        ) : (
          <ResponsiveTable rows={data.customers} onRowClick={(r) => navigate(`/customers/${r._id}`)} columns={[
            { header: 'Name', primary: true, render: (r) => <span className="font-medium text-navy-800">{r.name}</span> },
            { header: 'Mobile', render: (r) => r.mobile },
            { header: 'Address', render: (r) => <span className="line-clamp-1">{r.address}</span> },
            { header: 'Pending balance', render: (r) => <span className={r.pending > 0 ? 'font-semibold text-red-600' : 'text-emerald-700'}>{inr(r.pending)}</span> },
            { header: 'Actions', actions: true, render: (r) => (
              <div className="flex justify-end gap-1">
                <button className="icon-btn" aria-label={`Edit ${r.name}`} onClick={() => setModal(r)}><Pencil size={18} /></button>
                <button className="icon-btn hover:!text-red-600" aria-label={`Delete ${r.name}`} onClick={() => setToDelete(r)}><Trash2 size={18} /></button>
              </div>) },
          ]} />
        )}
      </div>
      {modal && <CustomerModal customer={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); reload(); }} />}
      {toDelete && <ConfirmDialog title="Delete customer?" busy={busy} onClose={() => setToDelete(null)} onConfirm={remove}
        message={`This removes ${toDelete.name} along with all their udhaar and payment records. This cannot be undone.`} />}
    </>
  );
}
