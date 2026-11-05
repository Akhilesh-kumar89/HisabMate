export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
export const dateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export const todayStr = () => new Date().toLocaleDateString('en-CA');
export const daysUntil = (d) => Math.round((new Date(String(d).slice(0, 10)) - new Date(todayStr())) / 86400000);
export const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
