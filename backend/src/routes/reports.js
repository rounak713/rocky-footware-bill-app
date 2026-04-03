const express = require('express');
const router = express.Router();
const { getSalesReport, getPnL, getTopProducts, getDashboardSummary, createExpense, getExpenses } = require('../controllers/reportController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/dashboard', getDashboardSummary);
router.get('/sales', getSalesReport);
router.get('/pnl', getPnL);
router.get('/top-products', getTopProducts);

router.get('/expenses', getExpenses);
router.post('/expenses', createExpense);

module.exports = router;
