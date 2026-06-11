/* ========================================================================
   storage.js
   Couche de persistance "front" basée sur localStorage.

   Le backend FastAPI actuel ne propose pas encore d'endpoints pour :
   - les candidatures
   - les messages / conversations
   - la gestion des comptes (modification / suppression)
   - la liste des utilisateurs et la suppression d'annonces côté admin
   - les favoris

   En attendant ces évolutions du backend, toutes ces données sont
   simulées et conservées dans le localStorage du navigateur grâce aux
   fonctions ci-dessous. Chaque fonction est documentée afin de pouvoir
   être remplacée facilement par un appel `fetch()` vers l'API quand les
   endpoints correspondants existeront (voir FICHE_TECHNIQUE.md).
   ======================================================================== */

const STORAGE_KEYS = {
  SESSION: "ymmo_session",
  PROFILE_OVERRIDES: "ymmo_profile_overrides",
  CANDIDATURES: "ymmo_candidatures",
  CONVERSATIONS: "ymmo_conversations",
  FAVORIS: "ymmo_favoris",
  ADMIN_USERS: "ymmo_admin_users",
  REMOVED_PROPERTIES: "ymmo_admin_removed_properties",
  SIGNUP_COUNT: "ymmo_signup_count",
  PROPERTY_OVERRIDES: "ymmo_property_overrides",
};

/* ----------------------------- Utilitaires ---------------------------- */

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.error(`Erreur de lecture localStorage[${key}]`, e);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ------------------------------- Session -------------------------------
   La session est créée par auth.js après un appel réussi à
   POST /api/login ou POST /api/users (création de compte).
   Elle contient les champs renvoyés par l'API : id, firstname, lastname,
   email, role (et id_agence si présent).
   ------------------------------------------------------------------- */

function getSession() {
  return readJSON(STORAGE_KEYS.SESSION, null);
}

function setSession(user) {
  writeJSON(STORAGE_KEYS.SESSION, user);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

function isLoggedIn() {
  return getSession() !== null;
}

/* --------------------------- Profil utilisateur -------------------------
   Le backend ne fournit pas d'endpoint PUT/DELETE pour /api/users/{id}.
   On simule donc la modification du profil en stockant des "surcharges"
   (overrides) par identifiant utilisateur, fusionnées avec la session
   pour l'affichage.
   ------------------------------------------------------------------- */

function getProfile() {
  const session = getSession();
  if (!session) return null;
  const overrides = readJSON(STORAGE_KEYS.PROFILE_OVERRIDES, {});
  return { ...session, ...(overrides[session.id] || {}) };
}

function saveProfileOverride(fields) {
  const session = getSession();
  if (!session) return;
  const overrides = readJSON(STORAGE_KEYS.PROFILE_OVERRIDES, {});
  overrides[session.id] = { ...(overrides[session.id] || {}), ...fields };
  writeJSON(STORAGE_KEYS.PROFILE_OVERRIDES, overrides);

  // On met aussi à jour la session affichée immédiatement (nom/prénom dans le header)
  const updatedSession = { ...session, ...fields };
  setSession(updatedSession);
}

function deleteAccount() {
  const session = getSession();
  if (!session) return;
  const overrides = readJSON(STORAGE_KEYS.PROFILE_OVERRIDES, {});
  delete overrides[session.id];
  writeJSON(STORAGE_KEYS.PROFILE_OVERRIDES, overrides);
  clearSession();
}

/* ------------------------------ Candidatures -----------------------------
   Reproduit la table `candidatures` (property_id, user_id, metier, salaire,
   telephone, status). À terme : POST /api/candidatures et
   GET /api/candidatures?user_id=... / ?property_id=...
   ------------------------------------------------------------------- */

function getCandidatures() {
  return readJSON(STORAGE_KEYS.CANDIDATURES, []);
}

function saveCandidatures(list) {
  writeJSON(STORAGE_KEYS.CANDIDATURES, list);
}

function addCandidature({ property_id, metier, salaire, telephone, message }) {
  const session = getSession();
  const list = getCandidatures();
  const newCandidature = {
    id: Date.now(),
    property_id: Number(property_id),
    user_id: session ? session.id : null,
    user_nom: session ? `${session.firstname} ${session.lastname}` : "Visiteur",
    user_email: session ? session.email : "",
    metier: metier || "Non renseigné",
    salaire: salaire || 0,
    telephone: telephone || "",
    message: message || "",
    status: "en attente",
    created_at: new Date().toISOString(),
  };
  list.push(newCandidature);
  saveCandidatures(list);
  return newCandidature;
}

function getCandidaturesByUser(userId) {
  return getCandidatures().filter((c) => c.user_id === userId);
}

function getCandidaturesByProperty(propertyId) {
  return getCandidatures().filter((c) => c.property_id === Number(propertyId));
}

function updateCandidatureStatus(candidatureId, status) {
  const list = getCandidatures();
  const item = list.find((c) => c.id === candidatureId);
  if (item) {
    item.status = status;
    saveCandidatures(list);
  }
  return item;
}

function hasAlreadyApplied(propertyId, userId) {
  return getCandidatures().some(
    (c) => c.property_id === Number(propertyId) && c.user_id === userId
  );
}

/* ----------------------------- Messagerie --------------------------------
   Conversations entre un client et un commercial. Données de démonstration
   pré-remplies au premier chargement (identiques aux maquettes statiques).
   À terme : GET/POST /api/messages
   ------------------------------------------------------------------- */

function seedConversationsIfEmpty() {
  if (localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) return;

  const demo = [
    {
      id: 1,
      contact_nom: "Marie Angers",
      contact_avatar: "MA",
      contact_detail: "Agent — Appartement Paris 11e",
      property_id: null,
      unread: 2,
      messages: [
        {
          from: "contact",
          text: "Bonjour, j'ai bien reçu votre dossier de candidature pour l'appartement au 14 rue de la Roquette. Pourriez-vous nous envoyer également votre dernier avis d'imposition ?",
          date: "Mercredi 4 juin 2026",
          heure: "09:04",
        },
        {
          from: "me",
          text: "Bonjour Marie, bien sûr ! Je vous transmets le document dès ce soir.",
          date: "Mercredi 4 juin 2026",
          heure: "09:48",
        },
        {
          from: "contact",
          text: "Parfait, merci beaucoup. Nous reviendrons vers vous dans les 48h suivant la réception.",
          date: "Mercredi 4 juin 2026",
          heure: "10:12",
        },
        {
          from: "contact",
          text: "Bonjour, j'ai bien reçu votre avis d'imposition. Votre dossier est complet, il sera présenté au propriétaire cette semaine.",
          date: "Aujourd'hui — 5 juin 2026",
          heure: "14:32",
        },
        {
          from: "contact",
          text: "Pourriez-vous également confirmer vos disponibilités pour une visite la semaine prochaine ?",
          date: "Aujourd'hui — 5 juin 2026",
          heure: "14:33",
        },
      ],
    },
    {
      id: 2,
      contact_nom: "Thomas Laurent",
      contact_avatar: "TL",
      contact_detail: "Studio Lyon 6e",
      property_id: null,
      unread: 0,
      messages: [
        {
          from: "contact",
          text: "Merci pour votre retour, nous reviendrons vers vous rapidement.",
          date: "Hier",
          heure: "09:15",
        },
      ],
    },
  ];

  writeJSON(STORAGE_KEYS.CONVERSATIONS, demo);
}

function getConversations() {
  seedConversationsIfEmpty();
  return readJSON(STORAGE_KEYS.CONVERSATIONS, []);
}

function saveConversations(list) {
  writeJSON(STORAGE_KEYS.CONVERSATIONS, list);
}

function getConversation(id) {
  return getConversations().find((c) => c.id === Number(id));
}

function addMessageToConversation(conversationId, text) {
  const list = getConversations();
  const conv = list.find((c) => c.id === Number(conversationId));
  if (!conv) return null;

  const now = new Date();
  conv.messages.push({
    from: "me",
    text,
    date: "Aujourd'hui",
    heure: now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  });
  saveConversations(list);
  return conv;
}

function markConversationRead(conversationId) {
  const list = getConversations();
  const conv = list.find((c) => c.id === Number(conversationId));
  if (conv) {
    conv.unread = 0;
    saveConversations(list);
  }
}

/* ------------------------------- Favoris --------------------------------- */

function getFavoris() {
  return readJSON(STORAGE_KEYS.FAVORIS, []);
}

function isFavori(propertyId) {
  return getFavoris().includes(Number(propertyId));
}

function toggleFavori(propertyId) {
  const id = Number(propertyId);
  let favoris = getFavoris();
  if (favoris.includes(id)) {
    favoris = favoris.filter((f) => f !== id);
  } else {
    favoris.push(id);
  }
  writeJSON(STORAGE_KEYS.FAVORIS, favoris);
  return favoris.includes(id);
}

/* ----------------------- Espace Administration ---------------------------
   Le backend n'expose pas (encore) la liste des utilisateurs ni de route de
   suppression. On simule donc un annuaire d'utilisateurs avec des données
   de démonstration, modifiable côté front. Idem pour la "suppression"
   d'annonces : on masque simplement l'identifiant côté front.
   À terme : GET /api/users, DELETE /api/users/{id}, DELETE /api/properties/{id}
   ------------------------------------------------------------------- */

function seedAdminUsersIfEmpty() {
  if (localStorage.getItem(STORAGE_KEYS.ADMIN_USERS)) return;

  const demo = [
    { lastname: "Dupont", firstname: "Jean", email: "jean.dupont@email.com", role: "client", inscrit_le: "12/01/2025" },
    { lastname: "Martin", firstname: "Sophie", email: "s.martin@ymmo.fr", role: "commercial", inscrit_le: "03/09/2024" },
    { lastname: "Bernard", firstname: "Lucie", email: "lucie.b@email.com", role: "client", inscrit_le: "28/02/2025" },
    { lastname: "Lefevre", firstname: "Marc", email: "marc.lefevre@ymmo.fr", role: "commercial", inscrit_le: "15/06/2024" },
    { lastname: "Moreau", firstname: "Clara", email: "clara.moreau@email.com", role: "client", inscrit_le: "05/04/2025" },
    { lastname: "Petit", firstname: "Antoine", email: "a.petit@email.com", role: "client", inscrit_le: "18/03/2025" },
  ];
  writeJSON(STORAGE_KEYS.ADMIN_USERS, demo);
}

function getAdminUsers() {
  seedAdminUsersIfEmpty();
  return readJSON(STORAGE_KEYS.ADMIN_USERS, []);
}

function removeAdminUser(email) {
  const list = getAdminUsers().filter((u) => u.email !== email);
  writeJSON(STORAGE_KEYS.ADMIN_USERS, list);
}

function addAdminUser(user) {
  const list = getAdminUsers();
  list.push(user);
  writeJSON(STORAGE_KEYS.ADMIN_USERS, list);
}

function getRemovedPropertyIds() {
  return readJSON(STORAGE_KEYS.REMOVED_PROPERTIES, []);
}

function removePropertyId(id) {
  const removed = getRemovedPropertyIds();
  if (!removed.includes(Number(id))) {
    removed.push(Number(id));
    writeJSON(STORAGE_KEYS.REMOVED_PROPERTIES, removed);
  }
}

/* ------------------------ Surcharges des biens (commercial) ---------------
   Le backend ne propose pas (encore) de route PUT /api/properties/{id}.
   Les modifications faites par un commercial depuis infos-candidature.html
   (titre, prix, statut...) sont donc stockées localement par id de bien et
   fusionnées avec les données de l'API à l'affichage.
   À terme : PUT /api/properties/{id}
   ------------------------------------------------------------------- */

function getPropertyOverride(propertyId) {
  const overrides = readJSON(STORAGE_KEYS.PROPERTY_OVERRIDES, {});
  return overrides[propertyId] || {};
}

function savePropertyOverride(propertyId, fields) {
  const overrides = readJSON(STORAGE_KEYS.PROPERTY_OVERRIDES, {});
  overrides[propertyId] = { ...(overrides[propertyId] || {}), ...fields };
  writeJSON(STORAGE_KEYS.PROPERTY_OVERRIDES, overrides);
}

function getEffectiveProperty(property) {
  if (!property) return property;
  return { ...property, ...getPropertyOverride(property.id) };
}

/* ------------------------- Compteur d'inscriptions ------------------------ */

function incrementSignupCount() {
  const count = readJSON(STORAGE_KEYS.SIGNUP_COUNT, 0) + 1;
  writeJSON(STORAGE_KEYS.SIGNUP_COUNT, count);
  return count;
}

function getSignupCount() {
  return readJSON(STORAGE_KEYS.SIGNUP_COUNT, 0);
}
