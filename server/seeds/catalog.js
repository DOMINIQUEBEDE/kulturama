const envPath = require('path').join(__dirname, '..', '.env');
if (require('fs').existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}
const { initDB, getDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function seed() {
  await initDB();
  const db = getDB();

  console.log('Seeding database...');

  const catalogPath = path.join(__dirname, '..', '..', 'catalog.json');
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  // Clear existing data
  db.exec('DELETE FROM stock_movements');
  db.exec('DELETE FROM order_items');
  db.exec('DELETE FROM orders');
  db.exec('DELETE FROM customers');
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM categories');
  db.exec('DELETE FROM admins');

  const categoryIcons = {
    'Arts et Musique': '🎨',
    'Divers': '📦',
    'EDHC': '📘',
    'Evaluations': '📝',
    'Francais et Lecture': '📖',
    'Habiletes': '🧠',
    'Histoire-Geo-Philo': '🌍',
    'Langues': '🌐',
    'Livres Jeunesse': '🧒',
    'Maternelle': '🎒',
    'Romans et Nouvelles': '📚',
    'Sciences et Maths': '🔬'
  };

  const categoryMap = {};
  for (const catName of catalog.categories) {
    const icon = categoryIcons[catName] || '📦';
    const result = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)')
      .run(catName, `Catégorie ${catName}`, icon);
    categoryMap[catName] = result.lastInsertRowid;
  }
  console.log(`${catalog.categories.length} catégories créées`);

  for (const product of catalog.products) {
    const categoryId = categoryMap[product.category] || categoryMap['Divers'];
    const result = db.prepare(
      'INSERT INTO products (name, description, isbn, category_id, price, stock_quantity, stock_alert_threshold, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(product.name, product.name, product.isbn || null, categoryId, product.price, product.stock, 5, null);
    if (product.stock > 0) {
      db.prepare("INSERT INTO stock_movements (product_id, movement_type, quantity, reason) VALUES (?, 'in', ?, 'Stock initial')")
        .run(result.lastInsertRowid, product.stock);
    }
  }
  console.log(`${catalog.products.length} produits importés`);

  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@2026!', 12);
  db.prepare('INSERT INTO admins (email, password_hash, full_name) VALUES (?, ?, ?)')
    .run(process.env.ADMIN_EMAIL || 'admin@malibrairie.ci', passwordHash, 'Christiane');
  console.log('Compte admin créé: admin@malibrairie.ci');

  console.log('Seed terminé !');
}

seed().catch(console.error);
