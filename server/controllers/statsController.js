const { getDB } = require('../config/db');

exports.getDashboard = (req, res) => {
  const db = getDB();
  const today = new Date().toISOString().slice(0, 10);

  const ordersToday = db.prepare(
    "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at LIKE ? AND order_status != 'cancelled'"
  ).get(`${today}%`) || { count: 0, revenue: 0 };

  const ordersWeek = db.prepare(
    "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= date('now', '-7 days') AND order_status != 'cancelled'"
  ).get() || { count: 0, revenue: 0 };

  const ordersMonth = db.prepare(
    "SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= date('now', 'start of month') AND order_status != 'cancelled'"
  ).get() || { count: 0, revenue: 0 };

  const avgCart = db.prepare(
    "SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE order_status != 'cancelled'"
  ).get() || { avg: 0 };

  const lowStock = db.prepare(
    "SELECT COUNT(*) as count FROM products WHERE is_active = 1 AND stock_quantity <= stock_alert_threshold"
  ).get() || { count: 0 };

  const pendingOrders = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE order_status = 'pending'"
  ).get() || { count: 0 };

  const recentOrders = db.prepare(
    "SELECT o.*, c.full_name as customer_name, c.phone as customer_phone FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 5"
  ).all();

  const salesChart = db.prepare(
    "SELECT date(created_at) as date, COUNT(*) as orders, COALESCE(SUM(total_amount), 0) as revenue FROM orders WHERE created_at >= date('now', '-7 days') AND order_status != 'cancelled' GROUP BY date(created_at) ORDER BY date ASC"
  ).all();

  res.json({
    today: ordersToday,
    week: ordersWeek,
    month: ordersMonth,
    avgCart: Math.round(avgCart.avg),
    lowStockCount: lowStock.count,
    pendingOrdersCount: pendingOrders.count,
    recentOrders,
    salesChart
  });
};

exports.getTopProducts = (req, res) => {
  const db = getDB();
  const { period = '30' } = req.query;
  const products = db.prepare(
    `SELECT oi.product_name, SUM(oi.quantity) as total_sold, SUM(oi.subtotal) as total_revenue
     FROM order_items oi JOIN orders o ON oi.order_id = o.id
     WHERE o.order_status != 'cancelled' AND o.created_at >= date('now', '-' || ? || ' days')
     GROUP BY oi.product_name ORDER BY total_sold DESC LIMIT 10`
  ).all(period);
  res.json(products);
};

exports.getSalesByCategory = (req, res) => {
  const db = getDB();
  const data = db.prepare(
    `SELECT c.name as category, COALESCE(SUM(oi.subtotal), 0) as revenue, COALESCE(SUM(oi.quantity), 0) as quantity
     FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN categories c ON p.category_id = c.id
     JOIN orders o ON oi.order_id = o.id WHERE o.order_status != 'cancelled'
     GROUP BY c.name ORDER BY revenue DESC`
  ).all();
  res.json(data);
};

exports.getMonthlyRevenue = (req, res) => {
  const db = getDB();
  const data = db.prepare(
    "SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as orders, SUM(total_amount) as revenue FROM orders WHERE order_status != 'cancelled' GROUP BY month ORDER BY month DESC LIMIT 12"
  ).all();
  res.json(data.reverse());
};

exports.getPeakHours = (req, res) => {
  const db = getDB();
  const data = db.prepare(
    "SELECT strftime('%H', created_at) as hour, COUNT(*) as orders FROM orders WHERE order_status != 'cancelled' GROUP BY hour ORDER BY hour"
  ).all();
  res.json(data);
};

exports.exportOrders = (req, res) => {
  const db = getDB();
  const { date_from, date_to } = req.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (date_from) { where += ' AND o.created_at >= ?'; params.push(date_from); }
  if (date_to) { where += ' AND o.created_at <= ?'; params.push(date_to + ' 23:59:59'); }

  const orders = db.prepare(
    `SELECT o.order_number, o.created_at, c.full_name, c.phone, o.total_amount, o.payment_method, o.payment_status, o.order_status
     FROM orders o JOIN customers c ON o.customer_id = c.id ${where} ORDER BY o.created_at DESC`
  ).all(...params);

  const header = 'N° Commande,Date,Client,Téléphone,Montant (FCFA),Paiement,Statut Paiement,Statut Commande\n';
  const rows = orders.map(o =>
    `${o.order_number},${o.created_at},${o.full_name},${o.phone},${o.total_amount},${o.payment_method},${o.payment_status},${o.order_status}`
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=commandes.csv');
  res.send('\uFEFF' + header + rows);
};
