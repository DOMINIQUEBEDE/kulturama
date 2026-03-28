const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'librairie.db');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

// Wrapper to make sql.js feel like better-sqlite3
class DBWrapper {
  constructor(sqlDb) {
    this.sqlDb = sqlDb;
    this._inTransaction = false;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self.sqlDb.run(sql, params);
        const lastId = self.sqlDb.exec("SELECT last_insert_rowid() as id")[0];
        const changes = self.sqlDb.getRowsModified();
        if (!self._inTransaction) self.save();
        return {
          lastInsertRowid: lastId ? lastId.values[0][0] : 0,
          changes
        };
      },
      get(...params) {
        const stmt = self.sqlDb.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self.sqlDb.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => row[c] = vals[i]);
          results.push(row);
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql) {
    this.sqlDb.run(sql);
    if (!this._inTransaction) this.save();
  }

  transaction(fn) {
    return (...args) => {
      this._inTransaction = true;
      this.sqlDb.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        this.sqlDb.run('COMMIT');
        this._inTransaction = false;
        this.save();
        return result;
      } catch (err) {
        this._inTransaction = false;
        try { this.sqlDb.run('ROLLBACK'); } catch (e) { /* already committed */ }
        this.save();
        throw err;
      }
    };
  }

  pragma(p) {
    try { this.sqlDb.run(`PRAGMA ${p}`); } catch (e) { /* ignore */ }
  }

  save() {
    const data = this.sqlDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

async function initDB() {
  const SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(buffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = new DBWrapper(sqlDb);

  db.pragma('foreign_keys = ON');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      isbn TEXT,
      category_id INTEGER REFERENCES categories(id),
      price INTEGER NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      stock_alert_threshold INTEGER DEFAULT 5,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER REFERENCES customers(id),
      total_amount INTEGER NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'orange_money', 'mtn_momo', 'wave')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed', 'refunded')),
      order_status TEXT DEFAULT 'pending' CHECK(order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id),
      movement_type TEXT CHECK(movement_type IN ('in', 'out', 'adjustment')),
      quantity INTEGER NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes separately (CREATE INDEX IF NOT EXISTS with exec)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status)',
    'CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)',
    'CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)',
    'CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)',
    'CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)'
  ];
  for (const idx of indexes) {
    try { db.exec(idx); } catch (e) { /* index may already exist */ }
  }

  return db;
}

// Synchronous getter for use after init
function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

module.exports = { initDB, getDB };
