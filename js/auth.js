/* ========================================================================
   auth.js
   Authentification, inscription, déconnexion et protection des pages
   selon le rôle de l'utilisateur connecté.

   Rôles existants en base (table users.role) : "direction", "commercial",
   "client". Le rôle "direction" correspond à l'espace "compte-admin.html".
   ======================================================================== */

const ROLE_LABELS = {
  direction: "Administrateur",
  admin: "Administrateur",
  commercial: "Commercial",
  client: "Client",
};

const ROLE_HOME_PAGE = {
  direction: "compte-admin.html",
  admin: "compte-admin.html",
  commercial: "compte-commercial.html",
  client: "compte-client.html",
};

/**
 * Retourne l'URL du tableau de bord adapté au rôle (par défaut : compte-client.html)
 */
function getHomePageForRole(role) {
  return ROLE_HOME_PAGE[role] || "compte-client.html";
}

/**
 * Connexion : appelle POST /api/login, enregistre la session en localStorage
 * et retourne l'utilisateur connecté. Lève une erreur (avec message lisible)
 * en cas d'échec.
 */
async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Email ou mot de passe incorrect");
  }

  setSession(data.user);
  return data.user;
}

/**
 * Création de compte : appelle POST /api/users (rôle "client" forcé côté
 * backend), puis connecte automatiquement l'utilisateur.
 */
async function signup({ firstname, lastname, email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstname, lastname, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || "Impossible de créer le compte");
  }

  incrementSignupCount();

  // Ajoute le nouveau client à l'annuaire affiché côté admin (en attendant
  // un endpoint GET /api/users pour la liste des utilisateurs)
  const aujourdhui = new Date().toLocaleDateString("fr-FR");
  addAdminUser({
    lastname,
    firstname,
    email,
    role: "client",
    inscrit_le: aujourdhui,
  });

  // On connecte directement l'utilisateur avec les identifiants saisis
  return login(email, password);
}

/**
 * Déconnexion : vide la session et renvoie vers la page de connexion.
 */
function logout() {
  clearSession();
  window.location.href = "connexion.html";
}

/**
 * Protège une page : si aucun utilisateur n'est connecté, redirige vers
 * connexion.html. Si `allowedRoles` est fourni et que le rôle de
 * l'utilisateur n'y figure pas, redirige vers son propre tableau de bord.
 *
 * @param {string[]|null} allowedRoles
 * @returns {object|null} l'utilisateur connecté (ou null si redirection)
 */
function requireAuth(allowedRoles = null) {
  const session = getSession();

  if (!session) {
    window.location.href = "connexion.html";
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    window.location.href = getHomePageForRole(session.role);
    return null;
  }

  return session;
}
