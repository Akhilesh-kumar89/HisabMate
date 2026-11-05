import { Link, useNavigate } from 'react-router-dom';
import { Users, HandCoins, Wallet, AlertTriangle, Hourglass } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFetch from '../hooks/useFetch.js';
import { inr, fmtDate, daysUntil } from '../utils/format.js';
import { ErrorState, PageHeader, ResponsiveTable, Skeleton, StatusBadge, EmptyState } from '../components/ui.jsx';

const PIE_COLORS = ['#10B981', '#F59E0B', '#DC2626'];

function Stat({ icon: Icon, label, value, tone }) {
  const tones = { navy: 'bg-navy-50 text-navy-700', green: 'bg-emerald-50 text-emerald-600', red: 'bg-red-50 text-red-600', slate: 'bg-slate-100 text-slate-600' };
  return (
    <div className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}><Icon size={20} /></div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy-800">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch('/dashboard/stats');
  const navigate = useNavigate();
  if (error) return <div className="card"><ErrorState message={error} onRetry={reload} /></div>;

  const s = data?.stats;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Where your udhaar stands today." />
      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
          <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
          <Skeleton className="h-72" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Stat icon={Users} label="Total customers" value={s.totalCustomers} tone="slate" />
            <Stat icon={HandCoins} label="Total udhaar" value={inr(s.totalUdhaar)} tone="navy" />
            <Stat icon={Wallet} label="Total received" value={inr(s.totalReceived)} tone="green" />
            {/* The number a shopkeeper cares about most gets the one dark card */}
            <div className="card bg-navy-800 p-5 text-white ring-navy-800 transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-white/10 text-emerald-300"><Hourglass size={20} /></div>
              <p className="text-sm text-slate-300">Total pending</p>
              <p className="mt-1 text-2xl font-bold">{inr(s.totalPending)}</p>
            </div>
            <Stat icon={AlertTriangle} label={`Overdue (${s.overdueCount})`} value={inr(s.overdueAmount)} tone="red" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-5 lg:col-span-2">
              <h2 className="mb-4 font-semibold text-navy-800">Monthly transactions</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthly} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                    <Tooltip formatter={(v) => inr(v)} cursor={{ fill: '#F1F5F9' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="udhaar" name="Udhaar given" fill="#0F2A4A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="received" name="Received" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-navy-800">Payment overview</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.overview} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {data.overview.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => inr(v)} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4"><h2 className="font-semibold text-navy-800">Recent transactions</h2><Link to="/udhaar" className="text-sm font-semibold text-emerald-700 hover:underline">View all</Link></div>
            {data.recentTransactions.length === 0 ? <EmptyState title="No transactions yet" hint="Add your first udhaar entry to see it here." /> : (
              <ResponsiveTable rows={data.recentTransactions} onRowClick={(r) => navigate(`/customers/${r.customer?._id}`)} columns={[
                { header: 'Customer', primary: true, render: (r) => r.customer?.name },
                { header: 'Description', render: (r) => r.description },
                { header: 'Date', render: (r) => fmtDate(r.date) },
                { header: 'Amount', render: (r) => inr(r.amount) },
                { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              ]} />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-navy-800">Upcoming due payments</h2>
              {data.upcomingDues.length === 0 ? <EmptyState title="Nothing due soon" /> : (
                <ul className="divide-y divide-slate-100">
                  {data.upcomingDues.map((t) => {
                    const d = daysUntil(t.dueDate);
                    return (
                      <li key={t._id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0"><p className="truncate font-medium">{t.customer?.name}</p><p className="text-xs text-slate-500">{d === 0 ? 'Due today' : `Due in ${d} day${d > 1 ? 's' : ''}`} · {fmtDate(t.dueDate)}</p></div>
                        <p className="shrink-0 font-semibold text-navy-800">{inr(t.remaining)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="card p-5">
              <h2 className="mb-3 font-semibold text-navy-800">Recently added customers</h2>
              {data.recentCustomers.length === 0 ? <EmptyState title="No customers yet" /> : (
                <ul className="divide-y divide-slate-100">
                  {data.recentCustomers.map((c) => (
                    <li key={c._id}><Link to={`/customers/${c._id}`} className="flex items-center justify-between gap-3 py-3 hover:text-emerald-700">
                      <span className="truncate font-medium">{c.name}</span><span className="shrink-0 text-sm text-slate-500">{c.mobile}</span>
                    </Link></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
