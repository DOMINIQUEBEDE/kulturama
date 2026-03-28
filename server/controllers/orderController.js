const { getDB } = require('../config/db');

function generateOrderNumber() {
  const db = getDB();
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const row = db.prepare("SELECT COUNT(*) as c FROM orders WHERE created_at LIKE ?").get(`${now.toISOString().slice(0, 10)}%`);
  const count = row ? row.c : 0;
  return `LIB-${date}-${String(count + 1).padStart(3, '0')}`;
}

exports.create = (req, res) => {
  const db = getDB();
  const { customer, items, payment_method, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Le panier est vide' });
  }
  if (!customer || !customer.full_name || !customer.phone) {
    return res.status(400).json({ error: 'Informations client manquantes' });
  }

  // Validate stock
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(item.product_id);
    if (!product) return res.status(400).json({ error: `Produit #${item.product_id} non trouvé` });
    if (product.stock_quantity < item.quantity) {
      return res.status(400).json({ error: `Stock insuffisant pour "${product.name}" (${product.stock_quantity} disponibles)` });
    }
  }

  try {
    const createOrder = db.transaction(() => {
      // Create or find customer
      let customerId;
      const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer.phone);
      if (existing) {
        customerId = existing.id;
        db.prepare('UPDATE customers SET full_name = ?, email = COALESCE(?, email), address = COALESCE(?, address) WHERE id = ?')
          .run(customer.full_name, customer.email || null, customer.address || null, customerId);
      } else {
        const result = db.prepare('INSERT INTO customers (full_name, phone, email, address) VALUES (?, ?, ?, ?)')
          .run(customer.full_name, customer.phone, customer.email || null, customer.address || null);
        customerId = result.lastInsertRowid;
      }

      // Calculate totals
      let totalAmount = 0;
      const orderItems = [];
      for (const item of items) {
        const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id);
        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;
        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          unit_price: product.price,
          quantity: item.quantity,
          subtotal
        });
      }

      const orderNumber = generateOrderNumber();
      const orderResult = db.prepare(
        'INSERT INTO orders (order_number, customer_id, total_amount, payment_method, notes) VALUES (?, ?, ?, ?, ?)'
      ).run(orderNumber, customerId, totalAmount, payment_method, notes || null);

      const orderId = orderResult.lastInsertRowid;

      for (const item of orderItems) {
        db.prepare(
          'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(orderId, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal);
        db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(item.quantity, item.product_id);
        db.prepare("INSERT INTO stock_movements (product_id, movement_type, quantity, reason) VALUES (?, 'out', ?, ?)")
          .run(item.product_id, item.quantity, `Commande ${orderNumber}`);
      }

      return { orderId, orderNumber, totalAmount, items: orderItems };
    });

    const result = createOrder();

    // Notify admin via socket
    try {
      const { getIO } = require('../socket');
      const order = db.prepare(
        "SELECT o.*, c.full_name as customer_name, c.phone as customer_phone FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?"
      ).get(result.orderId);
      getIO().to('admin').emit('new_order', { order, items: result.items });
    } catch (e) { /* socket may not be ready */ }

    res.status(201).json({
      order_number: result.orderNumber,
      total_amount: result.totalAmount,
      items: result.items,
      status: 'pending',
      message: 'Commande créée avec succès'
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ error: 'Erreur lors de la création de la commande' });
  }
};

exports.getByNumber = (req, res) => {
  const db = getDB();
  const order = db.prepare(
    "SELECT o.*, c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.order_number = ?"
  ).get(req.params.orderNumber);

  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
};

exports.trackByPhone = (req, res) => {
  const db = getDB();
  const customer = db.prepare('SELECT id FROM customers WHERE phone = ?').get(req.params.phone);
  if (!customer) return res.json([]);

  const orders = db.prepare(
    "SELECT o.*, c.full_name as customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.customer_id = ? ORDER BY o.created_at DESC LIMIT 10"
  ).all(customer.id);
  res.json(orders);
};

exports.getAll = (req, res) => {
  const db = getDB();
  const { status, payment_method, search, date_from, date_to, page = 1, limit = 20 } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (status) { where += ' AND o.order_status = ?'; params.push(status); }
  if (payment_method) { where += ' AND o.payment_method = ?'; params.push(payment_method); }
  if (search) {
    where += ' AND (o.order_number LIKE ? OR c.full_name LIKE ? OR c.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (date_from) { where += " AND o.created_at >= ?"; params.push(date_from); }
  if (date_to) { where += " AND o.created_at <= ?"; params.push(date_to + ' 23:59:59'); }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM orders o JOIN customers c ON o.customer_id = c.id ${where}`
  ).get(...params);
  const total = countRow ? countRow.total : 0;

  const offset = (Number(page) - 1) * Number(limit);
  const orders = db.prepare(
    `SELECT o.*, c.full_name as customer_name, c.phone as customer_phone FROM orders o JOIN customers c ON o.customer_id = c.id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), offset);

  res.json({
    orders,
    pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) }
  });
};

exports.getById = (req, res) => {
  const db = getDB();
  const order = db.prepare(
    "SELECT o.*, c.full_name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?"
  ).get(Number(req.params.id));

  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  res.json({ ...order, items });
};

exports.updateStatus = (req, res) => {
  const db = getDB();
  const { order_status, payment_status } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

  if (order_status === 'cancelled' && order.order_status !== 'cancelled') {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    for (const item of items) {
      db.prepare('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?').run(item.quantity, item.product_id);
      db.prepare("INSERT INTO stock_movements (product_id, movement_type, quantity, reason) VALUES (?, 'in', ?, ?)")
        .run(item.product_id, item.quantity, `Annulation ${order.order_number}`);
    }
  }

  db.prepare(
    'UPDATE orders SET order_status = COALESCE(?, order_status), payment_status = COALESCE(?, payment_status), updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(order_status || null, payment_status || null, Number(req.params.id));

  const updated = db.prepare(
    "SELECT o.*, c.full_name as customer_name, c.phone as customer_phone FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?"
  ).get(Number(req.params.id));

  try {
    const { getIO } = require('../socket');
    getIO().to('admin').emit('order_updated', updated);
    getIO().to(`order_${updated.order_number}`).emit('order_status_changed', {
      order_number: updated.order_number,
      status: updated.order_status,
      payment_status: updated.payment_status
    });
  } catch (e) { /* socket may not be ready */ }

  res.json(updated);
};
