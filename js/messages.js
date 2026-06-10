/* ========================================================================
   messages.js
   Liste des conversations de l'utilisateur connecté. Les conversations
   sont stockées en localStorage (voir storage.js -> getConversations,
   pré-remplies avec deux échanges de démonstration au premier chargement).
   À terme : GET /api/messages?user_id=...
   ======================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const session = requireAuth();
  if (!session) return;

  afficherConversations();
});

function afficherConversations() {
  const liste = document.querySelector(".conversations-liste");
  if (!liste) return;

  const conversations = getConversations();

  if (conversations.length === 0) {
    liste.innerHTML = "<p>Vous n'avez pas encore de conversation.</p>";
    return;
  }

  liste.innerHTML = conversations.map(renderConversationItem).join("");
}

function renderConversationItem(conversation) {
  const dernierMessage = conversation.messages[conversation.messages.length - 1];
  const apercu = dernierMessage ? dernierMessage.text : "";
  const date = dernierMessage ? `${dernierMessage.date}, ${dernierMessage.heure}` : "";
  const nonLue = conversation.unread > 0;

  return `
    <li class="conversation-item${nonLue ? " non-lue" : ""}">
      <a href="conversation.html?id=${conversation.id}" class="conversation-lien">
        <div class="conv-avatar">${conversation.contact_avatar}</div>
        <div class="conv-corps">
          <div class="conv-top">
            <span class="conv-nom">${conversation.contact_nom} — ${conversation.contact_detail}</span>
            <span class="conv-date">${date}</span>
          </div>
          <div class="conv-bas">
            <span class="conv-apercu">${apercu}</span>
            ${nonLue ? `<span class="conv-badge">${conversation.unread}</span>` : ""}
          </div>
        </div>
      </a>
    </li>
  `;
}
