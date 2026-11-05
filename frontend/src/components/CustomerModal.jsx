import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../services/api.js';
import { Modal, Field } from './ui.jsx';

export default function CustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState({ name: customer?.name || '', mobile: customer?.mobile || '', address: customer?.address || '', notes: customer?.notes || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter the customer’s name';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) errs.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.address.trim()) errs.address = 'Enter an address';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (customer) await api.put(`/customers/${customer._id}`, form);
      else await api.post('/customers', form);
      toast.success(customer ? 'Customer updated' : 'Customer added');
      onSaved();
    } catch (err) { toast.error(errMsg(err)); } finally { setSaving(false); }
  };

  return (
    <Modal title={customer ? 'Edit customer' : 'Add customer'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Mobile number" error={errors.mobile}><input className="input" inputMode="numeric" maxLength={10} value={form.mobile} onChange={set('mobile')} /></Field>
        <Field label="Address" error={errors.address}><input className="input" value={form.address} onChange={set('address')} /></Field>
        <Field label="Notes (optional)"><textarea className="input" rows={3} value={form.notes} onChange={set('notes')} /></Field>
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : customer ? 'Save changes' : 'Add customer'}</button>
        </div>
      </form>
    </Modal>
  );
}
