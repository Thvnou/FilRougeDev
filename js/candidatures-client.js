/* ========================================================================
   candidatures-client.js
   Page "Mes candidatures" : affiche les candidatures déposées par le
   client connecté (stockées en localStorage, voir storage.js ->
   getCandidaturesByUser), enrichies avec les informations du bien
   correspondant récupérées via GET /api/properties/{id}.

   Les onglets "Résidentiel" / "Professionnel" filtrent les candidatures
   selon le champ `category` du bien concerné.
   ======================================================================== */

let mesCandidatures = []; // [{ candidature, property }]
let ongletActif = "Résidentiel";

document.addEventListener("DOMContentLoaded", async () => {
  const session = requireAuth(["client"]);
  if (!session) return;

  const grille = document.querySelector(".annonces-grid");
  if (grille) grille.innerHTML = "<p>Chargement de vos candidatures...</p>";

  await chargerCandidatures(session.id);
  initOnglets();
  afficherCandidatures();
});

async function chargerCandidatures(userId) {
  const candidatures = getCandidaturesByUser(userId);

  const items = await Promise.all(
    candidatures.map(async (candidature) => {
      try {
        const property = await fetchProperty(candidature.property_id);
        return { candidature, property };
      } catch (e) {
        return { candidature, property: null };
      }
    })
  );

  // On ignore les candidatures dont le bien n'existe plus / est injoignable
  mesCandidatures = items.filter((item) => item.property !== null);
}

function initOnglets() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      ongletActif = tab.textContent.trim();
      afficherCandidatures();
    });
  });
}

function afficherCandidatures() {
  const grille = document.querySelector(".annonces-grid");
  if (!grille) return;

  const filtrees = mesCandidatures.filter(
    ({ property }) => property.category === ongletActif
  );

  if (filtrees.length === 0) {
    grille.innerHTML = `<p>Aucune candidature ${
      ongletActif === "Résidentiel" ? "résidentielle" : "professionnelle"
    } pour le moment.</p>`;
    return;
  }

  grille.innerHTML = filtrees
    .map(({ candidature, property }) => renderCandidatureCard(candidature, property))
    .join("");
}

function statutCandidatureLabel(status) {
  switch (status) {
    case "acceptée":
      return "Acceptée";
    case "refusée":
      return "Refusée";
    default:
      return "En attente";
  }
}

function statutCandidatureClass(status) {
  switch (status) {
    case "acceptée":
      return "statut statut--acceptee";
    case "refusée":
      return "statut statut--refusee";
    default:
      return "statut statut--attente";
  }
}

function renderCandidatureCard(candidature, property) {
  const image = getImageForProperty(property);

  return `
    <a class="annonce-card" href="description-annonce.html?id=${property.id}&img=${encodeURIComponent(image)}">
      <div class="annonce-photo">
        <img src="${image}" alt="${property.title}" />
      </div>
      <div class="annonce-prix-statut">
        <span class="prix">${formatPrice(property.price)}</span>
        <span class="${statutCandidatureClass(candidature.status)}">${statutCandidatureLabel(candidature.status)}</span>
      </div>
      <div class="annonce-info">
        <span class="ville">${property.city}</span>
        <span class="superficie">${property.area} m²</span>
      </div>
    </a>
  `;
}
