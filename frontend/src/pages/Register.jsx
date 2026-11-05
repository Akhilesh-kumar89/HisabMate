import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { Field } from '../components/ui.jsx';
import { AuthShell, PasswordInput } from './Login.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '', mobile: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (form.password.length < 6) errs.password = 'Use at least 6 characters';
    if (!form.shopName.trim()) errs.shopName = 'Enter your shop name';
    if (!/^[6-9]\d{9}$/.test(form.mobile)) errs.mobile = 'Enter a valid 10-digit mobile number';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await register(form); toast.success('Account created'); } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" subtitle="Set up your shop in under a minute." footer={<>Already registered? <Link to="/login" className="font-semibold text-emerald-700 hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name}><input className="input" autoComplete="name" value={form.name} onChange={set('name')} /></Field>
        <Field label="Email address" error={errors.email}><input className="input" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" error={errors.password}><PasswordInput autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Shop name" error={errors.shopName}><input className="input" value={form.shopName} onChange={set('shopName')} /></Field>
          <Field label="Mobile number" error={errors.mobile}><input className="input" inputMode="numeric" maxLength={10} autoComplete="tel" value={form.mobile} onChange={set('mobile')} /></Field>
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
    </AuthShell>
  );
}
