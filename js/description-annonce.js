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
 * - ouvre la modale de candidature (formulaire complet, voir
 *   initModalCandidature / envoyerCandidature)
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

    ouvrirModalCandidature();
  });

  // Si déjà candidaté (et utilisateur connecté), on désactive directement
  const session = getSession();
  if (session && propertyId && hasAlreadyApplied(propertyId, session.id)) {
    btn.disabled = true;
    btn.textContent = "Candidature envoyée ✓";
  }

  initModalCandidature();
}

/* ------------------------------------------------------------------------
   Modale de candidature
   - ouvrirModalCandidature() / fermerModalCandidature() : affichage
   - validerFormulaireCandidature() : validation des champs avec messages
     d'erreur affichés directement sous chaque champ
   - envoyerCandidature() : enregistre la candidature et affiche un message
     de confirmation dans la modale (sans alert())
   ------------------------------------------------------------------------ */

const REGEX_TELEPHONE = /^(?:\+33|0)\s*[1-9](?:[\s.-]?\d{2}){4}$/;

/**
 * Branche les interactions de la modale (fermeture, clic en dehors,
 * touche Échap, soumission du formulaire).
 */
function initModalCandidature() {
  const overlay = document.getElementById("modal-candidature");
  const form = document.getElementById("form-candidature");
  const btnFermer = document.getElementById("modal-candidature-fermer");
  const btnAnnuler = document.getElementById("modal-candidature-annuler");
  const btnFermerSucces = document.getElementById("modal-candidature-fermer-succes");

  if (!overlay || !form) return;

  btnFermer.addEventListener("click", fermerModalCandidature);
  btnAnnuler.addEventListener("click", fermerModalCandidature);

  btnFermerSucces.addEventListener("click", () => {
    fermerModalCandidature();
    const btn = document.querySelector(".btn-candidature");
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Candidature envoyée ✓";
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) fermerModalCandidature();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) fermerModalCandidature();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    envoyerCandidature();
  });
}

/**
 * Ouvre la modale, réinitialise le formulaire et affiche le bien concerné.
 */
function ouvrirModalCandidature() {
  const overlay = document.getElementById("modal-candidature");
  const form = document.getElementById("form-candidature");
  const succes = document.getElementById("modal-candidature-succes");
  const bienLabel = document.getElementById("modal-candidature-bien");

  if (!overlay || !form || !succes) return;

  bienLabel.textContent = bienActuel
    ? `${bienActuel.title} — Réf. ${String(bienActuel.id).padStart(5, "0")}`
    : "—";

  form.reset();
  form.hidden = false;
  succes.hidden = true;
  reinitialiserErreursCandidature();

  overlay.hidden = false;
  document.body.style.overflow = "hidden";

  const premierChamp = document.getElementById("cand-profession");
  if (premierChamp) premierChamp.focus();
}

/**
 * Ferme la modale (sans toucher à l'état du bouton "candidature").
 */
function fermerModalCandidature() {
  const overlay = document.getElementById("modal-candidature");
  if (!overlay) return;

  overlay.hidden = true;
  document.body.style.overflow = "";
}

/**
 * Retire les messages / styles d'erreur de tous les champs du formulaire.
 */
function reinitialiserErreursCandidature() {
  document.querySelectorAll("#form-candidature .champ").forEach((champ) => {
    champ.classList.remove("invalide");
  });
  document.querySelectorAll("#form-candidature .champ-erreur").forEach((span) => {
    span.textContent = "";
  });
}

/**
 * Affiche un message d'erreur sous le champ donné et le marque en rouge.
 */
function afficherErreurCandidature(idChamp, idErreur, message) {
  const champ = document.getElementById(idChamp);
  const erreur = document.getElementById(idErreur);

  if (champ) champ.closest(".champ").classList.add("invalide");
  if (erreur) erreur.textContent = message;
}

/**
 * Valide les champs obligatoires du formulaire de candidature :
 * - profession : non vide
 * - salaire : nombre positif
 * - téléphone : format français (ex : 06 12 34 56 78, +33 6 12 34 56 78)
 * Affiche les erreurs sous chaque champ et place le focus sur le premier
 * champ invalide.
 */
function validerFormulaireCandidature() {
  reinitialiserErreursCandidature();

  let valide = true;
  let premierChampInvalide = null;

  const profession = document.getElementById("cand-profession").value.trim();
  const salaire = document.getElementById("cand-salaire").value.trim();
  const telephone = document.getElementById("cand-telephone").value.trim();

  if (!profession) {
    afficherErreurCandidature("cand-profession", "err-profession", "Merci d'indiquer votre profession.");
    valide = false;
    premierChampInvalide = premierChampInvalide || "cand-profession";
  }

  if (!salaire) {
    afficherErreurCandidature("cand-salaire", "err-salaire", "Merci d'indiquer votre salaire mensuel net.");
    valide = false;
    premierChampInvalide = premierChampInvalide || "cand-salaire";
  } else if (isNaN(Number(salaire)) || Number(salaire) <= 0) {
    afficherErreurCandidature("cand-salaire", "err-salaire", "Le salaire doit être un nombre positif.");
    valide = false;
    premierChampInvalide = premierChampInvalide || "cand-salaire";
  }

  if (!telephone) {
    afficherErreurCandidature("cand-telephone", "err-telephone", "Merci d'indiquer un numéro de téléphone.");
    valide = false;
    premierChampInvalide = premierChampInvalide || "cand-telephone";
  } else if (!REGEX_TELEPHONE.test(telephone)) {
    afficherErreurCandidature("cand-telephone", "err-telephone", "Numéro invalide (ex : 06 12 34 56 78).");
    valide = false;
    premierChampInvalide = premierChampInvalide || "cand-telephone";
  }

  if (!valide && premierChampInvalide) {
    document.getElementById(premierChampInvalide).focus();
  }

  return valide;
}

/**
 * Valide puis enregistre la candidature (localStorage, voir
 * addCandidature dans storage.js), et affiche le message de confirmation
 * dans la modale.
 */
function envoyerCandidature() {
  if (!validerFormulaireCandidature()) return;

  const profession = document.getElementById("cand-profession").value.trim();
  const salaire = document.getElementById("cand-salaire").value.trim();
  const telephone = document.getElementById("cand-telephone").value.trim();
  const message = document.getElementById("cand-message").value.trim();

  addCandidature({
    property_id: propertyId,
    metier: profession,
    salaire: Number(salaire),
    telephone,
    message,
  });

  document.getElementById("form-candidature").hidden = true;
  document.getElementById("modal-candidature-succes").hidden = false;
}
