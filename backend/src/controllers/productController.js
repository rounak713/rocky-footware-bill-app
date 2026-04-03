const prisma = require('../config/db');

// GET /api/products
const getProducts = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const products = await prisma.product.findMany({
      where: {
        ...(search && { name: { contains: search, mode: 'insensitive' } }),
        ...(category && { category }),
      },
      include: {
        variants: {
          orderBy: { size: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
const getProduct = async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { variants: true },
    });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, brand, category, description, imageUrl, variants } = req.body;
    const product = await prisma.product.create({
      data: {
        name, brand, category, description, imageUrl,
        variants: {
          create: variants || [],
        },
      },
      include: { variants: true },
    });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { name, brand, category, description } = req.body;
    const product = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { name, brand, category, description },
    });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/variants/:id/stock
const updateStock = async (req, res, next) => {
  try {
    const { stock } = req.body;
    const variant = await prisma.variant.update({
      where: { id: parseInt(req.params.id) },
      data: { stock: parseInt(stock) },
    });
    res.json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
};

// GET /api/variants/barcode/:barcode
const getVariantByBarcode = async (req, res, next) => {
  try {
    const variant = await prisma.variant.findUnique({
      where: { barcode: req.params.barcode },
      include: { product: true },
    });
    if (!variant) return res.status(404).json({ success: false, error: 'Barcode not found' });
    res.json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
};

// GET /api/products/low-stock
const getLowStock = async (req, res, next) => {
  try {
    const variants = await prisma.variant.findMany({
      where: {
        stock: { lte: prisma.variant.fields.lowStockLimit },
      },
      include: { product: true },
    });
    // Fallback using raw comparison
    const allVariants = await prisma.variant.findMany({ include: { product: true } });
    const lowStock = allVariants.filter(v => v.stock <= v.lowStockLimit);
    res.json({ success: true, data: lowStock });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock, getVariantByBarcode, getLowStock };
