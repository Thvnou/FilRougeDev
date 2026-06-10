/* ========================================================================
   compte-client.js
   Page d'accueil de l'espace client : vérifie simplement que
   l'utilisateur est connecté en tant que client. Le header (nom, rôle,
   déconnexion) est géré par header.js.
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  requireAuth(["client"]);
});
