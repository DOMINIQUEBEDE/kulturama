const express = require('express');
const router = express.Router();
const { getDB } = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
  const db = getDB();
  const categories = db.prepare(
    'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1 GROUP BY c.id ORDER BY c.name'
  ).all();
  res.json(categories);
});

router.post('/', auth, (req, res) => {
  const db = getDB();
  const { name, description, icon } = req.body;
  try {
    const result = db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)')
      .run(name, description || null, icon || null);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(category);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Cette catégorie existe déjà' });
    }
    throw err;
  }
});

router.put('/:id', auth, (req, res) => {
  const db = getDB();
  const { name, description, icon } = req.body;
  db.prepare('UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), icon = COALESCE(?, icon) WHERE id = ?')
    .run(name || null, description || null, icon || null, Number(req.params.id));
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(req.params.id));
  res.json(category);
});

module.exports = router;
