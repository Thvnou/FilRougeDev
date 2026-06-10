/* ========================================================================
   properties.js
   Fonctions communes liées aux biens immobiliers (annonces) :
   appels API, formatage et génération des cartes affichées sur
   accueil.html, annonces.html, candidatures-client.html, etc.
   ======================================================================== */

/**
 * Récupère la liste de tous les biens (GET /api/properties).
 */
async function fetchProperties() {
  const res = await fetch(`${API_BASE_URL}/api/properties`);
  if (!res.ok) throw new Error("Impossible de charger les annonces.");
  return res.json();
}

/**
 * Récupère un bien précis (GET /api/properties/{id}).
 */
async function fetchProperty(id) {
  const res = await fetch(`${API_BASE_URL}/api/properties/${id}`);
  if (!res.ok) throw new Error("Bien introuvable.");
  return res.json();
}

/**
 * La base de données ne stocke pas (encore) de photo par bien : on choisit
 * une image parmi le pool disponible dans images/appart/, de façon stable
 * pour un même bien (basé sur son id).
 */
const PROPERTY_IMAGE_POOL = [
  "images/appart/appart-1.jpeg",
  "images/appart/appart-2.jpeg",
  "images/appart/appart-3.jpeg",
  "images/appart/appart-11.jpeg",
  "images/appart/appart-12.jpeg",
  "images/appart/appart-13.jpeg",
  "images/appart/appart-14.jpeg",
  "images/appart/appart-15.jpeg",
  "images/appart/appart-16.jpeg",
];

function getImageForProperty(property) {
  const index = Number(property.id) % PROPERTY_IMAGE_POOL.length;
  return PROPERTY_IMAGE_POOL[index];
}

function formatPrice(price) {
  return `${Number(price).toLocaleString("fr-FR")} €`;
}

/**
 * Le statut en base est "Disponible" ou "Vendu". On l'affiche tel quel,
 * en remplaçant "Disponible" par "À vendre" pour coller au design.
 */
function statusLabel(status) {
  return status === "Disponible" ? "À vendre" : status;
}

function statusClass(status) {
  return status === "Disponible" ? "statut" : "statut statut--vendu";
}

/**
 * Génère le markup d'une carte pour la page d'accueil (.carte-bien).
 */
function renderHomeCard(property) {
  return `
    <div class="carte-bien">
      <a href="description-annonce.html?id=${property.id}&img=${getImageForProperty(property)}">
        <img src="${getImageForProperty(property)}" alt="Photo du bien" />
        <div class="infos-bien">
          <div class="infos-principales">
            <span class="prix">${formatPrice(property.price)}</span>
            <span class="${statusClass(property.status)}">${statusLabel(property.status)}</span>
          </div>
          <div class="infos-secondaires">
            <span class="ville">${property.city}</span>
            <span class="superficie">${property.area} m²</span>
          </div>
        </div>
      </a>
    </div>
  `;
}

/**
 * Génère le markup d'une carte pour la page annonces (.annonce-card).
 */
function renderAnnonceCard(property) {
  const img = getImageForProperty(property);
  const favori = typeof isFavori === "function" && isFavori(property.id);
  return `
    <div class="annonce-card-wrapper">
      <a class="annonce-card" href="description-annonce.html?id=${property.id}&img=${img}">
        <div class="annonce-photo">
          <img src="${img}" alt="${property.title}" />
        </div>
        <div class="annonce-prix-statut">
          <span class="prix">${formatPrice(property.price)}</span>
          <span class="statut">${statusLabel(property.status)}</span>
        </div>
        <div class="annonce-info">
          <span class="ville">${property.city} — ${property.title}</span>
          <span class="superficie">${property.area} m² · ${property.rooms} pièces</span>
        </div>
      </a>
      <button class="btn-favori ${favori ? "active" : ""}" data-id="${property.id}" title="Ajouter aux favoris">
        ${favori ? "★" : "☆"}
      </button>
    </div>
  `;
}
