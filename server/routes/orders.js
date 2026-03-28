const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Public routes
router.post('/', ctrl.create);
router.get('/track/:orderNumber', ctrl.getByNumber);
router.get('/track-phone/:phone', ctrl.trackByPhone);

// Admin routes
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.put('/:id/status', auth, ctrl.updateStatus);

module.exports = router;
