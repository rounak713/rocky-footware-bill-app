import React, { useEffect, useState } from 'react';
import { TrendingUp, IndianRupee, Users, Receipt, FileText, AlertCircle } from 'lucide-react';
import API from '../services/api';
import { Link } from 'react-router-dom';

const StatCard = ({ label, value, icon: Icon, color, sub, href }) => {
  const inner = (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-black text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/dashboard'),
      API.get('/reports/top-products'),
    ])
      .then(([dashRes, topRes]) => {
        setData(dashRes.data.data);
        setTopItems(topRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              label="Today's Revenue"
              value={fmt(data?.todayRevenue)}
              icon={IndianRupee}
              color="bg-blue-600"
              sub={`${data?.todayInvoices || 0} invoices today`}
              href="/invoices"
            />
            <StatCard
              label="This Month"
              value={fmt(data?.monthRevenue)}
              icon={TrendingUp}
              color="bg-violet-600"
              sub={`${data?.monthInvoices || 0} invoices`}
            />
            <StatCard
              label="Customers"
              value={data?.totalCustomers || 0}
              icon={Users}
              color="bg-emerald-600"
              sub="Registered customers"
              href="/customers"
            />
            <StatCard
              label="Pending (Udhaar)"
              value={fmt(data?.pendingAmount)}
              icon={AlertCircle}
              color={data?.pendingCount > 0 ? 'bg-amber-500' : 'bg-slate-400'}
              sub={`${data?.pendingCount || 0} unpaid invoices`}
              href="/invoices"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Selling Items */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Receipt size={18} className="text-blue-600" />
                <h2 className="font-bold text-slate-700">Top Selling Items</h2>
              </div>
              {topItems.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-10">No sales data yet</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {topItems.slice(0, 8).map((item, i) => (
                    <div key={i} className="flex items-center px-6 py-4 gap-4">
                      <span className="text-xl font-black text-slate-200 w-6">{i + 1}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-800 text-sm">{item.totalQty} sold</p>
                        <p className="text-xs text-slate-400">{fmt(item.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileText size={18} className="text-violet-600" />
                <h2 className="font-bold text-slate-700">Bill Summary</h2>
              </div>
              <div className="divide-y divide-slate-50">
                {[
                  { label: "Total Invoices", value: data?.totalInvoices || 0, fmt: false },
                  { label: "Today's Bills", value: data?.todayInvoices || 0, fmt: false },
                  { label: "This Month's Revenue", value: data?.monthRevenue, fmt: true },
                  { label: "Today's Revenue", value: data?.todayRevenue, fmt: true },
                  { label: "Pending Collections", value: data?.pendingAmount, fmt: true },
                  { label: "Pending Bills", value: data?.pendingCount || 0, fmt: false },
                ].map(({ label, value, fmt: isFmt }) => (
                  <div key={label} className="flex justify-between items-center px-6 py-4">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`text-sm font-black ${label.includes('Pending') && value > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {isFmt ? fmt(value) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
