import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api.js';
import { inr, todayStr } from '../utils/format.js';
import { Modal, Field } from './ui.jsx';

// Pass `transaction` to pay a specific udhaar, or omit it to pick from outstanding ones.
export default function PaymentModal({ transaction, onClose, onSaved }) {
  const [options, setOptions] = useState([]);
  const [txId, setTxId] = useState(transaction?._id || '');
  const [amount, setAmount] = useState(transaction ? String(transaction.remaining) : '');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const clientRef = useRef(crypto.randomUUID()); // one key per opened form: retries can't double-record

  useEffect(() => {
    if (transaction) return;
    api.get('/transactions').then((r) => setOptions(r.data.transactions.filter((t) => t.remaining > 0))).catch((e) => toast.error(errMsg(e)));
  }, [transaction]);

  const tx = transaction || options.find((t) => t._id === txId);

  const pickTx = (id) => {
    setTxId(id);
    const t = options.find((o) => o._id === id);
    setAmount(t ? String(t.remaining) : '');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!tx) return setError('Select an udhaar entry');
    if (!(Number(amount) > 0)) return setError('Enter a payment amount');
    if (Number(amount) > tx.remaining) return setError(`Amount cannot be more than the remaining ${inr(tx.remaining)}`);
    setError('');
    setSaving(true);
    try {
      await api.post('/payments', { transaction: tx._id, amount: Number(amount), date, note, clientRef: clientRef.current });
      toast.success('Payment recorded');
      onSaved();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {transaction ? (
          <p className="text-sm font-medium text-slate-700">{transaction.customer?.name} · {transaction.description}</p>
        ) : (
          <Field label="Udhaar entry">
            <select className="input" value={txId} onChange={(e) => pickTx(e.target.value)}>
              <option value="">Select an outstanding entry</option>
              {options.map((t) => <option key={t._id} value={t._id}>{t.customer?.name} · {t.description} · {inr(t.remaining)} left</option>)}
            </select>
          </Field>
        )}
        {tx && (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-sm">
            <div><p className="text-xs text-slate-500">Total</p><p className="font-semibold">{inr(tx.amount)}</p></div>
            <div><p className="text-xs text-slate-500">Paid</p><p className="font-semibold text-emerald-700">{inr(tx.paidAmount)}</p></div>
            <div><p className="text-xs text-slate-500">Remaining</p><p className="font-semibold text-red-600">{inr(tx.remaining)}</p></div>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount received (₹)"><input className="input" type="number" min="1" step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Payment date"><input className="input" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <Field label="Note (optional)"><input className="input" placeholder="Cash, UPI…" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Recording…' : 'Record payment'}</button>
        </div>
      </form>
    </Modal>
  );
}
