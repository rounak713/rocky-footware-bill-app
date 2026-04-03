import React, { useEffect, useState, useCallback } from 'react';
import { FileText, Printer, Download, Eye, X, Trash2, Search, Filter } from 'lucide-react';
import API from '../services/api';
import PrintableInvoice from '../components/PrintableInvoice';
import html2pdf from 'html2pdf.js';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PAID', label: 'Paid' },
  { value: 'UNPAID', label: 'Unpaid' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      const res = await API.get('/invoices', { params });
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const openInvoice = async (inv) => {
    setSelectedInvoice(inv);
    setDetailsLoading(true);
    try {
      const res = await API.get(`/invoices/${inv.id}`);
      setInvoiceDetails(res.data.data);
    } catch {
      alert('Failed to load invoice details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeInvoice = () => {
    setSelectedInvoice(null);
    setInvoiceDetails(null);
  };

  const handleDelete = async (inv, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete invoice ${inv.invoiceNo}? This cannot be undone.`)) return;
    try {
      await API.delete(`/invoices/${inv.id}`);
      setInvoices(prev => prev.filter(i => i.id !== inv.id));
      if (selectedInvoice?.id === inv.id) closeInvoice();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete invoice');
    }
  };

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!invoiceDetails) return;
    const element = document.getElementById('printable-invoice-container');
    html2pdf().set({
      margin: 10,
      filename: `${invoiceDetails.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'Japan You 6 Envelope', orientation: 'portrait' },
    }).from(element).save();
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto print:hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Invoices</h1>
            <p className="text-slate-500 mt-1">History of all generated bills</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by invoice number or customer name…"
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition"
            />
          </div>
          <div className="relative">
            <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => setStatus(e.target.value)}
              className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm appearance-none transition cursor-pointer"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="animate-pulse bg-white rounded-2xl h-96 border border-slate-100" />
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {invoices.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 text-slate-200" />
                <p className="text-lg font-semibold">No invoices found</p>
                <p className="text-sm">Try adjusting your search or filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Invoice No</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">{inv.invoiceNo}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          {' '}
                          <span className="text-xs text-slate-400">
                            {new Date(inv.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {inv.customer ? inv.customer.name : <span className="text-slate-400 italic">Walk-in</span>}
                        </td>
                        <td className="px-6 py-4 font-black text-slate-800">{fmt(inv.total)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                              inv.status === 'UNPAID' ? 'bg-amber-100 text-amber-700' :
                                inv.status === 'PARTIAL' ? 'bg-blue-100 text-blue-700' :
                                  'bg-red-100 text-red-700'
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openInvoice(inv)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-lg transition text-xs"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              onClick={(e) => handleDelete(inv, e)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-lg transition text-xs"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Footer count */}
        {!loading && invoices.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 text-right">{invoices.length} invoice(s) shown</p>
        )}

        {/* View / Print Modal */}
        {selectedInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <h2 className="text-xl font-black text-slate-800">Invoice {selectedInvoice.invoiceNo}</h2>
                <div className="flex gap-3 items-center">
                  <button onClick={handlePrint} disabled={!invoiceDetails} className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-xl font-semibold text-slate-700 transition text-sm disabled:opacity-40">
                    <Printer size={15} /> Print
                  </button>
                  <button onClick={handleDownloadPDF} disabled={!invoiceDetails} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold transition text-sm disabled:opacity-40">
                    <Download size={15} /> Save PDF
                  </button>
                  <button onClick={closeInvoice} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition ml-1">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-slate-100/60 flex justify-center">
                {detailsLoading || !invoiceDetails ? (
                  <div className="text-slate-400 font-semibold mt-20 animate-pulse">Loading Invoice Details…</div>
                ) : (
                  <div className="bg-white shadow-lg w-full max-w-[800px]" id="printable-invoice-container">
                    <PrintableInvoice
                      invoice={invoiceDetails}
                      cartItems={invoiceDetails.items}
                      customer={invoiceDetails.customer}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Print only view */}
      <div className="hidden print:block w-full bg-white">
        {invoiceDetails && (
          <PrintableInvoice
            invoice={invoiceDetails}
            cartItems={invoiceDetails.items}
            customer={invoiceDetails.customer}
          />
        )}
      </div>
    </>
  );
}
