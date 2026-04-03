const prisma = require('../config/db');

// GET /api/customers
const getCustomers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          }
        : {},
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: customers });
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/:id
const getCustomer = async (req, res, next) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        invoices: { orderBy: { createdAt: 'desc' }, take: 20 },
        payments: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// GET /api/customers/:id/ledger
const getCustomerLedger = async (req, res, next) => {
  try {
    const customerId = parseInt(req.params.id);
    const [invoices, payments] = await Promise.all([
      prisma.invoice.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } }),
      prisma.payment.findMany({ where: { customerId }, orderBy: { createdAt: 'desc' } }),
    ]);

    // Merge and sort by date for a unified ledger view
    const ledger = [
      ...invoices.map(inv => ({ type: 'INVOICE', ...inv })),
      ...payments.map(pay => ({ type: 'PAYMENT', ...pay })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, data: ledger });
  } catch (err) {
    next(err);
  }
};

// POST /api/customers
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const customer = await prisma.customer.create({ data: { name, phone, email } });
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// PUT /api/customers/:id
const updateCustomer = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { name, phone, email },
    });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/customers/:id/dues
const updateDues = async (req, res, next) => {
  try {
    const { creditBalance } = req.body;
    const customer = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: { creditBalance: parseFloat(creditBalance) || 0 },
    });
    res.json({ success: true, data: customer });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomers, getCustomer, getCustomerLedger, createCustomer, updateCustomer, updateDues };
