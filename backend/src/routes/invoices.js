const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, getInvoice, cancelInvoice, deleteInvoice } = require('../controllers/invoiceController');
const { authMiddleware } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', getInvoices);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.patch('/:id/cancel', cancelInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
