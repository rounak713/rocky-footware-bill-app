import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, Receipt, BarChart3, Plus } from 'lucide-react';
import API from '../services/api';

export default function Reports() {
  const [pnl, setPnl]         = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [month, setMonth]     = useState(new Date().toISOString().slice(0, 7));
  const [expForm, setExpForm] = useState({ category: '', amount: '', note: '', date: '' });
  const [showExpModal, setShowExpModal] = useState(false);

  const fetchAll = () => {
    API.get('/reports/pnl', { params: { month } }).then(r => setPnl(r.data.data)).catch(() => {});
    API.get('/reports/top-products', { params: { month } }).then(r => setTopProducts(r.data.data)).catch(() => {});
    API.get('/reports/category-stats', { params: { month } }).then(r => setCategoryStats(r.data.data)).catch(() => {});
    API.get('/reports/expenses').then(r => setExpenses(r.data.data)).catch(() => {});
  };

  useEffect(() => { fetchAll(); }, [month]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await API.post('/reports/expenses', { ...expForm, amount: parseFloat(expForm.amount) });
      setShowExpModal(false);
      setExpForm({ category: '', amount: '', note: '', date: '' });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add expense');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Reports</h1>
          <p className="text-slate-500 mt-1">Profit, loss, and top-selling shoes</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition bg-white shadow-sm"
        />
      </div>

      {/* P&L Summary */}
      {pnl && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {[
            { label: 'Revenue', value: fmt(pnl.revenue), icon: IndianRupee, color: 'bg-blue-600', positive: true },
            { label: 'Expenses', value: fmt(pnl.expenses), icon: TrendingDown, color: 'bg-red-500', positive: false },
            { label: 'Net Profit', value: fmt(pnl.profit), icon: TrendingUp, color: pnl.profit >= 0 ? 'bg-emerald-600' : 'bg-red-600', positive: pnl.profit >= 0 },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-medium">{label}</p>
                <p className="text-3xl font-black text-slate-800 mt-0.5">{value}</p>
                <p className="text-xs text-slate-400 mt-1">{month}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item Sales Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[800px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-600" />
              <h2 className="font-bold text-slate-700">Detailed Item Sales</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{month}</span>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No sales data for {month}</p>
          ) : (
            <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
              {topProducts.map((item, i) => (
                <div key={i} className="flex items-center px-6 py-4 gap-4 hover:bg-slate-50 transition">
                  <span className="text-sm font-black text-slate-300 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{item.totalQty} sold</p>
                    <p className="text-xs text-slate-400">{fmt(item.totalRevenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Sales Report */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[800px]">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-violet-600" />
              <h2 className="font-bold text-slate-700">Sales by Category</h2>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{month}</span>
          </div>
          {categoryStats.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No category data for {month}</p>
          ) : (
            <div className="divide-y divide-slate-50 overflow-y-auto flex-1">
              {categoryStats.map((cat, i) => (
                <div key={i} className="flex items-center px-6 py-4 gap-4 hover:bg-slate-50 transition">
                  <span className="text-sm font-black text-slate-300 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{cat.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{cat.qty} sold</p>
                    <p className="text-xs text-slate-400">{fmt(cat.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-red-500" />
              <h2 className="font-bold text-slate-700">Expenses</h2>
            </div>
            <button
              onClick={() => setShowExpModal(true)}
              className="flex items-center gap-1 text-sm text-blue-600 font-semibold hover:underline"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {expenses.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No expenses logged</p>
          ) : (
            <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {expenses.map((exp, i) => (
                <div key={i} className="flex items-center justify-between px-6 py-3.5">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{exp.category}</p>
                    <p className="text-xs text-slate-400">{exp.note || '—'} · {new Date(exp.date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <p className="font-black text-red-600 text-sm">{fmt(exp.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">Add Expense</h2>
              <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleAddExpense} className="p-8 space-y-5">
              {[['category', 'Category (e.g. Rent, Salary)', 'text', true], ['amount', 'Amount (₹)', 'number', true], ['note', 'Note (optional)', 'text', false], ['date', 'Date', 'date', false]].map(([field, label, type, req]) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input
                    type={type}
                    required={req}
                    value={expForm[field]}
                    onChange={e => setExpForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
