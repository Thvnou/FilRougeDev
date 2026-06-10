/* ========================================================================
   conversation.js
   Fil de discussion d'une conversation (paramètre `?id=` dans l'URL).
   Les conversations et leurs messages sont stockés en localStorage (voir
   storage.js -> getConversation, addMessageToConversation,
   markConversationRead). À terme : GET/POST /api/messages
   ======================================================================== */

let conversationActuelle = null;

document.addEventListener("DOMContentLoaded", () => {
  const session = requireAuth();
  if (!session) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "1";

  conversationActuelle = getConversation(id);
  if (!conversationActuelle) {
    window.location.href = "messages.html";
    return;
  }

  markConversationRead(conversationActuelle.id);

  afficherEntete();
  afficherMessages();
  initFormulaireEnvoi();
});

function afficherEntete() {
  document.querySelector(".contact-avatar").textContent = conversationActuelle.contact_avatar;
  document.querySelector(".contact-nom").textContent = conversationActuelle.contact_nom;
  document.querySelector(".contact-detail").textContent = conversationActuelle.contact_detail;
}

function afficherMessages() {
  const fil = document.querySelector(".messages-fil");
  if (!fil) return;

  let html = "";
  let dernierLabel = null;

  conversationActuelle.messages.forEach((message) => {
    if (message.date !== dernierLabel) {
      html += `<div class="separateur-date"><span>${message.date}</span></div>`;
      dernierLabel = message.date;
    }

    if (message.from === "me") {
      html += `
        <div class="message envoye">
          <div class="msg-bulle">
            <p>${message.text}</p>
            <span class="msg-heure">${message.heure}</span>
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="message recu">
          <div class="msg-avatar">${conversationActuelle.contact_avatar}</div>
          <div class="msg-bulle">
            <p>${message.text}</p>
            <span class="msg-heure">${message.heure}</span>
          </div>
        </div>
      `;
    }
  });

  fil.innerHTML = html;
  fil.scrollTop = fil.scrollHeight;
}

function initFormulaireEnvoi() {
  const form = document.querySelector(".saisie-form");
  const input = document.querySelector(".saisie-input");
  if (!form || !input) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const texte = input.value.trim();
    if (!texte) return;

    conversationActuelle = addMessageToConversation(conversationActuelle.id, texte);
    input.value = "";
    afficherMessages();
  });

  // Envoi avec "Entrée" (Maj+Entrée pour un retour à la ligne)
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
}
