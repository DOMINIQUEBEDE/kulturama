# Kulturama - Application de Gestion de Librairie

## Projet
Application PWA de gestion de librairie/papeterie pour la Cote d'Ivoire (Kulturama).
Deux interfaces : client (front-store) et admin (back-office).

## Stack
- Frontend : React 18 + Vite + Tailwind CSS
- Backend : Node.js + Express.js
- Base de donnees : SQLite (sql.js)
- Temps reel : Socket.io
- Auth : JWT
- Charts : Recharts

## Commandes

```bash
# Installer tout
cd server && npm install && cd ../client && npm install

# Seed la base de donnees
cd server && node seeds/catalog.js

# Dev - backend (port 5000)
cd server && npm run dev

# Dev - frontend (port 5173)
cd client && npm run dev

# Build production
cd client && npm run build
```

## Deploiement
- Heberge sur Render.com (plan Free)
- URL : https://kulturama.onrender.com
- GitHub : https://github.com/DOMINIQUEBEDE/kulturama

## Admin
- URL admin : https://kulturama.onrender.com/admin/login
- Email : admin@malibrairie.ci
- Mot de passe : Admin@2026!
- Nom : Christiane

## Structure
- `/client` - Frontend React PWA
- `/server` - Backend Express API
- `/shared` - Constantes partagees
- `/catalog.json` - Catalogue produits (203 articles, 12 categories)

## Base de donnees
Tables : categories, products, customers, orders, order_items, stock_movements, admins
Fichier SQLite : server/data/librairie.db (genere par le seed, gitignore)

## Variables d'environnement (production sur Render)
- NODE_ENV=production
- JWT_SECRET (genere)
- ADMIN_EMAIL=admin@malibrairie.ci
- ADMIN_PASSWORD=Admin@2026!

## Devise
Tous les montants en FCFA (pas de decimales). Format : 1 500 FCFA
