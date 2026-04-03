import React from 'react';

export default function PrintableInvoice({ invoice, cartItems, customer, shopDetails }) {
  if (!invoice) return null;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  // Format dates: e.g., 14/8/2024
  const dateStr = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN');

  return (
    <div className="w-full max-w-[800px] mx-auto p-8 bg-white text-black font-sans text-sm">
      {/* Header */}
      <div className="text-center mb-6 pb-6 border-b-2 border-black">
        <h1 className="text-2xl font-black uppercase tracking-widest">ROCKY FOOTWEAR</h1>
        <p className="text-gray-600 mt-1.5 max-w-md mx-auto leading-relaxed">
          Near Padam Kapda Bazar, Kohamara Wadsa Gadchiroli Saoli Chandrapur Road, Wadsa, Gadchiroli - 441207, Maharashtra
        </p>
        <p className="text-gray-800 font-bold mt-1.5">Ph: 9420846395, 9356974693</p>
      </div>

      {/* Info Row */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Bill To</h3>
          <p className="font-bold text-lg">{customer?.name || 'Walk-in Customer'}</p>
          {customer && <p className="text-gray-600">Ph: {customer.phone}</p>}
        </div>
        <div className="text-right">
          <p className="font-bold text-lg mb-1">{invoice.invoiceNo}</p>
          <p className="text-gray-600">Date: {dateStr}</p>
          <p className="text-gray-600">Payment: <span className="font-bold text-black">{invoice.paymentMode}</span></p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-6 border-collapse">
        <thead>
          <tr className="border-y-2 border-black">
            <th className="py-3 font-bold">Item Description</th>
            <th className="py-3 font-bold text-center">Qty</th>
            <th className="py-3 font-bold text-right">Price</th>
            <th className="py-3 font-bold text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {cartItems.map((item, idx) => (
            <tr key={item.id || idx} className="border-b border-gray-200">
              <td className="py-3">{item.customName || item.productName || item.name}</td>
              <td className="py-3 text-center">{item.qty}</td>
              <td className="py-3 text-right">{fmt(item.price || item.unitPrice)}</td>
              <td className="py-3 text-right">{fmt((item.price || item.unitPrice) * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end pt-4">
        <div className="w-64 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal</span>
            <span>{fmt(invoice.subtotal)}</span>
          </div>
          {parseFloat(invoice.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Discount</span>
              <span>− {fmt(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-2 font-black text-xl">
            <span>TOTAL</span>
            <span>{fmt(invoice.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs text-gray-500 pt-6 border-t border-gray-200">
        <p>Thank you for shopping with us!</p>
        <p>Goods once sold will not be returned or exchanged without the original bill.</p>
      </div>
    </div>
  );
}
