const prisma = require('../config/db');

// Utility: generate unique invoice number like INV-2026-048231
const generateInvoiceNo = async () => {
  const year = new Date().getFullYear();
  // Use timestamp (ms) + 2-digit random suffix to avoid collisions
  const ts = Date.now().toString().slice(-5);
  const rand = String(Math.floor(Math.random() * 99)).padStart(2, '0');
  return `INV-${year}-${ts}${rand}`;
};

// POST /api/invoices  — runs as full DB transaction
const createInvoice = async (req, res, next) => {
  const { customerId, items, discount = 0, paymentMode, notes } = req.body;
  // items: [{ variantId, qty, unitPrice, taxRate, discount }]

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Validate stock for each item
      for (const item of items) {
        if (item.variantId) {
          const variant = await tx.variant.findUnique({ where: { id: item.variantId } });
          if (!variant) throw new Error(`Variant ${item.variantId} not found`);
          if (variant.stock < item.qty) {
            throw new Error(`Insufficient stock for ${variant.sku}. Available: ${variant.stock}`);
          }
        }
      }

      // 2. Calculate totals
      let subtotal = 0;
      const invoiceItems = items.map(item => {
        const taxable = item.unitPrice * item.qty;
        const itemDiscount = item.discount || 0;
        const total = taxable - itemDiscount;
        subtotal += taxable;
        return { ...item, total };
      });

      const discountAmount = parseFloat(discount);
      const taxableBase = subtotal - discountAmount;
      // Tax explicitly removed
      const cgst = 0;
      const sgst = 0;
      const igst = 0;
      const total = taxableBase;

      // 3. Create Invoice
      const invoiceNo = await generateInvoiceNo();
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          customerId: customerId || null,
          userId: req.user.id,
          subtotal,
          cgst,
          sgst,
          igst,
          discount: discountAmount,
          total,
          paymentMode,
          status: paymentMode === 'UDHAAR' ? 'UNPAID' : 'PAID',
          notes,
          items: {
            create: invoiceItems.map(i => ({
              variantId: i.variantId || null,
              customName: i.customName || null,
              customCategory: i.customCategory || null,
              qty: i.qty,
              unitPrice: i.unitPrice,
              taxRate: i.taxRate,
              discount: i.discount || 0,
              total: i.total,
            })),
          },
        },
        include: { items: true },
      });

      // 4. Decrement stock for each variant
      for (const item of items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.qty } },
          });
        }
      }

      // 5. Create Payment record & update customer credit if UDHAAR
      await tx.payment.create({
        data: {
          invoiceId: invoice.id,
          customerId: customerId || null,
          amount: paymentMode === 'UDHAAR' ? 0 : total,
          mode: paymentMode,
        },
      });

      if (paymentMode === 'UDHAAR' && customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { creditBalance: { increment: total } },
        });
      }

      return invoice;
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices
const getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const invoices = await prisma.invoice.findMany({
      where,
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { customer: true, user: { select: { name: true } } },
    });
    const total = await prisma.invoice.count({ where });
    res.json({ success: true, data: invoices, meta: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/invoices/:id
const getInvoice = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        customer: true,
        user: { select: { name: true } },
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
    });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/invoices/:id/cancel
const cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'CANCELLED' },
    });
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/invoices/:id
const deleteInvoice = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    // Fetch the invoice fully to know what to restore
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, payments: true }
    });

    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });

    await prisma.$transaction(async (tx) => {
      // 1. Restore stock for any tracked inventory items
      for (const item of invoice.items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.qty } }
          });
        }
      }

      // 2. Revert Customer Credit if this was an UDHAAR bill
      if (invoice.paymentMode === 'UDHAAR' && invoice.customerId) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { creditBalance: { decrement: invoice.total } }
        });
      }

      // 3. Purge dependencies and delete invoice
      await tx.payment.deleteMany({ where: { invoiceId: id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.delete({ where: { id } });
    });

    res.json({ success: true, message: 'Invoice deleted and stock restored successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createInvoice, getInvoices, getInvoice, cancelInvoice, deleteInvoice };
