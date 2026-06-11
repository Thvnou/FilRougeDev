# Fiche technique — Front-end YMMO

Cette fiche décrit le fonctionnement du JavaScript front-end du projet YMMO :
architecture générale, rôle de chaque fichier, modèle de données local
(localStorage), système d'authentification/rôles, endpoints API utilisés,
et limitations actuelles à garder en tête pour la suite du projet.

---

## 1. Architecture générale

Le front est en HTML/CSS/JS « vanilla » (pas de framework). Chaque page HTML
charge une série de scripts communs puis un script propre à la page. L'ordre
de chargement est important car chaque fichier dépend des fonctions définies
dans les précédents :

```html
<script src="js/config.js"></script>      <!-- 1. URL de l'API -->
<script src="js/storage.js"></script>     <!-- 2. Accès localStorage -->
<script src="js/auth.js"></script>        <!-- 3. Session, rôles, login/signup -->
<script src="js/properties.js"></script>  <!-- 4. (si la page affiche des biens) -->
<script src="js/header.js"></script>      <!-- 5. Bandeau utilisateur, nav, déconnexion -->
<script src="js/<page>.js"></script>      <!-- 6. Logique propre à la page -->
```

`properties.js` n'est inclus que sur les pages qui affichent des biens
immobiliers (accueil, annonces, description, candidatures-client,
compte-commercial, infos-candidature, compte-admin).

Le backend FastAPI est interrogé via `fetch()` avec l'URL de base définie dans
`config.js` (`API_BASE_URL = "http://localhost:8000"`). Toutes les
fonctionnalités non couvertes par l'API actuelle (candidatures, messagerie,
favoris, gestion des comptes, suppression de biens...) sont simulées côté
front avec `localStorage`, via `storage.js`. Chaque fonction concernée est
commentée avec une note **« À terme : ... »** indiquant l'endpoint qui devra
la remplacer quand le backend sera complété.

---

## 2. Modules communs

### `config.js`
Contient une seule constante : `API_BASE_URL`. Centralise l'adresse du
backend pour pouvoir la changer en un seul endroit.

### `storage.js`
Couche de persistance front basée sur `localStorage`. Définit `STORAGE_KEYS`
(toutes les clés utilisées, voir section 4) et expose des fonctions
utilitaires `readJSON` / `writeJSON`, ainsi que toutes les fonctions
métier listées section 4 (session, profil, candidatures, messagerie,
favoris, administration, surcharges de biens, compteur d'inscriptions).

### `auth.js`
Gère l'authentification et la protection des pages :

- `ROLE_LABELS` : libellé affiché pour chaque rôle (`direction` /
  `admin` → "Administrateur", `commercial` → "Commercial", `client` →
  "Client").
- `ROLE_HOME_PAGE` / `getHomePageForRole(role)` : page d'accueil de
  l'espace personnel selon le rôle (`compte-admin.html`,
  `compte-commercial.html`, `compte-client.html`).
- `login(email, password)` : `POST /api/login`, enregistre la session
  (`setSession`) et retourne l'utilisateur.
- `signup({firstname, lastname, email, password})` : `POST /api/users`
  (rôle `client` forcé côté backend), incrémente le compteur
  d'inscriptions, ajoute l'utilisateur à l'annuaire admin
  (`addAdminUser`), puis connecte automatiquement le nouveau compte.
- `logout()` : vide la session et redirige vers `connexion.html`.
- `requireAuth(allowedRoles?)` : à appeler en tête de chaque page
  protégée. Redirige vers `connexion.html` si personne n'est connecté,
  ou vers le tableau de bord du rôle de l'utilisateur si son rôle ne
  fait pas partie de `allowedRoles`. Retourne la session ou `null`.

### `header.js`
Inclus sur **toutes** les pages, après `auth.js`. Au chargement :

- `initHeaderUserInfo()` : remplace le nom/rôle affichés dans le bandeau
  (`.info-utilisateur`) par ceux de l'utilisateur connecté (via
  `getProfile()`), si une session existe.
- `initLogoutButton()` : branche le bouton « Déconnexion » sur
  `logout()`.
- `initTopNavLinks()` : branche les 3 liens de la barre du haut —
  « Nos agences » (affiche la liste via `GET /api/agences` dans une
  alerte), « Mes favoris » (redirige vers
  `annonces.html?favoris=1`), « Mon compte » (redirige vers l'espace du
  rôle connecté, ou `connexion.html` si déconnecté).
- `initMesCandiraturesButton()` : sur l'accueil, masque le bouton
  « Mes candidatures » sauf pour un client connecté.

### `properties.js`
Fonctions partagées pour manipuler les biens immobiliers :

- `fetchProperties()` : `GET /api/properties` (liste complète).
- `fetchProperty(id)` : `GET /api/properties/{id}`.
- `getImageForProperty(property)` : associe une image du dossier
  `images/appart/` à un bien, de façon stable (`id % taille du pool`),
  car la base ne stocke pas de photo par bien.
- `formatPrice(price)` : formatage `"123 000 €"` (locale `fr-FR`).
- `statusLabel(status)` / `statusClass(status)` : transforme le statut
  brut (`"Disponible"` / `"Vendu"`) en libellé/style affiché
  (`"À vendre"` / `"Vendu"`).
- `renderHomeCard(property)` / `renderAnnonceCard(property)` : génèrent
  le HTML des cartes biens pour l'accueil et la page annonces.

---

## 3. Logique par page

### `connexion.js`
Si une session existe déjà, redirige directement vers l'espace du rôle
(`getHomePageForRole`). Sinon, gère le formulaire : validation des
champs, appel `login()`, affichage des erreurs (zone `#connexion-error`
ou `alert`), puis redirection selon le rôle renvoyé par l'API.

### `creation-compte.js`
Même logique de redirection si déjà connecté. Valide les champs
(regex email, mots de passe identiques, etc.), appelle `signup()`, gère
les erreurs et redirige vers `compte-client.html` (rôle `client`
toujours attribué par le backend).

### `accueil.js`
- `chargerDerniersBiens()` : remplace les cartes statiques par les 3
  derniers biens renvoyés par `GET /api/properties`. En cas d'erreur API,
  conserve les cartes statiques de secours.
- `initOngletsAcheterVendre()` : gestion des onglets Acheter/Vendre.
- `initBarreRecherche()` : redirige vers `annonces.html` avec les
  filtres saisis en paramètres d'URL.

### `annonces.js`
- `chargerAnnonces()` : récupère tous les biens via `fetchProperties()`.
- `preremplirFiltresDepuisURL()` : lit les paramètres d'URL (ville,
  budget max, surface min, `favoris=1`...) et pré-remplit le formulaire
  de filtres.
- `initFiltresEnDirect()` / `appliquerFiltresEtAfficher()` : filtrage en
  direct (ville, prix, surface, favoris uniquement).
- `initTri()` : tri croissant/décroissant par prix.
- `initFavoris()` : ajout/retrait des favoris (`toggleFavori`,
  localStorage) et mise à jour visuelle des boutons étoile.

### `description-annonce.js`
- Lit `?id=` (et `?img=` transmis depuis la carte cliquée) dans l'URL.
- `afficherPhotoImmediate()` : affiche tout de suite la photo transmise
  en attendant la réponse de l'API.
- `chargerBien()` : `fetchProperty(id)` puis remplit les champs de la
  fiche (référence, type, catégorie, ville, surface, prix, pièces).
- `initBoutonFavori()` : bascule le favori du bien (localStorage).
- `initBoutonCandidature()` : ouvre le formulaire de candidature et
  enregistre la candidature via `addCandidature()` (localStorage,
  `STORAGE_KEYS.CANDIDATURES`), avec vérification `hasAlreadyApplied()`
  pour éviter les doublons.

### `compte-client.js`
Page d'accueil de l'espace client : appelle simplement
`requireAuth(["client"])`. Le bandeau (nom, rôle, déconnexion) est géré
par `header.js`.

### `information-compte.js`
- `afficherProfil()` : affiche nom/prénom/email du profil (`getProfile()`,
  qui fusionne la session avec d'éventuelles surcharges
  `PROFILE_OVERRIDES`).
- `initBoutonModifier()` : édition (via `prompt`) du nom, prénom, email,
  sauvegardée avec `saveProfileOverride()` — **pas répercutée en base**,
  faute de route `PUT /api/users/{id}`.
- `initBoutonSupprimer()` : déconnecte et efface les données locales du
  compte (`deleteAccount()`) — **le compte n'est pas supprimé en base**,
  faute de route `DELETE /api/users/{id}`.

### `candidatures-client.js`
- `chargerCandidatures(userId)` : récupère les candidatures du client
  (`getCandidaturesByUser`), puis charge le bien correspondant à chacune
  via `fetchProperty`.
- `initOnglets()` : onglets « Résidentiel » / « Professionnel »
  (filtrage par `property.category`, valeurs exactes en base).
- `afficherCandidatures()` : affiche pour chaque candidature une carte
  (photo, prix, statut, ville, surface) cliquable vers
  `description-annonce.html`.
- `statutCandidatureLabel` / `statutCandidatureClass` : traduisent le
  statut (`"en attente"` / `"acceptée"` / `"refusée"`) en libellé et
  classe CSS (`statut--attente`, `statut--acceptee`, `statut--refusee`).

### `messages.js`
- `afficherConversations()` : liste les conversations
  (`getConversations()`, pré-remplies avec des données de démo au
  premier chargement) sous forme d'éléments `.conversation-item`,
  affichant avatar, contact, dernier message, date/heure et badge "non
  lu" le cas échéant.

### `conversation.js`
- Lit `?id=` (conversation par défaut : `1`). Redirige vers
  `messages.html` si la conversation n'existe pas.
- `markConversationRead()` : marque la conversation comme lue à
  l'ouverture.
- `afficherEntete()` : affiche avatar/nom/détail du contact.
- `afficherMessages()` : construit le fil de discussion avec séparateurs
  de date (`.separateur-date`) et bulles `.message.recu` /
  `.message.envoye`, puis scrolle en bas.
- `initFormulaireEnvoi()` : envoi d'un message (submit du formulaire ou
  touche Entrée, Maj+Entrée pour un saut de ligne) via
  `addMessageToConversation()`.

### `compte-commercial.js`
- `chargerCandidatures()` : regroupe toutes les candidatures
  (`getCandidatures()`) par `property_id` (en gardant la plus récente),
  charge chaque bien via `fetchProperty` + `getEffectiveProperty`
  (fusion avec d'éventuelles surcharges), calcule le nombre de
  candidatures par bien, trie par plus récent.
- `initOnglets()` : onglets Résidentiel/Professionnel.
- `afficherCandidatures()` : affiche jusqu'à 6 cartes `.cand-card`
  (photo, titre + référence, "N candidature(s) — statut"), cliquables
  vers `infos-candidature.html?id={bien}`.
- `initFormulaireBien(session)` : formulaire « Ajouter un bien » —
  - bouton **Estimer le prix** : `POST /api/analytics/predict` avec
    `area` et `rooms`, remplit le champ prix avec l'estimation reçue ;
  - soumission du formulaire : valide les champs puis
    `POST /api/properties` avec `user_id: session.id` ; affiche un
    message de succès/erreur (`afficherMessageBien`) et réinitialise le
    formulaire en cas de succès.

### `infos-candidature.js`
- Lit `?id=` (id du bien). Redirige vers `compte-commercial.html` si
  absent/invalide.
- `afficherBien()` : charge le bien (`fetchProperty` +
  `getEffectiveProperty`) et affiche photo, référence, type, catégorie,
  ville, superficie, prix + statut, nombre de pièces. Le champ
  « Score énergétique » affiche **« Non renseigné »** (champ absent du
  modèle de données, voir section 6).
- `initBoutonModifier()` : édition (via `prompt`) du titre, du prix et
  du statut (`"Disponible"` / `"Vendu"`), sauvegardée avec
  `savePropertyOverride(bienActuel.id, fields)` — **pas répercutée en
  base**, faute de route `PUT /api/properties/{id}`.
- `afficherCandidats()` : liste les candidatures reçues pour ce bien
  (`getCandidaturesByProperty`), avec les infos du candidat (nom,
  métier, salaire, email, téléphone) et deux boutons Accepter/Refuser
  qui appellent `updateCandidatureStatus()` puis ré-affichent la liste.

### `compte-admin.js`
- `chargerDonnees()` : charge tous les biens (`fetchProperties()`),
  retire ceux marqués comme supprimés (`getRemovedPropertyIds`), applique
  les surcharges (`getEffectiveProperty`), récupère les candidatures
  (`getCandidatures()`) et l'annuaire utilisateurs (`getAdminUsers()`).
- `afficherKpis(...)` : met à jour les 4 cartes KPI — nombre de biens,
  nombre de candidatures, nombre de clients (`role === "client"`),
  nombre de biens vendus (`status === "Vendu"`).
- `afficherTableProprietes(...)` : tableau des annonces (photo, ville,
  type, prix, statut). Bouton **Supprimer** : appelle
  `removePropertyId()` (ajout à `REMOVED_PROPERTIES`), retire la ligne
  et met à jour le badge et le KPI — **le bien n'est pas supprimé en
  base**, faute de route `DELETE /api/properties/{id}`.
- `afficherTableUtilisateurs(...)` : tableau des utilisateurs inscrits
  (annuaire de démonstration + comptes créés via `creation-compte.html`).
  Bouton **Supprimer** : appelle `removeAdminUser()`, retire la ligne et
  met à jour le badge et le KPI — **l'utilisateur n'est pas supprimé en
  base**, faute de route `DELETE /api/users/{id}`.
- `tagClassForRole(role)` : classe CSS du badge de rôle
  (`tag--commercial`, `tag--direction`, `tag--client`).

---

## 4. Modèle de données localStorage

Toutes les clés sont définies dans `STORAGE_KEYS` (`storage.js`). Chaque
section ci-dessous indique son rôle, sa structure et l'évolution backend
prévue.

| Clé (`STORAGE_KEYS`) | Valeur localStorage | Contenu | À terme |
|---|---|---|---|
| `SESSION` (`ymmo_session`) | objet utilisateur ou `null` | Session courante : `id`, `firstname`, `lastname`, `email`, `role`, `id_agence` (renvoyés par `POST /api/login` ou `POST /api/users`) | — (mécanisme de session à conserver, éventuellement via un vrai token) |
| `PROFILE_OVERRIDES` (`ymmo_profile_overrides`) | `{ [userId]: {champs modifiés} }` | Modifications de profil (nom, prénom, email) faites depuis `information-compte.html` | `PUT /api/users/{id}` |
| `CANDIDATURES` (`ymmo_candidatures`) | tableau d'objets | `{id, property_id, user_id, user_nom, user_email, metier, salaire, telephone, status, created_at}` — reproduit la table `candidatures` | `POST /api/candidatures`, `GET /api/candidatures?...`, `PUT /api/candidatures/{id}` |
| `CONVERSATIONS` (`ymmo_conversations`) | tableau d'objets | `{id, contact_nom, contact_avatar, contact_detail, property_id, unread, messages: [...]}`, pré-rempli avec 2 conversations de démo au premier accès | `GET/POST /api/messages` |
| `FAVORIS` (`ymmo_favoris`) | tableau d'identifiants de biens | Biens ajoutés en favoris par l'utilisateur courant (favoris non liés à un compte précis, stockés globalement dans le navigateur) | éventuel `POST /api/favoris` lié à `user_id` |
| `ADMIN_USERS` (`ymmo_admin_users`) | tableau d'objets | `{lastname, firstname, email, role, inscrit_le}` — annuaire affiché dans `compte-admin.html`, pré-rempli avec 6 comptes de démo, complété à chaque inscription (`signup()`) | `GET /api/users` |
| `REMOVED_PROPERTIES` (`ymmo_admin_removed_properties`) | tableau d'identifiants de biens | Biens « supprimés » depuis l'espace admin (simplement masqués côté front) | `DELETE /api/properties/{id}` |
| `SIGNUP_COUNT` (`ymmo_signup_count`) | nombre | Compteur global d'inscriptions effectuées depuis le front | indicateur informatif, pourrait être remplacé par un comptage côté API |
| `PROPERTY_OVERRIDES` (`ymmo_property_overrides`) | `{ [propertyId]: {champs modifiés} }` | Modifications faites par un commercial depuis `infos-candidature.html` (titre, prix, statut), fusionnées avec les données API via `getEffectiveProperty()` et utilisées à la fois côté commercial et admin | `PUT /api/properties/{id}` |

---

## 5. Authentification, rôles et redirections

- À la connexion (`login`) ou à l'inscription (`signup`), l'utilisateur
  renvoyé par l'API est stocké tel quel dans `SESSION`.
- `getProfile()` fusionne `SESSION` avec `PROFILE_OVERRIDES[id]` pour
  l'affichage (nom/prénom/email éventuellement modifiés localement).
- Trois rôles existent en base (`users.role`) : `direction`, `commercial`,
  `client`. `direction` correspond à l'espace `compte-admin.html`
  (« Administrateur »).
- `requireAuth(allowedRoles)`, appelé en tête de script de chaque page
  protégée :
  - aucune session → redirection vers `connexion.html` ;
  - session présente mais rôle non autorisé → redirection vers le
    tableau de bord correspondant à son propre rôle
    (`getHomePageForRole`).
- Pages protégées : `compte-client.html` (`client`),
  `information-compte.html` / `candidatures-client.html` /
  `messages.html` / `conversation.html` (tout utilisateur connecté),
  `compte-commercial.html` / `infos-candidature.html` (`commercial`),
  `compte-admin.html` (`direction`).

---

## 6. Endpoints API utilisés

| Méthode | Endpoint | Utilisé par |
|---|---|---|
| `POST` | `/api/login` | `auth.js` (`login`) |
| `POST` | `/api/users` | `auth.js` (`signup`) |
| `GET` | `/api/properties` | `properties.js` (`fetchProperties`), pages accueil, annonces, candidatures-client, compte-commercial, compte-admin |
| `GET` | `/api/properties/{id}` | `properties.js` (`fetchProperty`), pages description-annonce, candidatures-client, compte-commercial, infos-candidature |
| `POST` | `/api/properties` | `compte-commercial.js` (formulaire « Ajouter un bien ») |
| `GET` | `/api/agences` | `header.js` (lien « Nos agences ») |
| `POST` | `/api/analytics/predict` | `compte-commercial.js` (bouton « Estimer le prix ») |

---

## 7. Limitations actuelles & évolutions backend nécessaires

Ces points sont déjà signalés par des commentaires « À terme : ... » dans
le code, et résumés ici pour vue d'ensemble :

- **Candidatures** : pas de routes API. Stockées dans
  `STORAGE_KEYS.CANDIDATURES` (localStorage), partagées globalement (pas
  de filtre par agence/commercial). À terme :
  `POST /api/candidatures`, `GET /api/candidatures?user_id=` /
  `?property_id=`, `PUT /api/candidatures/{id}` (changement de statut).
- **Messagerie** : pas de routes API. Conversations de démonstration
  stockées dans `STORAGE_KEYS.CONVERSATIONS`. À terme :
  `GET/POST /api/messages`.
- **Gestion de compte (client)** : pas de `PUT`/`DELETE
  /api/users/{id}`. Les modifications de profil et la « suppression de
  compte » sont simulées localement (`PROFILE_OVERRIDES`,
  `deleteAccount`) sans effet en base.
- **Gestion des biens (commercial)** : pas de `PUT
  /api/properties/{id}`. Les modifications (titre, prix, statut) sont
  stockées dans `PROPERTY_OVERRIDES` et fusionnées à l'affichage
  (`getEffectiveProperty`), mais pas persistées côté serveur.
- **Suppression de biens (admin)** : pas de `DELETE
  /api/properties/{id}`. Les biens « supprimés » sont simplement masqués
  via `REMOVED_PROPERTIES`.
- **Gestion des utilisateurs (admin)** : pas de `GET /api/users` ni de
  `DELETE /api/users/{id}`. L'annuaire (`ADMIN_USERS`) est une liste de
  démonstration complétée localement à chaque inscription.
- **Filtrage des biens par agence/commercial** : `GET /api/properties`
  renvoie tous les biens sans filtre par `id_agence` ou `user_id`. Le
  tableau de bord commercial affiche donc l'ensemble des candidatures et
  biens, faute d'information de session permettant de filtrer.
- **« Score énergétique »** : champ présent dans la maquette
  `infos-candidature.html` mais absent de la table `property`. Affiché
  comme « Non renseigné » ; nécessiterait l'ajout d'une colonne en base
  si la fonctionnalité doit être réelle.
- **Prix unique (`price`)** : la table `property` ne distingue pas
  achat/location (un seul champ `price`, en `INTEGER`). Le sélecteur
  « Acheter / Louer » sur `annonces.html` est donc actuellement
  informatif uniquement et ne filtre pas les résultats sur ce critère.
- **Favoris** : stockés dans `localStorage` (`FAVORIS`), non liés à un
  compte utilisateur précis (partagés par tous les utilisateurs du même
  navigateur). À terme, un endpoint `POST/DELETE /api/favoris` lié à
  `user_id` serait nécessaire pour une vraie persistance par compte.

---

## 8. Pour aller plus loin

Lorsqu'un endpoint listé en section 7 sera ajouté côté backend, il suffit
en général de :

1. Remplacer l'appel `getXxx()` / `saveXxx()` correspondant dans
   `storage.js` par un `fetch()` vers le nouvel endpoint (en conservant
   la même signature de fonction autant que possible, pour ne pas avoir
   à modifier les scripts de page qui l'utilisent).
2. Adapter le format des données si la réponse de l'API diffère du format
   localStorage utilisé jusque-là.
3. Supprimer la clé `STORAGE_KEYS` devenue inutile (et son commentaire
   « À terme »).

Cette organisation a été pensée pour que la migration de chaque
fonctionnalité « front-only » vers une vraie API se fasse de façon isolée,
sans casser les autres pages.
