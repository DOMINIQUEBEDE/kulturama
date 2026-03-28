const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/statsController');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, ctrl.getDashboard);
router.get('/top-products', auth, ctrl.getTopProducts);
router.get('/sales-by-category', auth, ctrl.getSalesByCategory);
router.get('/monthly-revenue', auth, ctrl.getMonthlyRevenue);
router.get('/peak-hours', auth, ctrl.getPeakHours);
router.get('/export', auth, ctrl.exportOrders);

module.exports = router;
