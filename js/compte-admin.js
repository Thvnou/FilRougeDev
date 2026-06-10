/* ========================================================================
   compte-admin.js
   Tableau de bord "direction" :
   - KPI calculés à partir de GET /api/properties (biens) et des données
     localStorage (candidatures, utilisateurs — voir storage.js, en
     attendant des endpoints dédiés GET /api/candidatures et GET /api/users)
   - Tableau des annonces publiées, avec suppression (front uniquement :
     l'identifiant est ajouté à REMOVED_PROPERTIES, voir
     getRemovedPropertyIds / removePropertyId, en attendant
     DELETE /api/properties/{id})
   - Tableau des utilisateurs inscrits (annuaire de démonstration +
     nouveaux comptes créés depuis creation-compte.html, voir
     getAdminUsers / removeAdminUser, en attendant DELETE /api/users/{id})
   ======================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const session = requireAuth(["direction"]);
  if (!session) return;

  await chargerDonnees();
});

async function chargerDonnees() {
  let properties = [];
  try {
    properties = await fetchProperties();
  } catch (e) {
    properties = [];
  }

  const removed = getRemovedPropertyIds();
  const proprietesVisibles = properties
    .filter((p) => !removed.includes(p.id))
    .map(getEffectiveProperty);

  const candidatures = getCandidatures();
  const utilisateurs = getAdminUsers();

  afficherKpis(proprietesVisibles, candidatures, utilisateurs);
  afficherTableProprietes(proprietesVisibles);
  afficherTableUtilisateurs(utilisateurs);
}

function afficherKpis(proprietes, candidatures, utilisateurs) {
  const cartes = document.querySelectorAll(".kpi-card .kpi-valeur");
  if (cartes.length < 4) return;

  const nbVendus = proprietes.filter((p) => p.status === "Vendu").length;
  const nbClients = utilisateurs.filter((u) => u.role === "client").length;

  cartes[0].textContent = proprietes.length;
  cartes[1].textContent = candidatures.length;
  cartes[2].textContent = nbClients;
  cartes[3].textContent = nbVendus;
}

function afficherTableProprietes(proprietes) {
  const section = document.querySelectorAll(".admin-section")[0];
  if (!section) return;

  const badge = section.querySelector(".badge");
  if (badge) badge.textContent = `${proprietes.length} biens`;

  const tbody = section.querySelector("tbody");
  if (!tbody) return;

  if (proprietes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Aucune annonce publiée pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = proprietes
    .map((property) => {
      const tagClass = property.status === "Vendu" ? "tag--vendu" : "tag--vente";
      return `
      <tr data-property-id="${property.id}">
        <td><img src="${getImageForProperty(property)}" alt="${property.title}" class="table-photo" /></td>
        <td>${property.city}</td>
        <td>${property.type}</td>
        <td>${formatPrice(property.price)}</td>
        <td><span class="tag ${tagClass}">${statusLabel(property.status)}</span></td>
        <td>
          <button class="btn-table btn-suppr" data-action="suppr-bien" data-id="${property.id}">Supprimer</button>
        </td>
      </tr>
    `;
    })
    .join("");

  tbody.querySelectorAll('[data-action="suppr-bien"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      removePropertyId(btn.dataset.id);
      const ligne = btn.closest("tr");
      ligne.style.transition = "opacity 0.3s";
      ligne.style.opacity = "0";
      setTimeout(() => {
        ligne.remove();
        const badgeEl = section.querySelector(".badge");
        const restantes = tbody.querySelectorAll("tr").length;
        if (badgeEl) badgeEl.textContent = `${restantes} biens`;
        const cartes = document.querySelectorAll(".kpi-card .kpi-valeur");
        if (cartes[0]) cartes[0].textContent = restantes;
      }, 300);
    });
  });
}

function tagClassForRole(role) {
  switch (role) {
    case "commercial":
      return "tag--commercial";
    case "direction":
      return "tag--direction";
    default:
      return "tag--client";
  }
}

function afficherTableUtilisateurs(utilisateurs) {
  const sections = document.querySelectorAll(".admin-section");
  const section = sections[1];
  if (!section) return;

  const badge = section.querySelector(".badge");
  if (badge) badge.textContent = `${utilisateurs.length} comptes`;

  const tbody = section.querySelector("tbody");
  if (!tbody) return;

  if (utilisateurs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Aucun utilisateur inscrit pour le moment.</td></tr>`;
    return;
  }

  tbody.innerHTML = utilisateurs
    .map(
      (user) => `
      <tr data-email="${user.email}">
        <td>${user.lastname}</td>
        <td>${user.firstname}</td>
        <td>${user.email}</td>
        <td><span class="tag ${tagClassForRole(user.role)}">${ROLE_LABELS[user.role] || user.role}</span></td>
        <td>${user.inscrit_le}</td>
        <td>
          <button class="btn-table btn-suppr" data-action="suppr-user" data-email="${user.email}">Supprimer</button>
        </td>
      </tr>
    `
    )
    .join("");

  tbody.querySelectorAll('[data-action="suppr-user"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      removeAdminUser(btn.dataset.email);
      const ligne = btn.closest("tr");
      ligne.style.transition = "opacity 0.3s";
      ligne.style.opacity = "0";
      setTimeout(() => {
        ligne.remove();
        const restants = getAdminUsers();
        const badgeEl = section.querySelector(".badge");
        if (badgeEl) badgeEl.textContent = `${restants.length} comptes`;
        const cartes = document.querySelectorAll(".kpi-card .kpi-valeur");
        if (cartes[2]) cartes[2].textContent = restants.filter((u) => u.role === "client").length;
      }, 300);
    });
  });
}
