import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Users, Phone, CreditCard, ChevronRight, Edit3 } from 'lucide-react';
import API from '../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected]   = useState(null);
  const [ledger, setLedger]       = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  const fetchCustomers = () => {
    setLoading(true);
    API.get('/customers', { params: { search } })
      .then(r => setCustomers(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const fetchLedger = (id) => {
    API.get(`/customers/${id}/ledger`)
      .then(r => setLedger(r.data.data))
      .catch(() => setLedger([]));
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const handleSelect = (c) => {
    setSelected(c);
    fetchLedger(c.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/customers', form);
      setShowModal(false);
      setForm({ name: '', phone: '', email: '' });
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add customer');
    }
  };

  const handleEditCredit = async () => {
    const newBal = prompt(`Enter new exact outstanding credit for ${selected.name} (currently ${selected.creditBalance}):`, selected.creditBalance);
    if(newBal === null) return;
    try {
      await API.patch(`/customers/${selected.id}/dues`, { creditBalance: newBal });
      fetchCustomers();
      setSelected(prev => ({ ...prev, creditBalance: newBal }));
    } catch(err) {
      alert('Failed to update due balance');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Customers</h1>
          <p className="text-slate-500 mt-1">{customers.length} registered customers</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
        >
          <UserPlus size={20} /> Add Customer
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Customer List */}
        <div className="w-full md:w-1/2 flex flex-col h-auto md:h-screen">
          <div className="relative mb-4 shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pb-8">
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Users size={48} className="mx-auto mb-3 text-slate-200" />
                <p className="font-semibold">No customers found</p>
              </div>
            ) : (
              customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selected?.id === c.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> {c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {parseFloat(c.creditBalance) > 0 ? (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CreditCard size={11} /> {fmt(c.creditBalance)} due
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold">Cleared</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ledger Panel */}
        <div className="w-full md:flex-1 shrink-0 h-auto md:h-screen overflow-y-auto">
          {selected ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-white uppercase text-lg">
                    {selected.name[0]}
                  </div>
                  <div>
                    <h2 className="font-black text-slate-800 text-lg">{selected.name}</h2>
                    <p className="text-slate-500 text-sm">{selected.phone}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1.5">Outstanding Credit</p>
                    <div className="flex items-center gap-2 justify-end">
                      <p className={`text-2xl font-black ${parseFloat(selected.creditBalance) > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {fmt(selected.creditBalance)}
                      </p>
                      <button onClick={handleEditCredit} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded bg-slate-100 transition" title="Edit Balance">
                        <Edit3 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5">
                <h3 className="font-bold text-slate-600 text-sm uppercase tracking-wider mb-4">Transaction Ledger</h3>
                {ledger.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {ledger.map((entry, i) => (
                      <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="font-semibold text-slate-700 text-sm">
                            {entry.type === 'INVOICE' ? `Invoice #${entry.invoiceNo}` : `Payment`}
                          </p>
                          <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className={`font-black text-sm ${entry.type === 'INVOICE' ? 'text-slate-800' : 'text-emerald-600'}`}>
                          {entry.type === 'PAYMENT' ? '+ ' : ''}{fmt(entry.total || entry.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 py-24">
              <Users size={56} className="mb-4" />
              <p className="text-lg font-semibold text-slate-400">Select a customer</p>
              <p className="text-sm text-slate-300 mt-1">to view their transaction history</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800">New Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {[['name', 'Full Name', 'text', true], ['phone', 'Phone Number', 'tel', true], ['email', 'Email (optional)', 'email', false]].map(([field, label, type, req]) => (
                <div key={field}>
                  <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
                  <input
                    type={type}
                    required={req}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
