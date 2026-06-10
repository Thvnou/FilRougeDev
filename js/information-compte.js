/* ========================================================================
   information-compte.js
   Page de profil utilisateur :
   - Affiche les informations du compte connecté
   - "Modifier" : édition du nom / prénom / email (sauvegardée en
     localStorage, voir storage.js -> saveProfileOverride). Le backend ne
     proposant pas encore de route PUT /api/users/{id}, ces modifications
     ne sont pas (encore) répercutées en base de données.
   - "Supprimer" : déconnecte et efface les informations locales du
     compte. Le backend ne proposant pas de route DELETE /api/users/{id},
     le compte n'est pas supprimé en base.
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const session = requireAuth();
  if (!session) return;

  afficherProfil();
  initBoutonModifier();
  initBoutonSupprimer();
});

function afficherProfil() {
  const profile = getProfile();
  document.getElementById("profil-nom").textContent = profile.lastname;
  document.getElementById("profil-prenom").textContent = profile.firstname;
  document.getElementById("profil-email").textContent = profile.email;
}

function initBoutonModifier() {
  const btn = document.querySelector(".btn-modifier");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const profile = getProfile();

    const nouveauNom = prompt("Nom :", profile.lastname);
    if (nouveauNom === null) return;

    const nouveauPrenom = prompt("Prénom :", profile.firstname);
    if (nouveauPrenom === null) return;

    const nouvelEmail = prompt("Email :", profile.email);
    if (nouvelEmail === null) return;

    if (!nouveauNom.trim() || !nouveauPrenom.trim() || !nouvelEmail.trim()) {
      alert("Aucun champ ne peut être vide.");
      return;
    }

    saveProfileOverride({
      lastname: nouveauNom.trim(),
      firstname: nouveauPrenom.trim(),
      email: nouvelEmail.trim(),
    });

    afficherProfil();
    initHeaderUserInfo();
    alert("Vos informations ont été mises à jour.");
  });
}

function initBoutonSupprimer() {
  const btn = document.querySelector(".btn-supprimer");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const confirmation = confirm(
      "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action vous déconnectera."
    );
    if (!confirmation) return;

    deleteAccount();
    alert("Votre compte a été supprimé.");
    window.location.href = "accueil.html";
  });
}
