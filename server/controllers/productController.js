const { getDB } = require('../config/db');

exports.getAll = (req, res) => {
  const db = getDB();
  const { category, search, sort, min_price, max_price, available, page = 1, limit = 20 } = req.query;

  let where = 'WHERE p.is_active = 1';
  const params = [];

  if (category) {
    where += ' AND p.category_id = ?';
    params.push(Number(category));
  }
  if (search) {
    where += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.isbn LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (min_price) {
    where += ' AND p.price >= ?';
    params.push(Number(min_price));
  }
  if (max_price) {
    where += ' AND p.price <= ?';
    params.push(Number(max_price));
  }
  if (available === 'true') {
    where += ' AND p.stock_quantity > 0';
  }

  const countRow = db.prepare(
    `SELECT COUNT(*) as total FROM products p ${where}`
  ).get(...params);
  const total = countRow ? countRow.total : 0;

  let orderBy;
  switch (sort) {
    case 'price_asc': orderBy = 'ORDER BY p.price ASC'; break;
    case 'price_desc': orderBy = 'ORDER BY p.price DESC'; break;
    case 'name': orderBy = 'ORDER BY p.name ASC'; break;
    default: orderBy = 'ORDER BY p.name ASC';
  }

  const offset = (Number(page) - 1) * Number(limit);
  const products = db.prepare(
    `SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, Number(limit), offset);

  res.json({
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit))
    }
  });
};

exports.getById = (req, res) => {
  const db = getDB();
  const product = db.prepare(
    'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?'
  ).get(Number(req.params.id));

  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
  res.json(product);
};

exports.create = (req, res) => {
  const db = getDB();
  const { name, description, isbn, category_id, price, stock_quantity, stock_alert_threshold, image_url } = req.body;

  const result = db.prepare(
    'INSERT INTO products (name, description, isbn, category_id, price, stock_quantity, stock_alert_threshold, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(name, description || null, isbn || null, category_id, price, stock_quantity || 0, stock_alert_threshold || 5, image_url || null);

  if (stock_quantity > 0) {
    db.prepare(
      "INSERT INTO stock_movements (product_id, movement_type, quantity, reason) VALUES (?, 'in', ?, 'Stock initial')"
    ).run(result.lastInsertRowid, stock_quantity);
  }

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(product);
};

exports.update = (req, res) => {
  const db = getDB();
  const { name, description, isbn, category_id, price, stock_alert_threshold, image_url, is_active } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

  db.prepare(
    `UPDATE products SET
      name = COALESCE(?, name), description = COALESCE(?, description), isbn = COALESCE(?, isbn),
      category_id = COALESCE(?, category_id), price = COALESCE(?, price),
      stock_alert_threshold = COALESCE(?, stock_alert_threshold), image_url = COALESCE(?, image_url),
      is_active = COALESCE(?, is_active), updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).run(name ?? null, description ?? null, isbn ?? null, category_id ?? null, price ?? null,
    stock_alert_threshold ?? null, image_url ?? null, is_active ?? null, Number(req.params.id));

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  res.json(updated);
};

exports.updateStock = (req, res) => {
  const db = getDB();
  const { quantity, movement_type, reason } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

  let newStock;
  if (movement_type === 'in') {
    newStock = product.stock_quantity + quantity;
  } else if (movement_type === 'out') {
    newStock = product.stock_quantity - quantity;
    if (newStock < 0) return res.status(400).json({ error: 'Stock insuffisant' });
  } else {
    newStock = quantity;
  }

  db.prepare('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStock, Number(req.params.id));

  db.prepare(
    'INSERT INTO stock_movements (product_id, movement_type, quantity, reason) VALUES (?, ?, ?, ?)'
  ).run(Number(req.params.id), movement_type, quantity, reason || null);

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));

  try {
    const { getIO } = require('../socket');
    if (updated.stock_quantity <= updated.stock_alert_threshold) {
      getIO().to('admin').emit('stock_alert', {
        product: updated,
        message: `Stock bas: ${updated.name} (${updated.stock_quantity} restants)`
      });
    }
  } catch (e) { /* socket may not be ready */ }

  res.json(updated);
};

exports.getStockMovements = (req, res) => {
  const db = getDB();
  const movements = db.prepare(
    'SELECT sm.*, p.name as product_name FROM stock_movements sm JOIN products p ON sm.product_id = p.id WHERE sm.product_id = ? ORDER BY sm.created_at DESC'
  ).all(Number(req.params.id));
  res.json(movements);
};

exports.getLowStock = (req, res) => {
  const db = getDB();
  const products = db.prepare(
    'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1 AND p.stock_quantity <= p.stock_alert_threshold ORDER BY p.stock_quantity ASC'
  ).all();
  res.json(products);
};
