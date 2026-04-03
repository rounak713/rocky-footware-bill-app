import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, CreditCard, Banknote, Smartphone,
  UserPlus, CheckCircle2, Trash2, X, Printer, Download, ChevronDown, PlusSquare, Search, Package
} from 'lucide-react';
import API from '../services/api';
import PrintableInvoice from '../components/PrintableInvoice';
import html2pdf from 'html2pdf.js';

const PAYMENT_MODES = [
  { id: 'UPI',   icon: Smartphone, label: 'UPI'  },
  { id: 'CASH',  icon: Banknote,   label: 'Cash' },
  { id: 'CARD',  icon: CreditCard, label: 'Card' },
  { id: 'UDHAAR',icon: ChevronDown, label: 'Udhaar' },
];

export default function POSBilling() {
  const safeParse = (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  };

  const [cart, setCart]             = useState(() => safeParse('pos_cart', []));
  const [customer, setCustomer]     = useState(() => safeParse('pos_customer', null));
  const [custSearch, setCustSearch] = useState('');
  const [customers, setCustomers]   = useState([]);
  const [payMode, setPayMode]       = useState(() => localStorage.getItem('pos_payMode') || 'CASH');
  const [discount, setDiscount]     = useState(() => localStorage.getItem('pos_discount') || '');
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState(null);

  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
    localStorage.setItem('pos_customer', JSON.stringify(customer));
    localStorage.setItem('pos_payMode', payMode);
    localStorage.setItem('pos_discount', discount);
  }, [cart, customer, payMode, discount]);
  
  // Custom manual item form
  const [itemForm, setItemForm] = useState({ name: '', price: '', qty: 1 });

  // Inventory search
  const [invSearch, setInvSearch] = useState('');
  const [invCategory, setInvCategory] = useState('');
  const [invResults, setInvResults] = useState([]);
  const invSearchRef = useRef(null);

  // Quick customer add form
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '' });

  // 1. Customer Dropdown Search
  useEffect(() => {
    if (!custSearch.trim()) { setCustomers([]); return; }
    const t = setTimeout(() => {
      API.get('/customers', { params: { search: custSearch } })
        .then(r => setCustomers(r.data.data || []))
        .catch(() => setCustomers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [custSearch]);

  // 2. Inventory Dropdown Search
  useEffect(() => {
    if (!invSearch.trim() && !invCategory) { setInvResults([]); return; }
    const t = setTimeout(() => {
      API.get('/products', { params: { search: invSearch, category: invCategory } })
        .then(r => {
          // Extract & flatten all variants from matching products
          const products = r.data.data || [];
          let allVariants = [];
          products.forEach(p => {
            if (p.variants) {
              p.variants.forEach(v => {
                allVariants.push({ ...v, product: p });
              });
            }
          });
          setInvResults(allVariants);
        })
        .catch(() => setInvResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [invSearch, invCategory]);

  // Auto-close dropdowns on click outside (optional polish)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (invSearchRef.current && !invSearchRef.current.contains(e.target)) {
        setInvResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNewCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) return;
    try {
      setLoading(true);
      const res = await API.post('/customers', newCustomerForm);
      setCustomer(res.data.data); // select them immediately
      setShowNewCustomer(false);
      setNewCustomerForm({ name: '', phone: '', email: '' });
      setCustSearch('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const addManualItem = (e) => {
    e.preventDefault();
    if (!itemForm.name || !itemForm.price) return;
    
    const newItem = {
      id: 'manual-' + Date.now(),
      variantId: null,
      customName: itemForm.name,
      price: itemForm.price,
      qty: parseInt(itemForm.qty) || 1,
    };
    
    setCart([newItem, ...cart]);
    setItemForm({ name: '', price: '', qty: 1 });
  };

  const addInventoryItem = (variant) => {
    // Check if variant is already in cart
    const existing = cart.find(i => i.variantId === variant.id);
    if (existing) {
      if (existing.qty + 1 > variant.stock) {
        alert('Cannot add more than available stock!');
        return;
      }
      updateQty(existing.id, existing.qty + 1);
    } else {
      if (variant.stock < 1) {
        alert('Item is out of stock!');
        return;
      }
      const newItem = {
        id: 'inv-' + variant.id + '-' + Date.now(),
        variantId: variant.id,
        customName: `${variant.product.name} (Size: ${variant.size})`,
        price: variant.price,
        qty: 1,
        maxStock: variant.stock,
      };
      setCart([newItem, ...cart]);
    }
    setInvSearch('');
    setInvResults([]);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        if (i.variantId && qty > i.maxStock) {
          alert('Cannot exceed available inventory stock!');
          return i;
        }
        return { ...i, qty };
      }
      return i;
    }));
  };

  const updatePrice = (id, newPrice) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, price: newPrice } : i));
  };

  const subtotal = cart.reduce((acc, i) => acc + parseFloat(i.price) * i.qty, 0);
  const discountPercent = parseFloat(discount) || 0;
  const discountAmt = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmt;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await API.post('/invoices', {
        customerId: customer?.id || null,
        paymentMode: payMode,
        discount: discountAmt,
        items: cart.map(i => ({
          variantId: i.variantId || null,
          customName: i.customName,
          qty: i.qty,
          unitPrice: parseFloat(i.price),
          taxRate: 0,
          discount: 0,
        })),
      });
      // Store the final cart and customer so it can be printed easily
      setSuccess({ invoice: res.data.data, cart: [...cart], customer });
      setCart([]);
      setDiscount('');
      setCustomer(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Billing failed. Check stock levels.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!success) return;
    const element = document.getElementById('pdf-invoice-container');
    if (!element) return;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    element.style.display = 'block';
    const opt = {
      margin: 10,
      filename: `Invoice_${success.invoice.invoiceNo}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
    });
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row bg-slate-50 font-sans relative print:hidden min-h-[calc(100vh-64px)] md:min-h-screen">
        {/* ── LEFT PANEL ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col p-4 md:p-8 gap-5 overflow-y-visible lg:overflow-y-auto h-auto lg:max-h-screen">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">New Invoice</h1>

          {/* Quick Inventory Search */}
          <div className="relative z-20 flex gap-3" ref={invSearchRef}>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={20} className="text-slate-400" />
              </div>
              <input
                value={invSearch}
                onChange={e => setInvSearch(e.target.value)}
                placeholder="Search Inventory by Product Name, Brand, or SKU... (or use barcode scanner here)"
                className="w-full h-[54px] bg-white pl-12 pr-4 py-4 rounded-2xl border-2 border-transparent shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition font-medium text-slate-700"
              />
            </div>
            <select
               value={invCategory}
               onChange={e => setInvCategory(e.target.value)}
               className="w-48 h-[54px] bg-white px-4 border-2 border-transparent rounded-2xl outline-none focus:border-blue-500 transition shadow-sm font-semibold text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M5%207.5L10%2012.5L15%207.5%22%20stroke=%22%2394A3B8%22%20stroke-width=%221.5%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_1rem_center]"
            >
               <option value="">All Categories</option>
               {['Sneakers', 'Sandals', 'Formal', 'Sports', 'Kids'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {invResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
                <div className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Inventory Matches
                </div>
                {invResults.map(v => (
                  <button
                    key={v.id}
                    onClick={() => addInventoryItem(v)}
                    className="w-full text-left px-5 py-3 hover:bg-blue-50 transition border-b border-slate-50 last:border-0 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-800">{v.product.name} <span className="text-blue-600 ml-1">Size {v.size}</span></p>
                      <p className="text-xs text-slate-500 mt-0.5">SKU: {v.sku} {v.barcode ? `| Barcode: ${v.barcode}` : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">{fmt(v.price)}</p>
                      <p className={`text-xs font-semibold ${v.stock > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {v.stock > 0 ? `${v.stock} in stock` : 'Out of Stock'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 my-1">
            <hr className="flex-1 border-slate-200" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">OR</span>
            <hr className="flex-1 border-slate-200" />
          </div>

          {/* Manual Item Form */}
          <form onSubmit={addManualItem} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-end gap-3 hover:border-slate-300 transition">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <PlusSquare size={14} /> Add Custom / Un-tracked Item
              </label>
              <input required value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} placeholder="e.g. Shoe Polish, Carry Bag" className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" />
            </div>
            <div className="w-32">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Price (₹)</label>
              <input required type="number" min="0" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: e.target.value})} placeholder="0.00" className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Qty</label>
              <input required type="number" min="1" value={itemForm.qty} onChange={e => setItemForm({...itemForm, qty: e.target.value})} className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition" />
            </div>
            <button type="submit" className="px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl h-[50px] transition">
              Add
            </button>
          </form>

          {/* Cart Items */}
          <div className="flex-1 mt-2">
            {cart.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-300 gap-3 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
                <ShoppingCart size={56} />
                <p className="text-lg font-semibold text-slate-400">Cart is empty</p>
                <p className="text-sm text-slate-300">Add an item to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 shadow-sm hover:border-slate-300 hover:shadow-md transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-lg">{item.customName}</p>
                        {item.variantId ? (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Package size={10} /> Inventory
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider">
                            Manual
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1 border border-slate-100">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm font-bold text-slate-600 flex items-center justify-center transition">−</button>
                      <span className="w-8 text-center font-bold text-slate-800">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-8 h-8 rounded-lg hover:bg-white hover:shadow-sm font-bold text-slate-600 flex items-center justify-center transition">+</button>
                    </div>
                    <div className="text-right w-32 flex flex-col items-end gap-1">
                      <div className="flex items-center gap-0.5">
                        <span className="text-xs text-slate-400 font-bold">₹</span>
                        <input 
                          type="number"
                          value={item.price}
                          onChange={e => updatePrice(item.id, e.target.value)}
                          className="w-20 text-xs text-right bg-slate-50 border border-transparent hover:border-slate-300 focus:border-blue-400 focus:bg-white rounded outline-none transition py-1 px-1.5 font-bold text-slate-600"
                          title="Edit Unit Price"
                        />
                      </div>
                      <p className="font-black text-slate-800 text-lg leading-tight mt-1">{fmt(parseFloat(item.price || 0) * item.qty)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition ml-2 p-2 hover:bg-red-50 rounded-lg">
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL (Checkout) ──────────────────────────────── */}
        <div className="w-full lg:w-[450px] bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-2xl relative z-10 shrink-0 h-auto lg:h-screen lg:sticky lg:top-0">
          <div className="p-7 flex-1 space-y-6">
            
            {/* Customer Area */}
            <div>
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100/50">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <UserPlus size={14} /> Customer
                </label>
                {!customer && !showNewCustomer && (
                  <button onClick={() => setShowNewCustomer(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition uppercase tracking-wider">+ New</button>
                )}
                {!customer && showNewCustomer && (
                  <button onClick={() => setShowNewCustomer(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition uppercase tracking-wider">Cancel</button>
                )}
              </div>

              {customer ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-bold text-blue-800 text-sm">{customer.name}</p>
                    <p className="text-xs text-blue-600">{customer.phone}</p>
                  </div>
                  <button onClick={() => setCustomer(null)} className="text-blue-400 hover:bg-blue-100 p-1.5 rounded-lg transition"><X size={18} /></button>
                </div>
              ) : showNewCustomer ? (
                <form onSubmit={handleAddNewCustomer} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <input required autoFocus value={newCustomerForm.name} onChange={e => setNewCustomerForm({...newCustomerForm, name: e.target.value})} placeholder="Customer Name *" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  <input required value={newCustomerForm.phone} onChange={e => setNewCustomerForm({...newCustomerForm, phone: e.target.value})} placeholder="Phone Number *" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                  <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-lg transition shadow-sm">Save & Select</button>
                </form>
              ) : (
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    value={custSearch}
                    onChange={e => setCustSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full pl-9 pr-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white rounded-xl text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition"
                  />
                  {customers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {customers.slice(0, 5).map(c => (
                        <button key={c.id} onClick={() => { setCustomer(c); setCustSearch(''); setCustomers([]); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition">
                          <p className="font-semibold text-slate-800 text-sm">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.phone}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Mode */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2.5">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_MODES.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setPayMode(id)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold border-2 transition ${
                      payMode === id
                        ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <Icon size={18} /> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Discount (%)</label>
              <input
                type="number"
                value={discount}
                min="0"
                onChange={e => setDiscount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white rounded-xl text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-400 transition"
              />
            </div>

            {/* Bill Summary */}
            <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-400"></div>
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-sm text-slate-300"><span>Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-sm text-emerald-400 font-bold"><span>Discount</span><span>− {fmt(discountAmt)}</span></div>}

                <div className="border-t-2 border-slate-700 pt-4 flex justify-between items-end mt-2">
                  <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Grand Total</span>
                  <span className="text-4xl font-black tracking-tighter">{fmt(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout */}
          <div className="p-6 border-t border-slate-100 bg-white">
            {/* Checkout Button */}
            <button
              onClick={handleCheckout}
              disabled={loading || cart.length === 0 || (payMode === 'UDHAAR' && !customer)}
              className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl outline-none transition flex items-center justify-center gap-2 mt-6 ${
                cart.length === 0 || (payMode === 'UDHAAR' && !customer)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 active:scale-[0.98]'
              }`}
            >
              {loading ? 'Processing...' : (payMode === 'UDHAAR' && !customer ? 'Select Customer for Udhaar' : `Complete Checkout — ${fmt(total)}`)}
            </button>
          </div>
        </div>

        {/* ── SUCCESS OVERLAY ─────────────────────────────────────── */}
        {success && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 drop-shadow-sm">
                <CheckCircle2 size={44} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-1">Invoice Ready!</h2>
              <p className="text-slate-500 mb-4">Invoice <span className="font-bold text-slate-700">#{success.invoice.invoiceNo}</span></p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">Amount Paid</p>
                <p className="text-4xl font-black text-blue-700 leading-none">{fmt(success.invoice.total)}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={handlePrint} className="flex-1 flex flex-col items-center justify-center gap-1.5 border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-3 rounded-xl text-slate-700 font-bold transition">
                  <Printer size={20} /> <span className="text-xs">Print Bill</span>
                </button>
                <button onClick={handleDownloadPDF} className="flex-1 flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 py-3 rounded-xl text-white font-bold transition shadow-lg shadow-slate-900/20">
                  <Download size={20} /> <span className="text-xs">Download PDF</span>
                </button>
              </div>
              <button
                onClick={() => setSuccess(null)}
                className="w-full mt-3 bg-blue-50 text-blue-700 hover:bg-blue-100 py-3.5 rounded-xl font-bold transition"
              >
                Start New Bill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── PRINT VIEW (Only visible during print) ──────────────── */}
      <div className="hidden print:block w-full bg-white text-black p-0 m-0" id="printable-invoice-container">
        {success && (
          <PrintableInvoice
            invoice={success.invoice}
            cartItems={success.cart}
            customer={success.customer}
          />
        )}
      </div>

      {/* ── PDF OFF-SCREEN CONTAINER (for html2pdf, always in DOM but hidden) */}
      <div id="pdf-invoice-container" style={{ display: 'none', background: 'white', width: 800 }}>
        {success && (
          <PrintableInvoice
            invoice={success.invoice}
            cartItems={success.cart}
            customer={customer}
          />
        )}
      </div>
    </>
  );
}
