/* ========================================================================
   biens-favoris.js
   Logique de la page biens-favoris.html :
   - Page accessible uniquement aux utilisateurs connectés (sinon
     redirection vers connexion.html, voir requireAuth). Depuis l'accueil,
     le lien "Mes favoris" redirige les visiteurs non connectés vers
     creation-compte.html (voir header.js).
   - Récupère les identifiants de biens favoris (localStorage, voir
     getFavoris() dans storage.js) puis charge le détail de chaque bien
     via GET /api/properties/{id}.
   - Permet de retirer un bien des favoris directement depuis cette page
     (le retire alors de la liste affichée).
   ======================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const session = requireAuth();
  if (!session) return;

  await chargerFavoris();
  initFavoris();
});

/**
 * Charge et affiche les biens correspondant aux favoris de l'utilisateur.
 */
async function chargerFavoris() {
  const grille = document.querySelector(".annonces-grid");
  if (!grille) return;

  const favorisIds = getFavoris();

  if (favorisIds.length === 0) {
    afficherFavorisVide(grille);
    return;
  }

  let biens = [];
  try {
    const resultats = await Promise.all(
      favorisIds.map((id) => fetchProperty(id).catch(() => null))
    );
    biens = resultats.filter((bien) => bien !== null);
  } catch (err) {
    console.error(err);
    grille.innerHTML = "<p>Impossible de charger vos favoris pour le moment.</p>";
    return;
  }

  if (biens.length === 0) {
    afficherFavorisVide(grille);
    return;
  }

  grille.innerHTML = biens.map(renderAnnonceCard).join("");
}

/**
 * Affiche le message "aucun favori" avec un lien vers les annonces.
 */
function afficherFavorisVide(grille) {
  grille.innerHTML = `
    <p>
      Vous n'avez pas encore ajouté de bien à vos favoris.<br />
      <a class="lien-annonces" href="annonces.html">Découvrir les annonces</a>
    </p>
  `;
}

/**
 * Délégation d'événement pour les boutons "favoris" (étoile) générés
 * dynamiquement dans chaque carte : ici, retirer un favori retire
 * également la carte de l'affichage.
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

    if (!estFavori) {
      const carte = btn.closest(".annonce-card-wrapper");
      if (carte) {
        carte.style.transition = "opacity 0.3s";
        carte.style.opacity = "0";
        setTimeout(() => {
          carte.remove();
          if (!grille.querySelector(".annonce-card-wrapper")) {
            afficherFavorisVide(grille);
          }
        }, 300);
      }
    }
  });
}
