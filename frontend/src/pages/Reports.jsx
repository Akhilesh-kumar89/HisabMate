import { useMemo, useState } from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import useFetch from '../hooks/useFetch.js';
import { fmtDate, inr } from '../utils/format.js';
import { EmptyState, ErrorState, PageHeader, ResponsiveTable, Skeleton, StatusBadge } from '../components/ui.jsx';

const monthLabel = (k) => new Date(`${k}-01T00:00:00Z`).toLocaleString('en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export default function Reports() {
  const [range, setRange] = useState({ from: '', to: '' });
  const params = { from: range.from || undefined, to: range.to || undefined };
  const tx = useFetch('/transactions', params);
  const pay = useFetch('/payments', params);
  const error = tx.error || pay.error;
  const loading = (tx.loading && !tx.data) || (pay.loading && !pay.data);

  const report = useMemo(() => {
    if (!tx.data || !pay.data) return null;
    const txs = tx.data.transactions;
    const pending = txs.filter((t) => t.remaining > 0);
    const totalUdhaar = txs.reduce((s, t) => s + t.amount, 0);
    const totalReceived = pay.data.payments.reduce((s, p) => s + p.amount, 0);
    const byCustomer = {};
    txs.forEach((t) => {
      const k = t.customer?._id; if (!k) return;
      const row = (byCustomer[k] ||= { _id: k, name: t.customer.name, mobile: t.customer.mobile, udhaar: 0, paid: 0, pending: 0 });
      row.udhaar += t.amount; row.paid += t.paidAmount; row.pending += t.remaining;
    });
    const months = {};
    txs.forEach((t) => { const k = new Date(t.date).toISOString().slice(0, 7); (months[k] ||= { udhaar: 0, received: 0 }).udhaar += t.amount; });
    pay.data.payments.forEach((p) => { const k = new Date(p.date).toISOString().slice(0, 7); (months[k] ||= { udhaar: 0, received: 0 }).received += p.amount; });
    const monthly = Object.keys(months).sort().map((k) => ({ month: monthLabel(k), ...months[k] }));
    return { txs, pending, totalUdhaar, totalReceived, totalPending: pending.reduce((s, t) => s + t.remaining, 0), customers: Object.values(byCustomer).sort((a, b) => b.pending - a.pending), monthly };
  }, [tx.data, pay.data]);

  const period = range.from || range.to ? `${range.from || 'start'} to ${range.to || 'today'}` : 'All time';

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const add = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No data' }]), name);
    add('Summary', [{ Period: period, 'Total Udhaar': report.totalUdhaar, 'Total Received': report.totalReceived, 'Total Pending': report.totalPending }]);
    add('Transactions', report.txs.map((t) => ({ Customer: t.customer?.name, Description: t.description, Date: fmtDate(t.date), Due: fmtDate(t.dueDate), Amount: t.amount, Paid: t.paidAmount, Remaining: t.remaining, Status: t.status })));
    add('Pending', report.pending.map((t) => ({ Customer: t.customer?.name, Mobile: t.customer?.mobile, Description: t.description, Due: fmtDate(t.dueDate), Remaining: t.remaining, Status: t.status })));
    add('Customer-wise', report.customers.map((c) => ({ Customer: c.name, Mobile: c.mobile, Udhaar: c.udhaar, Paid: c.paid, Pending: c.pending })));
    add('Monthly', report.monthly);
    XLSX.writeFile(wb, 'udhaar-report.xlsx');
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const rs = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`; // built-in PDF fonts have no rupee glyph
    doc.setFontSize(16); doc.text('Udhaar Manager - Report', 14, 16);
    doc.setFontSize(10); doc.text(`Period: ${period}`, 14, 23);
    doc.text(`Total udhaar: ${rs(report.totalUdhaar)}   Received: ${rs(report.totalReceived)}   Pending: ${rs(report.totalPending)}`, 14, 29);
    autoTable(doc, { startY: 35, head: [['Customer', 'Mobile', 'Udhaar', 'Paid', 'Pending']], body: report.customers.map((c) => [c.name, c.mobile, rs(c.udhaar), rs(c.paid), rs(c.pending)]), headStyles: { fillColor: [15, 42, 74] } });
    autoTable(doc, { head: [['Customer', 'Description', 'Due', 'Remaining', 'Status']], body: report.pending.map((t) => [t.customer?.name, t.description, fmtDate(t.dueDate), rs(t.remaining), t.status]), headStyles: { fillColor: [16, 185, 129] } });
    doc.save('udhaar-report.pdf');
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Totals, pending balances and customer-wise figures.">
        <button className="btn-ghost" disabled={!report} onClick={exportPdf}><FileText size={18} /> Export PDF</button>
        <button className="btn-primary" disabled={!report} onClick={exportExcel}><FileSpreadsheet size={18} /> Export Excel</button>
      </PageHeader>

      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div><label className="label">From</label><input className="input" type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange({ ...range, from: e.target.value })} /></div>
        <div><label className="label">To</label><input className="input" type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange({ ...range, to: e.target.value })} /></div>
        {(range.from || range.to) && <button className="btn-ghost" onClick={() => setRange({ from: '', to: '' })}>Clear dates</button>}
      </div>

      {error ? <div className="card"><ErrorState message={error} onRetry={() => { tx.reload(); pay.reload(); }} /></div> : loading || !report ? (
        <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-72" /></div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5"><p className="text-sm text-slate-500">Total udhaar given</p><p className="mt-1 text-2xl font-bold text-navy-800">{inr(report.totalUdhaar)}</p></div>
            <div className="card p-5"><p className="text-sm text-slate-500">Payments received</p><p className="mt-1 text-2xl font-bold text-emerald-700">{inr(report.totalReceived)}</p></div>
            <div className="card p-5"><p className="text-sm text-slate-500">Pending amount</p><p className="mt-1 text-2xl font-bold text-red-600">{inr(report.totalPending)}</p></div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-navy-800">Monthly transactions</h2>
            {report.monthly.length === 0 ? <EmptyState title="No data for this period" /> : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.monthly}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)} />
                    <Tooltip formatter={(v) => inr(v)} cursor={{ fill: '#F1F5F9' }} /><Legend iconType="circle" />
                    <Bar dataKey="udhaar" name="Udhaar given" fill="#0F2A4A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="received" name="Received" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <h2 className="px-5 py-4 font-semibold text-navy-800">Customer-wise report</h2>
            {report.customers.length === 0 ? <EmptyState title="No data for this period" /> : (
              <ResponsiveTable rows={report.customers} columns={[
                { header: 'Customer', primary: true, render: (r) => r.name },
                { header: 'Udhaar', render: (r) => inr(r.udhaar) },
                { header: 'Paid', render: (r) => inr(r.paid) },
                { header: 'Pending', render: (r) => <span className="font-semibold text-red-600">{inr(r.pending)}</span> },
              ]} />
            )}
          </div>

          <div className="card overflow-hidden">
            <h2 className="px-5 py-4 font-semibold text-navy-800">Pending amount report</h2>
            {report.pending.length === 0 ? <EmptyState title="Nothing pending" hint="Every udhaar in this period is paid." /> : (
              <ResponsiveTable rows={report.pending} columns={[
                { header: 'Customer', primary: true, render: (r) => r.customer?.name },
                { header: 'Description', render: (r) => r.description },
                { header: 'Due date', render: (r) => fmtDate(r.dueDate) },
                { header: 'Remaining', render: (r) => <span className="font-semibold">{inr(r.remaining)}</span> },
                { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              ]} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
