import React from 'react';

export default function PrintableInvoice({ invoice, cartItems, customer, shopDetails }) {
  if (!invoice) return null;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  // Format dates: e.g., 14/8/2024
  const dateStr = new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-IN');

  return (
    <div className="w-[80mm] mx-auto bg-white text-black font-sans text-xs pb-4" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
      {/* Header */}
      <div className="text-center mb-3 pb-2 border-b border-black border-dashed">
        <h1 className="text-xl font-black uppercase tracking-wide leading-tight">ROCKY FOOTWEAR</h1>
        <p className="text-[10px] mt-1 mb-1 leading-tight">
          Near Padam Kapda Bazar, Kohamara Wadsa Gadchiroli<br/>Saoli Chandrapur Road, Wadsa - 441207
        </p>
        <p className="font-bold text-[11px]">Ph: 9420846395, 9356974693</p>
      </div>

      {/* Info Row */}
      <div className="mb-3 border-b border-black border-dashed pb-2 text-[11px] leading-relaxed">
        <div className="flex justify-between">
          <span className="font-bold">Bill No:</span>
          <span>{invoice.invoiceNo}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Date:</span>
          <span>{dateStr} {new Date(invoice.createdAt || Date.now()).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="font-bold">Customer:</span>
          <span className="text-right truncate max-w-[120px]">{customer?.name || 'Walk-in'}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold">Mode:</span>
          <span>{invoice.paymentMode}</span>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full text-left mb-3">
        <thead>
          <tr className="border-b border-black text-[10px] uppercase">
            <th className="py-1 font-bold">Item</th>
            <th className="py-1 font-bold text-center w-8">Qty</th>
            <th className="py-1 font-bold text-right w-16">Amt</th>
          </tr>
        </thead>
        <tbody className="text-[11px]">
          {cartItems.map((item, idx) => (
            <tr key={item.id || idx}>
              <td className="py-1.5 align-top">
                <div className="font-semibold">{item.customName || item.productName || item.name}</div>
                <div className="text-[9px] text-gray-500">{fmt(item.price || item.unitPrice)} each</div>
              </td>
              <td className="py-1.5 text-center align-top font-bold">{item.qty}</td>
              <td className="py-1.5 text-right align-top font-bold">{fmt((item.price || item.unitPrice) * item.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-black pt-2 mb-4">
        {parseFloat(invoice.discount) > 0 && (
          <div className="flex justify-between text-[11px] mb-1">
            <span>Subtotal:</span>
            <span>{fmt(invoice.subtotal)}</span>
          </div>
        )}
        {parseFloat(invoice.discount) > 0 && (
          <div className="flex justify-between text-[11px] mb-1">
            <span>Discount:</span>
            <span>− {fmt(invoice.discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-black border-dashed pt-1.5 mt-1 font-black text-sm">
          <span>GRAND TOTAL:</span>
          <span>{fmt(invoice.total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] mt-4 pt-2 border-t border-black border-dashed flex flex-col gap-1">
        <p className="font-bold uppercase tracking-wider text-[11px]">Thank You & Visit Again!</p>
        <p className="px-2 leading-tight">Goods once sold will not be returned or exchanged without original bill.</p>
        <p className="mt-2 text-[8px] italic">Powered by Rocky POS</p>
      </div>
    </div>
  );
}
