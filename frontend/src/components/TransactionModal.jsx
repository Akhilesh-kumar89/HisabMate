import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api.js';
import { dateInput, todayStr } from '../utils/format.js';
import { Modal, Field } from './ui.jsx';

export default function TransactionModal({ transaction, customerId, onClose, onSaved }) {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer: transaction?.customer?._id || customerId || '',
    amount: transaction?.amount || '',
    description: transaction?.description || '',
    date: dateInput(transaction?.date) || todayStr(),
    dueDate: dateInput(transaction?.dueDate),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { api.get('/customers').then((r) => setCustomers(r.data.customers)).catch((e) => toast.error(errMsg(e))); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.customer) errs.customer = 'Select a customer';
    if (!(Number(form.amount) >= 1)) errs.amount = 'Enter an amount of ₹1 or more';
    if (!form.description.trim()) errs.description = 'Describe what was given on credit';
    if (!form.date) errs.date = 'Select the transaction date';
    if (form.dueDate && form.dueDate < form.date) errs.dueDate = 'Due date cannot be before the transaction date';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (transaction) await api.put(`/transactions/${transaction._id}`, form);
      else await api.post('/transactions', form);
      toast.success(transaction ? 'Udhaar updated' : 'Udhaar added');
      onSaved();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <Modal title={transaction ? 'Edit udhaar' : 'Add udhaar'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Customer" error={errors.customer}>
          {/* <input
  type="text"
  className="input"
  placeholder="Enter customer name"
  value={form.customer}
  onChange={set('customer')}
  disabled={!!transaction}
/> */}
          <select className="input" value={form.customer} onChange={set('customer')} disabled={!!transaction}>
            <option value="">Select a customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name} · {c.mobile}</option>)}
          </select>
        </Field>
        <Field label="Amount (₹)" error={errors.amount}><input className="input" type="number" min="1" step="any" inputMode="decimal" value={form.amount} onChange={set('amount')} /></Field>
        <Field label="Description" error={errors.description}><input className="input" placeholder="e.g. Monthly grocery" value={form.description} onChange={set('description')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Transaction date" error={errors.date}><input className="input" type="date" value={form.date} onChange={set('date')} /></Field>
          <Field label="Payment due date" error={errors.dueDate}><input className="input" type="date" value={form.dueDate} onChange={set('dueDate')} /></Field>
        </div>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : transaction ? 'Save changes' : 'Add udhaar'}</button>
        </div>
      </form>
    </Modal>
  );
}
