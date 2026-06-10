/* ========================================================================
   compte-commercial.js
   Tableau de bord du commercial :
   - "Dernières candidatures" : regroupe les candidatures stockées en
     localStorage (voir storage.js -> getCandidatures, données partagées
     en attendant un endpoint GET /api/candidatures) par bien, récupère
     les infos du bien via GET /api/properties/{id} et affiche une carte
     par bien avec un lien vers infos-candidature.html.
   - "Ajouter un bien" : formulaire de publication d'une annonce via
     POST /api/properties, avec un bouton d'estimation de prix par l'IA
     (POST /api/analytics/predict).
   ======================================================================== */

let candidaturesParBien = []; // [{ property, nbCandidatures, derniereCandidature }]
let ongletActif = "Résidentiel";

document.addEventListener("DOMContentLoaded", async () => {
  const session = requireAuth(["commercial"]);
  if (!session) return;

  const grille = document.querySelector(".candidatures-grid");
  if (grille) grille.innerHTML = "<p>Chargement des candidatures...</p>";

  await chargerCandidatures();
  initOnglets();
  afficherCandidatures();
  initFormulaireBien(session);
});

async function chargerCandidatures() {
  const candidatures = getCandidatures();

  // On garde la candidature la plus récente pour chaque bien concerné
  const parBien = new Map();
  candidatures.forEach((c) => {
    const existante = parBien.get(c.property_id);
    if (!existante || c.id > existante.id) {
      parBien.set(c.property_id, c);
    }
  });

  const items = await Promise.all(
    Array.from(parBien.entries()).map(async ([propertyId, derniereCandidature]) => {
      try {
        const property = await fetchProperty(propertyId);
        const nbCandidatures = candidatures.filter((c) => c.property_id === propertyId).length;
        return { property: getEffectiveProperty(property), nbCandidatures, derniereCandidature };
      } catch (e) {
        return null;
      }
    })
  );

  candidaturesParBien = items
    .filter((item) => item !== null)
    .sort((a, b) => b.derniereCandidature.id - a.derniereCandidature.id);
}

function initOnglets() {
  document.querySelectorAll(".candidatures-tabs .tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".candidatures-tabs .tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      ongletActif = tab.textContent.trim();
      afficherCandidatures();
    });
  });
}

function afficherCandidatures() {
  const grille = document.querySelector(".candidatures-grid");
  if (!grille) return;

  const filtrees = candidaturesParBien.filter(({ property }) => property.category === ongletActif);

  if (filtrees.length === 0) {
    grille.innerHTML = `<p>Aucune candidature ${
      ongletActif === "Résidentiel" ? "résidentielle" : "professionnelle"
    } pour le moment.</p>`;
    return;
  }

  grille.innerHTML = filtrees
    .slice(0, 6)
    .map(
      ({ property, nbCandidatures }) => `
    <a class="cand-card" href="infos-candidature.html?id=${property.id}">
      <div class="cand-photo">
        <img src="${getImageForProperty(property)}" alt="${property.title}" />
      </div>
      <p class="cand-ref">${property.title} — Réf. #${property.id}</p>
      <p class="cand-status">${nbCandidatures} candidature${nbCandidatures > 1 ? "s" : ""} — ${statusLabel(property.status)}</p>
    </a>
  `
    )
    .join("");
}

/* ----------------------------- Ajout d'un bien ---------------------------- */

function initFormulaireBien(session) {
  const form = document.querySelector(".form-bien");
  if (!form) return;

  const message = document.getElementById("ajouter-bien-message");
  const btnEstimer = document.getElementById("btn-estimer-prix");

  if (btnEstimer) {
    btnEstimer.addEventListener("click", async () => {
      const surface = Number(document.getElementById("bien-surface").value);
      const pieces = Number(document.getElementById("bien-pieces").value);

      if (!surface || !pieces) {
        afficherMessageBien(message, "Renseignez la surface et le nombre de pièces avant d'estimer.", true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/analytics/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ area: surface, rooms: pieces }),
        });
        if (!response.ok) throw new Error("Erreur d'estimation");

        const data = await response.json();
        const prixEstime = Math.round(data.estimated_price);
        document.getElementById("bien-prix").value = prixEstime;
        afficherMessageBien(message, `Prix estimé par l'IA : ${formatPrice(prixEstime)}.`, false);
      } catch (e) {
        afficherMessageBien(message, "Impossible d'estimer le prix pour le moment.", true);
      }
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = {
      title: document.getElementById("bien-titre").value.trim(),
      description: document.getElementById("bien-description").value.trim(),
      category: document.getElementById("bien-categorie").value,
      type: document.getElementById("bien-type").value.trim(),
      price: Number(document.getElementById("bien-prix").value),
      area: Number(document.getElementById("bien-surface").value),
      rooms: Number(document.getElementById("bien-pieces").value),
      city: document.getElementById("bien-ville").value.trim(),
      postcode: document.getElementById("bien-cp").value.trim(),
      user_id: session.id,
    };

    if (
      !payload.title ||
      !payload.description ||
      !payload.type ||
      !payload.city ||
      !payload.postcode ||
      !payload.price ||
      !payload.area ||
      !payload.rooms
    ) {
      afficherMessageBien(message, "Merci de remplir tous les champs avant de publier.", true);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/properties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Erreur lors de la création");

      const data = await response.json();
      afficherMessageBien(message, `Bien publié avec succès (référence #${data.property_id}).`, false);
      form.reset();
    } catch (e) {
      afficherMessageBien(message, "Impossible de publier ce bien pour le moment.", true);
    }
  });
}

function afficherMessageBien(element, texte, estErreur) {
  if (!element) return;
  element.textContent = texte;
  element.style.display = "block";
  element.classList.toggle("message-erreur", estErreur);
  element.classList.toggle("message-succes", !estErreur);
}
