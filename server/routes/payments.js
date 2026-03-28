const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');

router.post('/initiate', ctrl.initiate);
router.post('/callback', ctrl.callback);
router.post('/simulate/:order_number', ctrl.simulate);

module.exports = router;
