const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  createOrder,
  verifyPayment,
  getPaymentStatus,
} = require('../controllers/paymentController');

router.get('/config', getPaymentConfig);
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/status/:paymentId', getPaymentStatus);

module.exports = router;
