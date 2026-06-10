/* ========================================================================
   creation-compte.js
   Logique de la page creation-compte.html : inscription via
   POST /api/users (rôle "client" attribué automatiquement par le
   backend), puis connexion automatique de l'utilisateur.
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Si l'utilisateur est déjà connecté, inutile de recréer un compte
  const session = getSession();
  if (session) {
    window.location.href = getHomePageForRole(session.role);
    return;
  }

  const lastnameInput = document.getElementById("lastname");
  const firstnameInput = document.getElementById("firstname");
  const phoneInput = document.getElementById("phone");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirm-password");
  const btnValider = document.querySelector(".bouton-valider");
  const errorBox = document.getElementById("creation-error");

  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    } else {
      alert(message);
    }
  }

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function creerCompte() {
    const lastname = lastnameInput.value.trim();
    const firstname = firstnameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (errorBox) errorBox.style.display = "none";

    if (!lastname || !firstname || !email || !password || !confirm) {
      showError("Merci de remplir tous les champs obligatoires.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      showError("Merci de saisir une adresse email valide.");
      return;
    }

    if (password.length < 6) {
      showError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirm) {
      showError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    btnValider.disabled = true;
    btnValider.textContent = "Création en cours...";

    try {
      // Le numéro de téléphone (phoneInput) n'est pas encore stocké côté
      // backend (absent du modèle UserCreateInput / table users) : il est
      // simplement ignoré pour le moment.
      const user = await signup({ firstname, lastname, email, password });
      window.location.href = getHomePageForRole(user.role);
    } catch (err) {
      showError(err.message || "Impossible de créer le compte.");
      btnValider.disabled = false;
      btnValider.textContent = "Valider";
    }
  }

  btnValider.addEventListener("click", creerCompte);
});
