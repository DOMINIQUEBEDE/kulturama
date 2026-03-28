# Kulturama - Application de Gestion de Librairie (PWA)

Application complète de gestion de librairie pour la Cote d'Ivoire, avec interface client et back-office admin.

## Fonctionnalites

### Interface Client
- Catalogue produits avec recherche, filtres et tri
- Panier avec calcul automatique en FCFA
- Commande avec choix de paiement (Cash, Orange Money, MTN MoMo, Wave)
- Suivi de commande en temps reel

### Back-office Admin
- Dashboard avec KPIs en temps reel
- Gestion des commandes (suivi, changement de statut)
- Gestion du stock (ajout, modification, alertes)
- Statistiques et graphiques (ventes, top produits, categories)
- Export CSV des commandes

### Technique
- PWA installable sur Android
- Notifications temps reel (Socket.io)
- Panier persistant (localStorage)
- API REST securisee (JWT)
- Base SQLite (migratable vers PostgreSQL)

## Stack technique

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Base de donnees**: SQLite (sql.js)
- **Temps reel**: Socket.io
- **Auth**: JWT
- **Charts**: Recharts

## Installation

### Prerequis
- Node.js 18+
- npm

### 1. Cloner et installer

```bash
cd librairie-app

# Installer les dependances du serveur
cd server
npm install

# Installer les dependances du client
cd ../client
npm install
```

### 2. Configuration

Le fichier `server/.env` est deja configure pour le developpement :

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=kulturama_secret_key_2026_change_in_prod
ADMIN_EMAIL=admin@malibrairie.ci
ADMIN_PASSWORD=Admin@2026!
CLIENT_URL=http://localhost:5173
```

### 3. Initialiser la base de donnees

```bash
cd server
npm run seed
```

Cela cree :
- 12 categories
- 203 produits (depuis le catalogue Kulturama)
- 1 compte admin

### 4. Demarrer l'application

Terminal 1 - Backend :
```bash
cd server
npm run dev
```

Terminal 2 - Frontend :
```bash
cd client
npm run dev
```

L'application est accessible sur :
- **Client** : http://localhost:5173
- **Admin** : http://localhost:5173/admin/login
- **API** : http://localhost:5000/api

### 5. Connexion Admin

- **Email** : `admin@malibrairie.ci`
- **Mot de passe** : `Admin@2026!`

## Structure du projet

```
librairie-app/
├── client/                  # Frontend React PWA
│   ├── public/             # Assets statiques, PWA
│   ├── src/
│   │   ├── components/     # Composants UI
│   │   ├── context/        # CartContext, AuthContext
│   │   ├── pages/          # Pages de l'app
│   │   ├── services/       # API, Socket
│   │   └── utils/          # Formatage
│   └── vite.config.js
├── server/                  # Backend Express
│   ├── config/db.js        # SQLite
│   ├── controllers/        # Logique metier
│   ├── middleware/          # Auth JWT, errors
│   ├── routes/             # Endpoints API
│   ├── seeds/              # Donnees initiales
│   └── socket/             # Socket.io
└── shared/                  # Constantes
```

## API Endpoints

### Public
- `GET /api/products` - Liste des produits (filtres, pagination)
- `GET /api/products/:id` - Detail d'un produit
- `GET /api/categories` - Liste des categories
- `POST /api/orders` - Creer une commande
- `GET /api/orders/track/:orderNumber` - Suivi par numero
- `GET /api/orders/track-phone/:phone` - Suivi par telephone

### Admin (JWT requis)
- `POST /api/admin/login` - Connexion
- `GET /api/orders` - Toutes les commandes
- `PUT /api/orders/:id/status` - Modifier statut
- `POST /api/products` - Ajouter un produit
- `PUT /api/products/:id` - Modifier un produit
- `PUT /api/products/:id/stock` - Modifier le stock
- `GET /api/stats/dashboard` - KPIs
- `GET /api/stats/top-products` - Top ventes
- `GET /api/stats/export` - Export CSV

### Paiements (simulation)
- `POST /api/payments/initiate` - Initier un paiement
- `POST /api/payments/simulate/:order_number` - Simuler un paiement

## Deploiement en production

1. Modifier `JWT_SECRET` dans `.env`
2. Builder le frontend : `cd client && npm run build`
3. Configurer `NODE_ENV=production`
4. Le serveur servira les fichiers statiques depuis `client/dist/`

## Devise

Tous les montants sont en **FCFA** (Franc CFA), sans decimales.
Format d'affichage : `1 500 FCFA`
