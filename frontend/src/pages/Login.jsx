import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, EyeOff, BookOpenCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { Field } from '../components/ui.jsx';

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3 text-xl font-bold"><div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500"><BookOpenCheck /></div> HisabMate</div>
        <div>
          <p className="text-4xl font-bold leading-tight">Manage your udhaar, the easy way.<br />Know who owes you and how much</p>
          <p className="mt-4 max-w-md text-slate-300">Add customers, track their dues, record payments, and manage everything in one place.
</p>
          <div className="mt-8 flex gap-10">
            {[['₹1,500', 'Waiting to be collected from Ram'], ['3 days', 'Your next payment is due soon']].map(([a, b]) => (
              <div key={a}><p className="text-2xl font-bold text-emerald-400">{a}</p><p className="text-sm text-slate-400">{b}</p></div>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-400">Make payment tracking simple and stress-free.</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-lg font-bold text-navy-800 lg:hidden"><div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500 text-white"><BookOpenCheck size={20} /></div> HisabMate</div>
          <h1 className="text-2xl font-bold text-navy-800">{title}</h1>
          <p className="mb-8 mt-1 text-sm text-slate-500">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function PasswordInput({ value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input className="input pr-11" type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-700" aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Enter your password';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await login(form); toast.success('Welcome back'); } catch (err) { toast.error(errMsg(err)); setBusy(false); }
  };

  return (
    <AuthShell title="Log in" subtitle="Enter your details to open your khata." footer={<>New to Udhaar Manager? <Link to="/register" className="font-semibold text-emerald-700 hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field label="Email address" error={errors.email}><input className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Password" error={errors.password}><PasswordInput autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </AuthShell>
  );
}
