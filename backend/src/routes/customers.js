const express = require('express');
const router = express.Router();
const { getCustomers, getCustomer, getCustomerLedger, createCustomer, updateCustomer, updateDues } = require('../controllers/customerController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomer);
router.put('/:id', updateCustomer);
router.patch('/:id/dues', updateDues);
router.get('/:id/ledger', getCustomerLedger);

module.exports = router;
