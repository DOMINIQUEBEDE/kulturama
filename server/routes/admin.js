const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const productCtrl = require('../controllers/productController');
const auth = require('../middleware/auth');

router.post('/login', ctrl.login);
router.get('/profile', auth, ctrl.getProfile);
router.get('/low-stock', auth, productCtrl.getLowStock);

module.exports = router;
