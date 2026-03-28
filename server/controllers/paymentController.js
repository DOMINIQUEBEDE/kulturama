const { getDB } = require('../config/db');

exports.initiate = (req, res) => {
  const db = getDB();
  const { order_number, payment_method, phone } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(order_number);
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

  const paymentRef = `PAY-${Date.now()}`;
  const responses = {
    orange_money: {
      provider: 'Orange Money',
      ref: paymentRef,
      ussd_code: `*144*4*6*${order.total_amount}#`,
      message: `Composez le code USSD ou validez le paiement de ${order.total_amount} FCFA sur votre téléphone`,
      status: 'initiated'
    },
    mtn_momo: {
      provider: 'MTN MoMo',
      ref: paymentRef,
      ussd_code: `*133*4*1*${order.total_amount}#`,
      message: `Confirmez le paiement de ${order.total_amount} FCFA sur votre téléphone MTN`,
      status: 'initiated'
    },
    wave: {
      provider: 'Wave',
      ref: paymentRef,
      message: `Un lien de paiement Wave de ${order.total_amount} FCFA a été envoyé au ${phone}`,
      status: 'initiated'
    }
  };

  const response = responses[payment_method];
  if (!response) return res.status(400).json({ error: 'Méthode de paiement non supportée' });
  res.json(response);
};

exports.callback = (req, res) => {
  const db = getDB();
  const { order_number, status } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(order_number);
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

  const paymentStatus = status === 'success' ? 'paid' : 'failed';
  db.prepare('UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(paymentStatus, order.id);

  if (paymentStatus === 'paid') {
    db.prepare("UPDATE orders SET order_status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(order.id);
  }

  try {
    const { getIO } = require('../socket');
    getIO().to('admin').emit('payment_update', { order_number, status: paymentStatus });
    getIO().to(`order_${order_number}`).emit('payment_update', { status: paymentStatus });
  } catch (e) { /* */ }

  res.json({ success: true, payment_status: paymentStatus });
};

exports.simulate = (req, res) => {
  const db = getDB();
  const { order_number } = req.params;
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(order_number);
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

  db.prepare("UPDATE orders SET payment_status = 'paid', order_status = 'confirmed', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(order.id);

  try {
    const { getIO } = require('../socket');
    getIO().to('admin').emit('payment_update', { order_number, status: 'paid' });
    getIO().to(`order_${order_number}`).emit('payment_update', { status: 'paid' });
  } catch (e) { /* */ }

  res.json({ success: true, message: 'Paiement simulé avec succès' });
};
