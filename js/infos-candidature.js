/* ========================================================================
   infos-candidature.js
   Fiche détaillée d'un bien (paramètre `?id=` dans l'URL), utilisée par le
   commercial pour :
   - consulter / modifier les informations du bien (POST /api/properties
     existe mais il n'y a pas encore de route PUT /api/properties/{id} :
     les modifications sont donc enregistrées en localStorage via
     savePropertyOverride, voir storage.js)
   - consulter et traiter les candidatures reçues pour ce bien
     (getCandidaturesByProperty / updateCandidatureStatus, en attendant
     une route GET/PATCH /api/candidatures)
   ======================================================================== */

let bienActuel = null;

document.addEventListener("DOMContentLoaded", async () => {
  const session = requireAuth(["commercial"]);
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    window.location.href = "compte-commercial.html";
    return;
  }

  try {
    const property = await fetchProperty(id);
    bienActuel = getEffectiveProperty(property);
  } catch (e) {
    alert("Ce bien est introuvable.");
    window.location.href = "compte-commercial.html";
    return;
  }

  afficherBien();
  initBoutonModifier();
  afficherCandidats();
});

function afficherBien() {
  document.querySelector(".bien-photo").innerHTML =
    `<img src="${getImageForProperty(bienActuel)}" alt="${bienActuel.title}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;" />`;

  document.querySelector(".bien-reference").textContent = `${bienActuel.title} — Réf. #${bienActuel.id}`;

  const valeurs = document.querySelectorAll(".bien-infos .info-row span:last-child");
  // Ordre des lignes dans le HTML : Type, Catégorie, Ville, Superficie, Prix, Pièces, Score énergétique
  valeurs[0].textContent = bienActuel.type;
  valeurs[1].textContent = bienActuel.category;
  valeurs[2].textContent = bienActuel.city;
  valeurs[3].textContent = `${bienActuel.area} m²`;
  valeurs[4].textContent = `${formatPrice(bienActuel.price)} — ${statusLabel(bienActuel.status)}`;
  valeurs[5].textContent = bienActuel.rooms;
  // Le score énergétique n'existe pas dans le modèle de données actuel (table property)
  valeurs[6].textContent = "Non renseigné";
}

function initBoutonModifier() {
  const btn = document.querySelector(".btn-modifier");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const nouveauTitre = prompt("Titre de l'annonce :", bienActuel.title);
    if (nouveauTitre === null) return;

    const nouveauPrix = prompt("Prix (€) :", bienActuel.price);
    if (nouveauPrix === null) return;

    const nouveauStatut = prompt("Statut (Disponible ou Vendu) :", bienActuel.status);
    if (nouveauStatut === null) return;

    if (
      !nouveauTitre.trim() ||
      isNaN(Number(nouveauPrix)) ||
      !["Disponible", "Vendu"].includes(nouveauStatut.trim())
    ) {
      alert("Valeurs invalides : vérifiez le titre, le prix et le statut (Disponible ou Vendu).");
      return;
    }

    const fields = {
      title: nouveauTitre.trim(),
      price: Number(nouveauPrix),
      status: nouveauStatut.trim(),
    };

    savePropertyOverride(bienActuel.id, fields);
    bienActuel = { ...bienActuel, ...fields };
    afficherBien();
    alert("Modifications enregistrées (en attente d'une route API dédiée pour les répercuter en base).");
  });
}

function afficherCandidats() {
  const container = document.querySelector(".section-candidature");
  if (!container) return;

  // On retire les anciennes cartes mais on garde le titre "les candidats :"
  container.querySelectorAll(".candidat-card, .candidats-vide").forEach((el) => el.remove());

  const candidats = getCandidaturesByProperty(bienActuel.id);

  if (candidats.length === 0) {
    const p = document.createElement("p");
    p.className = "candidats-vide";
    p.textContent = "Aucune candidature pour ce bien pour le moment.";
    container.appendChild(p);
    return;
  }

  candidats.forEach((candidat) => {
    const card = document.createElement("div");
    card.className = "candidat-card";
    const messageHtml = candidat.message
      ? `<p class="candidat-message">« ${candidat.message} »</p>`
      : "";

    card.innerHTML = `
      <span class="candidat-nom">${candidat.user_nom}</span>
      <div class="candidat-infos">
        <ul>
          <li>${candidat.metier}</li>
          <li>${candidat.salaire ? formatPrice(candidat.salaire) + " / mois" : "Salaire non renseigné"}</li>
          <li>${candidat.user_email}</li>
          <li>${candidat.telephone || "Non renseigné"}</li>
        </ul>
        ${messageHtml}
      </div>
      <div class="candidat-actions">
        <button class="btn-yn yes${candidat.status === "acceptée" ? " active" : ""}" data-id="${candidat.id}" data-action="acceptée">Y</button>
        <button class="btn-yn no${candidat.status === "refusée" ? " active" : ""}" data-id="${candidat.id}" data-action="refusée">N</button>
      </div>
    `;
    container.appendChild(card);
  });

  container.querySelectorAll(".btn-yn").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateCandidatureStatus(Number(btn.dataset.id), btn.dataset.action);
      afficherCandidats();
    });
  });
}
