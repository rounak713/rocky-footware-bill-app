const prisma = require('../config/db');

// GET /api/reports/sales?from=2024-01-01&to=2024-01-31
const getSalesReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const where = {
      status: { not: 'CANCELLED' },
      ...(from && to && {
        createdAt: { gte: new Date(from), lte: new Date(to) },
      }),
    };

    const [invoices, totalAgg] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        select: { id: true, invoiceNo: true, total: true, paymentMode: true, createdAt: true },
      }),
      prisma.invoice.aggregate({
        where,
        _sum: { subtotal: true, total: true, cgst: true, sgst: true, igst: true, discount: true },
        _count: { id: true },
      }),
    ]);

    // Group by payment mode
    const byMode = invoices.reduce((acc, inv) => {
      acc[inv.paymentMode] = (acc[inv.paymentMode] || 0) + parseFloat(inv.total);
      return acc;
    }, {});

    res.json({
      success: true,
      data: { summary: totalAgg._sum, count: totalAgg._count.id, byMode, invoices },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/pnl?month=2024-06
const getPnL = async (req, res, next) => {
  try {
    const { month } = req.query;
    let from, to;
    if (month) {
      from = new Date(`${month}-01`);
      to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
    }

    const dateFilter = from && to ? { gte: from, lte: to } : undefined;

    const [revenue, expenses] = await Promise.all([
      prisma.invoice.aggregate({
        where: { status: { not: 'CANCELLED' }, ...(dateFilter && { createdAt: dateFilter }) },
        _sum: { total: true },
      }),
      prisma.expense.aggregate({
        where: { ...(dateFilter && { date: dateFilter }) },
        _sum: { amount: true },
      }),
    ]);

    const totalRevenue = parseFloat(revenue._sum.total || 0);
    const totalExpenses = parseFloat(expenses._sum.amount || 0);

    res.json({
      success: true,
      data: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        profit: totalRevenue - totalExpenses,
        month: month || 'all-time',
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/top-products?month=2024-06
// Now retrieves sales for all items within the selected month
const getTopProducts = async (req, res, next) => {
  try {
    const { month } = req.query;
    let from, to;
    if (month) {
      from = new Date(`${month}-01`);
      to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
    }
    
    // We only want items from invoices that are NOT cancelled
    const invoicesInMonth = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' },
        ...(from && to && { createdAt: { gte: from, lte: to } })
      },
      select: { id: true }
    });
    
    const invoiceIds = invoicesInMonth.map(i => i.id);

    if (invoiceIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Group items by customName for the matched invoices
    const itemSales = await prisma.invoiceItem.groupBy({
      by: ['customName'],
      where: { 
        customName: { not: null },
        invoiceId: { in: invoiceIds }
      },
      _sum: { qty: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 1000,
    });

    res.json({
      success: true,
      data: itemSales.map(item => ({
        name: item.customName,
        totalQty: item._sum.qty,
        totalRevenue: item._sum.total,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/dashboard
const getDashboardSummary = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start of current month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todaySales, monthSales, totalCustomers, totalInvoices, pendingPayments] = await Promise.all([
      prisma.invoice.aggregate({
        where: { createdAt: { gte: today, lt: tomorrow }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.invoice.aggregate({
        where: { createdAt: { gte: monthStart }, status: { not: 'CANCELLED' } },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.customer.count(),
      prisma.invoice.count({ where: { status: { not: 'CANCELLED' } } }),
      prisma.invoice.aggregate({
        where: { status: 'UNPAID' },
        _sum: { total: true },
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        todayRevenue: parseFloat(todaySales._sum.total || 0),
        todayInvoices: todaySales._count.id,
        monthRevenue: parseFloat(monthSales._sum.total || 0),
        monthInvoices: monthSales._count.id,
        totalCustomers,
        totalInvoices,
        pendingAmount: parseFloat(pendingPayments._sum.total || 0),
        pendingCount: pendingPayments._count.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/expenses
const createExpense = async (req, res, next) => {
  try {
    const { category, amount, note, date } = req.body;
    const expense = await prisma.expense.create({ data: { category, amount, note, date: date ? new Date(date) : undefined } });
    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
};

// GET /api/expenses
const getExpenses = async (req, res, next) => {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { date: 'desc' } });
    res.json({ success: true, data: expenses });
  } catch (err) {
    next(err);
  }
};

// GET /api/reports/category-stats?month=2024-06
const getCategoryStats = async (req, res, next) => {
  try {
    const { month } = req.query;
    let from, to;
    if (month) {
      from = new Date(`${month}-01`);
      to = new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59);
    }
    
    // We only want items from invoices that are NOT cancelled
    const invoicesInMonth = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' },
        ...(from && to && { createdAt: { gte: from, lte: to } })
      },
      select: { id: true }
    });
    
    const invoiceIds = invoicesInMonth.map(i => i.id);

    if (invoiceIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const items = await prisma.invoiceItem.findMany({
      where: { invoiceId: { in: invoiceIds } },
      include: {
        variant: {
          include: { product: true }
        }
      }
    });

    const categoryMap = {};
    for (const item of items) {
      const category = item.variant?.product?.category || item.customCategory || 'Manual Entry';
      if (!categoryMap[category]) categoryMap[category] = { category, revenue: 0, qty: 0 };
      categoryMap[category].revenue += parseFloat(item.total || 0);
      categoryMap[category].qty += item.qty;
    }

    const data = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSalesReport, getPnL, getTopProducts, getDashboardSummary, createExpense, getExpenses, getCategoryStats };
