/* ========================================================================
   header.js
   Logique commune à toutes les pages : mise à jour du bandeau
   utilisateur, bouton de déconnexion, et liens de la barre "top-page"
   (Nos agences / Mes favoris / Mon compte).

   Ce script est inclus sur toutes les pages, après config.js et
   storage.js / auth.js.
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeaderUserInfo();
  initLogoutButton();
  initTopNavLinks();
  initMesCandidaturesButton();
});

/**
 * Met à jour le bloc ".info-utilisateur" (nom + rôle) si un utilisateur
 * est connecté. Sur les pages publiques (accueil, annonces...), le bloc
 * affiche par défaut "YMMO Agence / visiteur" : on le remplace alors par
 * les informations du compte connecté.
 */
function initHeaderUserInfo() {
  const bloc = document.querySelector(".info-utilisateur");
  if (!bloc) return;

  const titre = bloc.querySelector("h1");
  const sousTitre = bloc.querySelector("h3");
  const profile = typeof getProfile === "function" ? getProfile() : getSession();

  if (profile) {
    if (titre) titre.textContent = `${profile.firstname} ${profile.lastname}`;
    if (sousTitre) sousTitre.textContent = ROLE_LABELS[profile.role] || profile.role;
  }
}

/**
 * Branche le bouton "Déconnexion" (présent sur les espaces compte-*).
 */
function initLogoutButton() {
  const btn = document.querySelector(".btn-deconnexion");
  if (!btn) return;

  btn.addEventListener("click", () => {
    logout();
  });
}

/**
 * Branche les liens de la barre supérieure :
 * - #nav-accueil : redirige vers la page d'accueil
 * - #nav-agences : affiche la liste des agences (GET /api/agences)
 * - #nav-favoris : redirige vers la page "Mes biens favoris" si connecté,
 *   ou vers la création de compte pour un visiteur
 * - #nav-compte  : redirige vers l'espace personnel (ou la connexion)
 */
function initTopNavLinks() {
  const lienAccueil = document.getElementById("nav-accueil");
  const lienAgences = document.getElementById("nav-agences");
  const lienFavoris = document.getElementById("nav-favoris");
  const lienCompte = document.getElementById("nav-compte");

  if (lienAccueil) {
    lienAccueil.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "accueil.html";
    });
  }

  if (lienAgences) {
    lienAgences.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API_BASE_URL}/api/agences`);
        const agences = await res.json();
        const liste = agences
          .map((a) => `• ${a.name} — ${a.city} (${a.postcode})`)
          .join("\n");
        alert(`Nos agences YMMO :\n\n${liste}`);
      } catch (err) {
        alert("Impossible de récupérer la liste des agences pour le moment.");
      }
    });
  }

  if (lienFavoris) {
    lienFavoris.addEventListener("click", (e) => {
      e.preventDefault();
      const session = getSession();
      if (session) {
        window.location.href = "biens-favoris.html";
      } else {
        window.location.href = "creation-compte.html";
      }
    });
  }

  if (lienCompte) {
    lienCompte.addEventListener("click", (e) => {
      e.preventDefault();
      const session = getSession();
      if (session) {
        window.location.href = getHomePageForRole(session.role);
      } else {
        window.location.href = "connexion.html";
      }
    });
  }
}

/**
 * Sur l'accueil, le bloc ".menu-actions" contient deux boutons :
 * - "Mes candidatures" : affiché uniquement pour un client connecté ;
 * - "Connexion" : affiché pour un visiteur non connecté, renvoie vers
 *   connexion.html.
 * Dans tous les cas, on conserve la place des boutons dans la mise en page
 * (header.menu utilise justify-content: space-between) en utilisant
 * `visibility: hidden` plutôt que `display: none`, pour que le bloc
 * info-utilisateur reste centré.
 */
function initMesCandidaturesButton() {
  const btnCandidatures = document.querySelector(".bouton-mes-candidatures");
  const btnConnexion = document.getElementById("btn-connexion-header");

  const session = getSession();

  if (session && session.role === "client") {
    if (btnCandidatures) {
      btnCandidatures.addEventListener("click", () => {
        window.location.href = "candidatures-client.html";
      });
    }
    if (btnConnexion) btnConnexion.style.visibility = "hidden";
  } else if (!session) {
    if (btnCandidatures) btnCandidatures.style.visibility = "hidden";
    if (btnConnexion) {
      btnConnexion.addEventListener("click", () => {
        window.location.href = "connexion.html";
      });
    }
  } else {
    // Connecté mais pas en tant que client (commercial / direction) : on
    // masque les deux boutons tout en conservant leur place.
    if (btnCandidatures) btnCandidatures.style.visibility = "hidden";
    if (btnConnexion) btnConnexion.style.visibility = "hidden";
  }
}
