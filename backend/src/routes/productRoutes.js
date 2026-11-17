const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyListings,
} = require('../controllers/productController');
const { protect, requireVerified } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, requireVerified, createProduct);

router.get('/my-listings', protect, getMyListings);

router.route('/:id')
  .get(getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
