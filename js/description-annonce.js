/* ========================================================================
   description-annonce.js
   Logique de la page description-annonce.html :
   - Affichage du bien sélectionné (GET /api/properties/{id})
   - Ajout / retrait des favoris
   - Envoi d'une candidature (stockée en localStorage, voir storage.js)
   ======================================================================== */

const params = new URLSearchParams(window.location.search);
const propertyId = params.get("id");
const photoTransmise = params.get("img");

let bienActuel = null;

document.addEventListener("DOMContentLoaded", () => {
  afficherPhotoImmediate();
  chargerBien();
  initBoutonFavori();
  initBoutonCandidature();
});

/**
 * Affiche immédiatement la photo transmise depuis annonces.html /
 * accueil.html, en attendant la réponse de l'API.
 */
function afficherPhotoImmediate() {
  if (photoTransmise) {
    document.getElementById("detail-img").src = photoTransmise;
  }
}

/**
 * Récupère les informations détaillées du bien depuis l'API.
 */
async function chargerBien() {
  if (!propertyId) return;

  try {
    bienActuel = await fetchProperty(propertyId);

    document.getElementById("detail-ref").textContent = `Réf. ${String(bienActuel.id).padStart(5, "0")}`;
    document.getElementById("detail-type").textContent = bienActuel.type;
    document.getElementById("detail-category").textContent = bienActuel.category;
    document.getElementById("detail-city").textContent = bienActuel.city;
    document.getElementById("detail-area").textContent = `${bienActuel.area} m²`;
    document.getElementById("detail-price").textContent = formatPrice(bienActuel.price);
    document.getElementById("detail-rooms").textContent = bienActuel.rooms;

    if (!photoTransmise) {
      document.getElementById("detail-img").src = getImageForProperty(bienActuel);
    }

    mettreAJourBoutonFavori();
  } catch (err) {
    console.error("Impossible de charger les données du bien", err);
  }
}

/**
 * Bouton "★ Favoris" : ajoute / retire le bien des favoris (localStorage).
 */
function initBoutonFavori() {
  const btn = document.getElementById("btn-favori-detail");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (!propertyId) return;
    const estFavori = toggleFavori(propertyId);
    mettreAJourBoutonFavori();
  });
}

function mettreAJourBoutonFavori() {
  const btn = document.getElementById("btn-favori-detail");
  if (!btn || !propertyId) return;
  const estFavori = isFavori(propertyId);
  btn.textContent = estFavori ? "★ Dans mes favoris" : "☆ Ajouter aux favoris";
  btn.classList.toggle("active", estFavori);
}

/**
 * Bouton "J'envoie ma candidature" :
 * - redirige vers la connexion si l'utilisateur n'est pas connecté
 * - réservé aux comptes "client"
 * - empêche une double candidature sur le même bien
 * - enregistre la candidature (localStorage) avec quelques informations
 *   complémentaires demandées via de petites invites (prompt)
 */
function initBoutonCandidature() {
  const btn = document.querySelector(".btn-candidature");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const session = getSession();

    if (!session) {
      if (confirm("Vous devez être connecté pour candidater. Aller à la page de connexion ?")) {
        window.location.href = "connexion.html";
      }
      return;
    }

    if (session.role !== "client") {
      alert("Seuls les comptes clients peuvent envoyer une candidature.");
      return;
    }

    if (!propertyId) {
      alert("Bien introuvable, impossible de candidater.");
      return;
    }

    if (hasAlreadyApplied(propertyId, session.id)) {
      alert("Vous avez déjà envoyé une candidature pour ce bien.");
      btn.disabled = true;
      btn.textContent = "Candidature envoyée ✓";
      return;
    }

    const metier = prompt("Votre métier / profession actuelle :");
    if (metier === null) return; // annulé

    const salaire = prompt("Votre salaire mensuel net (€) :");
    if (salaire === null) return;

    const telephone = prompt("Votre numéro de téléphone :");
    if (telephone === null) return;

    addCandidature({
      property_id: propertyId,
      metier: metier.trim(),
      salaire: Number(salaire) || 0,
      telephone: telephone.trim(),
    });

    alert("Votre candidature a bien été envoyée à l'agence !");
    btn.disabled = true;
    btn.textContent = "Candidature envoyée ✓";
  });

  // Si déjà candidaté (et utilisateur connecté), on désactive directement
  const session = getSession();
  if (session && propertyId && hasAlreadyApplied(propertyId, session.id)) {
    btn.disabled = true;
    btn.textContent = "Candidature envoyée ✓";
  }
}
