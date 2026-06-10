/* ========================================================================
   accueil.js
   Logique de la page accueil.html :
   - Chargement dynamique des "derniers biens publiés" via l'API
   - Gestion des onglets Acheter / Vendre
   - Barre de recherche -> redirection vers annonces.html avec filtres
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  chargerDerniersBiens();
  initOngletsAcheterVendre();
  initBarreRecherche();
});

/**
 * Remplace les 3 cartes statiques par les biens les plus récents
 * renvoyés par GET /api/properties (déjà triés par date décroissante).
 */
async function chargerDerniersBiens() {
  const container = document.querySelector(".liste-biens");
  if (!container) return;

  try {
    const properties = await fetchProperties();
    const derniers = properties.slice(0, 3);

    if (derniers.length === 0) {
      container.innerHTML = "<p>Aucun bien publié pour le moment.</p>";
      return;
    }

    container.innerHTML = derniers.map(renderHomeCard).join("");
  } catch (err) {
    console.error(err);
    // En cas d'erreur (API non démarrée), on conserve les cartes
    // statiques déjà présentes dans le HTML.
  }
}

/**
 * Onglets "Acheter" / "Vendre" au-dessus de la barre de recherche.
 * - "Acheter" : comportement par défaut (recherche dans les annonces)
 * - "Vendre"  : oriente l'utilisateur vers l'espace adapté pour déposer
 *   un bien (espace commercial, ou message d'information sinon)
 */
function initOngletsAcheterVendre() {
  const btnAcheter = document.querySelector(".bouton-acheter");
  const btnVendre = document.querySelector(".bouton-vendre");
  if (!btnAcheter || !btnVendre) return;

  btnAcheter.classList.add("active");

  btnAcheter.addEventListener("click", () => {
    btnAcheter.classList.add("active");
    btnVendre.classList.remove("active");
  });

  btnVendre.addEventListener("click", () => {
    btnVendre.classList.add("active");
    btnAcheter.classList.remove("active");

    const session = getSession();
    if (session && session.role === "commercial") {
      window.location.href = "compte-commercial.html";
    } else if (session && (session.role === "direction" || session.role === "admin")) {
      window.location.href = "compte-admin.html";
    } else {
      alert(
        "Pour déposer un bien à la vente, contactez votre agence YMMO via la messagerie ou créez un compte."
      );
    }
  });
}

/**
 * Barre de recherche : redirige vers annonces.html avec les critères
 * saisis transmis en paramètres d'URL (lus ensuite par annonces.js).
 */
function initBarreRecherche() {
  const inputs = document.querySelectorAll(".formulaire-recherche input");
  const btnRecherche = document.querySelector(".bouton-recherche");
  if (!btnRecherche || inputs.length < 3) return;

  const [inputVille, inputBudget, inputSurface] = inputs;

  function lancerRecherche() {
    const params = new URLSearchParams();
    if (inputVille.value.trim()) params.set("ville", inputVille.value.trim());
    if (inputBudget.value) params.set("budget", inputBudget.value);
    if (inputSurface.value) params.set("surface", inputSurface.value);

    const type = document.querySelector(".bouton-vendre.active") ? "louer" : "acheter";
    params.set("type", type);

    window.location.href = `annonces.html?${params.toString()}`;
  }

  btnRecherche.addEventListener("click", lancerRecherche);

  [inputVille, inputBudget, inputSurface].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") lancerRecherche();
    });
  });
}
