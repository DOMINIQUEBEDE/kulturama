const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);

// Admin routes
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);
router.put('/:id/stock', auth, ctrl.updateStock);
router.get('/:id/stock-movements', auth, ctrl.getStockMovements);

module.exports = router;
