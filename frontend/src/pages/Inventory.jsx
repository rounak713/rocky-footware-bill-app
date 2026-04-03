import React, { useState, useEffect } from 'react';
import { Plus, Search, ChevronDown, ChevronUp, Package, Edit2, Trash2 } from 'lucide-react';
import API from '../services/api';

export default function Inventory() {
  const [products, setProducts]   = useState([]);
  const [search, setSearch]       = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [form, setForm] = useState({
    name: '', brand: '', category: '', description: '',
    variants: [{ size: 'UK 6', sku: '', price: '', stock: '', barcode: '' }],
  });

  const fetchProducts = () => {
    setLoading(true);
    API.get('/products', { params: { search } })
      .then(r => setProducts(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const addVariantRow = () =>
    setForm(f => ({ ...f, variants: [...f.variants, { size: '', sku: '', price: '', stock: '', barcode: '' }] }));

  const handleVariantChange = (i, field, val) => {
    const v = [...form.variants];
    v[i][field] = val;
    setForm(f => ({ ...f, variants: v }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/products', {
        ...form,
        variants: form.variants.map(v => ({
          ...v,
          price: parseFloat(v.price),
          stock: parseInt(v.stock),
        })),
      });
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create product');
    }
  };

  const categoryColors = {
    Sneakers: 'bg-blue-100 text-blue-700',
    Sandals: 'bg-amber-100 text-amber-700',
    Formal: 'bg-violet-100 text-violet-700',
    Sports: 'bg-emerald-100 text-emerald-700',
    Kids: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Inventory</h1>
          <p className="text-slate-500 mt-1">{products.length} products listed</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-3 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          <Plus size={20} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or brand..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
        />
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <Package size={56} className="mx-auto mb-4 text-slate-200" />
          <p className="text-xl font-semibold">No products found</p>
          <p className="text-sm mt-1">Add your first product to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 transition-all">
              <button
                onClick={() => setExpanded(expanded === product.id ? null : product.id)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Package size={20} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.brand} • {product.variants?.length || 0} sizes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {product.category && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${categoryColors[product.category] || 'bg-slate-100 text-slate-600'}`}>
                      {product.category}
                    </span>
                  )}
                  {expanded === product.id ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>
              </button>

              {expanded === product.id && (
                <div className="border-t border-slate-100 px-6 pb-5">
                  <div className="overflow-x-auto max-w-full">
                    <table className="w-full text-sm mt-4 min-w-[500px]">
                      <thead>
                        <tr className="text-left text-slate-500 text-xs uppercase tracking-wider">
                          <th className="pb-3 px-2">Size</th>
                          <th className="pb-3 px-2">SKU</th>
                          <th className="pb-3 px-2">Barcode</th>
                          <th className="pb-3 px-2 text-right">Price</th>
                          <th className="pb-3 px-2 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants?.map(v => (
                          <tr key={v.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                            <td className="py-3 px-2 font-semibold text-slate-700 whitespace-nowrap">{v.size}</td>
                            <td className="py-3 px-2 font-mono text-slate-500 text-xs">{v.sku}</td>
                            <td className="py-3 px-2 text-slate-400 text-xs">{v.barcode || '—'}</td>
                            <td className="py-3 px-2 text-right font-bold text-slate-800 whitespace-nowrap">₹{Number(v.price).toLocaleString('en-IN')}</td>
                            <td className="py-3 px-2 text-right">
                              <span className={`font-bold text-xs px-2.5 py-1 rounded-full whitespace-nowrap ${v.stock <= v.lowStockLimit ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {v.stock}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-xl font-black text-slate-800">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[['name', 'Product Name *'], ['brand', 'Brand'], ['category', 'Category'], ['description', 'Description']].map(([field, label]) => (
                  <div key={field} className={field === 'description' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5">{label}</label>
                    <input
                      required={field === 'name'}
                      value={form[field]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-700">Size Variants</h3>
                  <button type="button" onClick={addVariantRow} className="text-sm text-blue-600 font-semibold hover:underline">+ Add Size</button>
                </div>
                <div className="space-y-3">
                  {form.variants.map((v, i) => (
                    <div key={i} className="grid grid-cols-5 gap-2">
                      {[['size', 'Size'], ['sku', 'SKU'], ['barcode', 'Barcode'], ['price', '₹ Price'], ['stock', 'Stock']].map(([field, ph]) => (
                        <input
                          key={field}
                          value={v[field]}
                          onChange={e => handleVariantChange(i, field, e.target.value)}
                          placeholder={ph}
                          required={['size', 'sku', 'price', 'stock'].includes(field)}
                          className="px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400 transition"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
