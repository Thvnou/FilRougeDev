/* ========================================================================
   connexion.js
   Logique de la page connexion.html : authentification via POST /api/login
   et redirection vers le bon espace selon le rôle de l'utilisateur.
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Si l'utilisateur est déjà connecté, inutile de repasser par cette page
  const session = getSession();
  if (session) {
    window.location.href = getHomePageForRole(session.role);
    return;
  }

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const btnConnexion = document.querySelector(".bouton-connexion");
  const errorBox = document.getElementById("connexion-error");

  function showError(message) {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.style.display = "block";
    } else {
      alert(message);
    }
  }

  async function tenterConnexion() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (errorBox) errorBox.style.display = "none";

    if (!email || !password) {
      showError("Merci de renseigner votre email et votre mot de passe.");
      return;
    }

    btnConnexion.disabled = true;
    btnConnexion.textContent = "Connexion...";

    try {
      const user = await login(email, password);
      window.location.href = getHomePageForRole(user.role);
    } catch (err) {
      showError(err.message || "Email ou mot de passe incorrect.");
      btnConnexion.disabled = false;
      btnConnexion.textContent = "Connexion";
    }
  }

  btnConnexion.addEventListener("click", tenterConnexion);

  // Permet de valider le formulaire avec la touche "Entrée"
  [emailInput, passwordInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") tenterConnexion();
    });
  });
});
