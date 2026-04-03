const express = require('express');
const router = express.Router();
const { getSalesReport, getPnL, getTopProducts, getDashboardSummary, createExpense, getExpenses, getCategoryStats } = require('../controllers/reportController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/dashboard', getDashboardSummary);
router.get('/sales', getSalesReport);
router.get('/pnl', getPnL);
router.get('/top-products', getTopProducts);
router.get('/category-stats', getCategoryStats);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);

module.exports = router;
