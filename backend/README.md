# 🏠 YMMO - Plateforme Immobilière & Moteur Prédictif IA (Backend & Data)


Ce dépôt contient l'infrastructure de données relationnelle, l'API REST et le moteur d'Intelligence Artificielle du groupe **YMMO**. Conçu dans le cadre du projet de fin d'études Ynov, ce backend est entièrement conteneurisé et prêt à être consommé par l'application Frontend.


## 🚀 Lancement Rapide (Docker)

Grâce à la conteneurisation, l'intégralité de l'environnement (Serveur d'API Python et Base de données PostgreSQL) s'initialise et se configure en une seule ligne de commande.

### Prérequis
* **Docker Desktop** installé et démarré sur votre machine.

### Procédure de démarrage
Ouvrez un terminal à la racine du projet `Ymmo` et exécutez :

```bash
docker compose up --build
```

## 🛠️ Architecture du Projet
```bash
Ymmo/
├── .env                // Variables d environnement masquées - Secrets BDD
├── .gitignore          // Fichiers exclus versionnage Git - Caches, Logs
├── .dockerignore       // Fichiers exclus contexte de build Docker
├── docker-compose.yml  // Orchestration des conteneurs multi-services
│
├── db/                 // COUCHE DONNÉES - PostgreSQL 16
│   ├── 01_schema.sql   // Structure des tables - Respect strict de la 3NF
│   └── 02_data.sql     // Jeu d essai - 13 structures, 13 commerciaux, 30 biens, 22 transactions
│
└── backend/            // COUCHE APPLICATIVE et ANALYTIQUE - FastAPI 
    ├── Dockerfile      // Recette de construction de l image Python
    ├── requirements.txt // Dépendances - FastAPI, Uvicorn, Pandas, Scikit-Learn, Psycopg2
    └── app/
        ├── main.py         // Routeur principal de lAPI et Configuration CORS
        ├── database.py     // Gestion de la connexion et des curseurs SQL
        └── analysis_ia.py  // Algorithme de Régression Linéaire pour l estimation
```

## 🔌 Guide d'Intégration Frontend (Contrat d'Interface)

L'API est accessible localement sur http://localhost:8000.

🔒 Configuration CORS : Le middleware CORS est configuré sur allow_origins=["*"]. Les requêtes asynchrones JavaScript (fetch, Axios) depuis votre environnement Frontend (port 3000 ou autre) sont pleinement autorisées et ne subiront aucun blocage du navigateur.

### 🗺️ Liste des Endpoints Disponibles

| Méthode | Route (URL) | Usage / Description | Format de Réponse (Succès) |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/` | **Health Check** : Vérification de l'état des services. | `{"status": "healthy", ...}` |
| **`GET`** | `/api/agences` | **Réseau National** : Récupère la liste des 13 structures (Siège + 12 agences). *Idéal pour alimenter dynamiquement vos menus déroulants `<select>`.* | `[{"id": 1, "name": "YMMO Paris", ...}, ...]` |
| **`GET`** | `/api/properties` | **Catalogue** : Récupère la liste complète des 30 biens immobiliers (disponibles et vendus) pour l'affichage des listes et cartes. | `[{"id": 1, "title": "Bastide...", ...}, ...]` |
| **`POST`** | `/api/properties` | **Création** : Permet à un commercial de publier une annonce depuis un formulaire. *Attend un JSON complet du bien.* | `{"status": "success", "property_id": X}` |
| **`POST`** | `/api/analytics/predict` | **Moteur IA** : Calcule l'estimation scientifique du prix d'un bien. *Attend : `{"area": int, "rooms": int}`.* | `{"status": "success", "estimated_price": 450000.0, "currency": "EUR"}` |

## 📊 Moteur d'Intelligence Artificielle

L'endpoint /api/analytics/predict exploite la puissance des librairies de Data Science de Python :
1. À chaque appel, Pandas extrait l'historique des 22 ventes réelles enregistrées dans la table transactions.
2. Scikit-Learn entraîne instantanément un modèle de Régression Linéaire sur ces données (features : area et rooms / target : final_price).
3. Le modèle évalue la tendance et renvoie une estimation prédictive précise basée sur la réalité du marché de la base de données.

## 📝 Documentation Interactive (Swagger)

FastAPI auto-documente l'intégralité de ce backend. Une fois l'infrastructure démarrée, ouvrez votre navigateur et consultez :

```bash
👉 http://localhost:8000/docs
```