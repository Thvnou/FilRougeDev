/* ========================================================================
   annonces.js
   Logique de la page annonces.html :
   - Chargement de tous les biens via GET /api/properties
   - Filtres (ville, budget max, surface min, favoris) lus depuis l'URL
     et modifiables en direct
   - Tri par prix
   - Gestion des favoris (localStorage)
   ======================================================================== */

let toutesLesAnnonces = [];
let triPrixCroissant = true;
let categorieActuelle = "tous";

document.addEventListener("DOMContentLoaded", async () => {
  await chargerAnnonces();
  preremplirFiltresDepuisURL();
  initFiltresEnDirect();
  initOngletsCategorie();
  initTri();
  initFavoris();
});

async function chargerAnnonces() {
  const grille = document.querySelector(".annonces-grid");
  try {
    toutesLesAnnonces = await fetchProperties();
  } catch (err) {
    console.error(err);
    if (grille) {
      grille.innerHTML =
        "<p>Impossible de charger les annonces. Vérifiez que l'API est démarrée.</p>";
    }
    return;
  }
  appliquerFiltresEtAfficher();
}

/**
 * Lit les paramètres de l'URL (transmis depuis la barre de recherche de
 * l'accueil ou le lien "Mes favoris") et pré-remplit les champs du
 * formulaire de filtre correspondants.
 */
function preremplirFiltresDepuisURL() {
  const params = new URLSearchParams(window.location.search);
  const inputs = document.querySelectorAll(".formulaire-recherche input");
  const select = document.querySelector(".formulaire-recherche select");

  if (inputs.length >= 3) {
    if (params.get("ville")) inputs[0].value = params.get("ville");
    if (params.get("budget")) inputs[1].value = params.get("budget");
    if (params.get("surface")) inputs[2].value = params.get("surface");
  }

  if (select && params.get("type")) {
    select.value = params.get("type");
  }

  // Catégorie (Résidentiel / Professionnel) transmise via ?categorie=...
  const categorie = params.get("categorie");
  if (categorie === "Résidentiel" || categorie === "Professionnel") {
    categorieActuelle = categorie;
    document.querySelectorAll(".onglet-categorie").forEach((onglet) => {
      const actif = onglet.dataset.categorie === categorie;
      onglet.classList.toggle("active", actif);
      onglet.setAttribute("aria-selected", actif ? "true" : "false");
    });
  }
}

/**
 * Applique les filtres actuellement saisis dans le formulaire (+ le
 * paramètre "favoris" éventuel de l'URL) et réaffiche la grille.
 */
function appliquerFiltresEtAfficher() {
  const params = new URLSearchParams(window.location.search);
  const inputs = document.querySelectorAll(".formulaire-recherche input");
  const [inputVille, inputBudget, inputSurface] = inputs;

  let liste = [...toutesLesAnnonces];

  if (categorieActuelle === "Résidentiel" || categorieActuelle === "Professionnel") {
    liste = liste.filter((p) => p.category === categorieActuelle);
  }

  const ville = inputVille ? inputVille.value.trim().toLowerCase() : "";
  const budget = inputBudget ? inputBudget.value : "";
  const surface = inputSurface ? inputSurface.value : "";
  const favorisUniquement = params.get("favoris") === "1";

  if (ville) {
    liste = liste.filter(
      (p) =>
        p.city.toLowerCase().includes(ville) ||
        p.title.toLowerCase().includes(ville) ||
        p.postcode.includes(ville)
    );
  }

  if (budget) {
    liste = liste.filter((p) => p.price <= Number(budget));
  }

  if (surface) {
    liste = liste.filter((p) => p.area >= Number(surface));
  }

  if (favorisUniquement) {
    liste = liste.filter((p) => isFavori(p.id));
  }

  liste.sort((a, b) => (triPrixCroissant ? a.price - b.price : b.price - a.price));

  renderAnnonces(liste, favorisUniquement);
}

function renderAnnonces(liste, favorisUniquement) {
  const grille = document.querySelector(".annonces-grid");
  if (!grille) return;

  if (liste.length === 0) {
    grille.innerHTML = `<p>${
      favorisUniquement
        ? "Vous n'avez pas encore ajouté d'annonce à vos favoris."
        : "Aucune annonce ne correspond à votre recherche."
    }</p>`;
    return;
  }

  grille.innerHTML = liste.map(renderAnnonceCard).join("");
}

/**
 * Filtres en direct : on ré-applique le filtrage à chaque saisie.
 */
function initFiltresEnDirect() {
  document.querySelectorAll(".formulaire-recherche input, .formulaire-recherche select").forEach((el) => {
    el.addEventListener("input", appliquerFiltresEtAfficher);
    el.addEventListener("change", appliquerFiltresEtAfficher);
  });
}

/**
 * Onglets "Tous les biens / Résidentiel / Professionnel" : filtrent la
 * grille par catégorie de bien.
 */
function initOngletsCategorie() {
  const onglets = document.querySelectorAll(".onglet-categorie");
  if (!onglets.length) return;

  onglets.forEach((onglet) => {
    onglet.addEventListener("click", () => {
      categorieActuelle = onglet.dataset.categorie;

      onglets.forEach((o) => {
        const actif = o === onglet;
        o.classList.toggle("active", actif);
        o.setAttribute("aria-selected", actif ? "true" : "false");
      });

      appliquerFiltresEtAfficher();
    });
  });
}

/**
 * Bouton "Trier" : alterne tri croissant / décroissant sur le prix.
 */
function initTri() {
  const btnTrier = document.querySelector(".bouton-trier");
  if (!btnTrier) return;

  btnTrier.addEventListener("click", () => {
    triPrixCroissant = !triPrixCroissant;
    btnTrier.textContent = triPrixCroissant ? "Trier (prix croissant)" : "Trier (prix décroissant)";
    appliquerFiltresEtAfficher();
  });
}

/**
 * Délégation d'événement pour les boutons "favoris" (étoile) générés
 * dynamiquement dans chaque carte.
 */
function initFavoris() {
  const grille = document.querySelector(".annonces-grid");
  if (!grille) return;

  grille.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-favori");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const id = btn.dataset.id;
    const estFavori = toggleFavori(id);
    btn.classList.toggle("active", estFavori);
    btn.textContent = estFavori ? "★" : "☆";
  });
}
