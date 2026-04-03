const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  updateStock, getVariantByBarcode, getLowStock,
} = require('../controllers/productController');
const { authMiddleware, adminOnly } = require('../middlewares/auth');

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/low-stock', getLowStock);
router.get('/:id', getProduct);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

// Variant routes
router.patch('/variants/:id/stock', updateStock);
router.get('/variants/barcode/:barcode', getVariantByBarcode);

module.exports = router;
