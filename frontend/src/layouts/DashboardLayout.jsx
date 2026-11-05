import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, HandCoins, Wallet, CalendarClock, BarChart3, LogOut, Menu, X, BookOpenCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/udhaar', label: 'Udhaar', icon: HandCoins },
  { to: '/payments', label: 'Payments', icon: Wallet },
  { to: '/due-dates', label: 'Due dates', icon: CalendarClock },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex h-full flex-col bg-navy-800 text-slate-300">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white"><BookOpenCheck size={22} /></div>
        <div className="leading-tight">
          <p className="text-lg font-bold text-white">HisabMate</p>
          <p className="max-w-[10rem] truncate text-xs text-slate-400">{user?.shopName}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate}
            className={({ isActive }) => `flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${isActive ? 'bg-emerald-500/15 text-emerald-300' : 'hover:bg-white/5 hover:text-white'}`}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-xl bg-white/5 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm font-bold text-white">{initials(user?.name)}</div>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user?.name}</p><p className="truncate text-xs text-slate-400">{user?.email}</p></div>
        </div>
        <button onClick={logout} className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"><LogOut size={16} /> Log out</button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block"><SidebarContent /></aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-900/50" onClick={() => setOpen(false)} />
          <div className="sheet-enter absolute inset-y-0 left-0 w-72 max-w-[85vw]">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button className="absolute right-3 top-5 rounded-lg p-2 text-slate-300 hover:bg-white/10" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button className="icon-btn lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
            <p className="text-sm text-slate-500">Welcome back, <span className="font-semibold text-navy-800">{user?.name?.split(' ')[0]}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary hidden !min-h-[40px] sm:inline-flex" onClick={() => navigate('/udhaar?new=1')}>Add udhaar</button>
            <button className="icon-btn" onClick={() => navigate('/payments?new=1')} aria-label="Record payment" title="Record payment"><Wallet size={20} /></button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6">
          <div key={pathname} className="page-enter"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
