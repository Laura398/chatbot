// Widget simple Chatbot IA
(function () {
  // Palettes de couleurs
  const colorThemes = {
    blue: {
      primary: "#2d6cdf",
      background: "#fff",
      messagesBg: "#f6f7fb",
      userBg: "#2d6cdf",
      userText: "#fff",
      botBg: "#eee",
      botText: "#222",
      border: "#eee",
      shadow: "rgba(45,108,223,0.15)",
      shadowLight: "rgba(45,108,223,0.10)",
    },
    red: {
      primary: "#dc2626",
      background: "#fff",
      messagesBg: "#fef2f2",
      userBg: "#dc2626",
      userText: "#fff",
      botBg: "#fee2e2",
      botText: "#222",
      border: "#fecaca",
      shadow: "rgba(220,38,38,0.15)",
      shadowLight: "rgba(220,38,38,0.10)",
    },
    green: {
      primary: "#22c55e",
      background: "#fff",
      messagesBg: "#f0fdf4",
      userBg: "#22c55e",
      userText: "#fff",
      botBg: "#bbf7d0",
      botText: "#222",
      border: "#86efac",
      shadow: "rgba(34,197,94,0.15)",
      shadowLight: "rgba(34,197,94,0.10)",
    },
    dark: {
      primary: "#d4af37", // Or doré
      background: "#1a1a1a", // Fond très sombre
      messagesBg: "#2d2d2d", // Fond des messages gris sombre
      userBg: "#d4af37", // Bulle utilisateur dorée
      userText: "#1a1a1a", // Texte utilisateur sombre sur doré
      botBg: "#3a3a3a", // Bulle bot gris foncé
      botText: "#f5f5f5", // Texte bot clair
      border: "#4a4a4a", // Bordure gris moyen
      shadow: "rgba(212,175,55,0.20)", // Ombre dorée
      shadowLight: "rgba(212,175,55,0.15)", // Ombre dorée légère
    },
  }; // Fin palettes couleurs

  // Récupération du thème depuis le script
  const currentScript = document.currentScript;
  const requestedTheme = currentScript?.getAttribute("theme") || "blue";
  const colors = colorThemes[requestedTheme] || colorThemes.blue;

  // Générer un sessionId unique pour cette session
  const sessionId =
    "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

  // Création du bouton d'ouverture du chat
  const chatBtn = document.createElement("button");
  chatBtn.innerText = "💬 ChatBot";
  chatBtn.id = "chatbot-open-btn";
  chatBtn.style.position = "fixed";
  chatBtn.style.bottom = "32px";
  chatBtn.style.right = "32px";
  chatBtn.style.zIndex = "9999";
  chatBtn.style.background = colors.primary;
  chatBtn.style.color = colors.userText;
  chatBtn.style.border = "none";
  chatBtn.style.borderRadius = "50px";
  chatBtn.style.padding = "0.8rem 1.4rem";
  chatBtn.style.fontWeight = "700";
  chatBtn.style.boxShadow = `0 2px 8px ${colors.shadowLight}`;
  chatBtn.style.cursor = "pointer";
  document.body.appendChild(chatBtn);

  // Création de la fenêtre de chat
  const chatWindow = document.createElement("div");
  chatWindow.id = "chatbot-window";
  chatWindow.style.position = "fixed";
  chatWindow.style.bottom = "90px";
  chatWindow.style.right = "32px";
  chatWindow.style.width = "320px";
  chatWindow.style.height = "420px";
  chatWindow.style.background = colors.background;
  chatWindow.style.borderRadius = "12px";
  chatWindow.style.boxShadow = `0 4px 24px ${colors.shadow}`;
  chatWindow.style.display = "none";
  chatWindow.style.flexDirection = "column";
  chatWindow.style.overflow = "hidden";
  chatWindow.style.zIndex = "10000";
  document.body.appendChild(chatWindow);

  // Chat header
  const header = document.createElement("div");
  header.style.background = colors.primary;
  header.style.color = colors.userText;
  header.style.padding = "1rem";
  header.style.fontWeight = "700";
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.innerHTML =
    '<span>AI ChatBot</span><span style="cursor:pointer;font-weight:900;" id="chatbot-close">×</span>';
  chatWindow.appendChild(header);

  // Chat messages
  const messages = document.createElement("div");
  messages.id = "chatbot-messages";
  messages.style.flex = "1";
  messages.style.padding = "1rem";
  messages.style.overflowY = "auto";
  messages.style.background = colors.messagesBg;
  chatWindow.appendChild(messages);

  // Chat input
  const inputArea = document.createElement("div");
  inputArea.style.display = "flex";
  inputArea.style.padding = "0.8rem";
  inputArea.style.background = colors.background;
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Votre message...";
  input.style.flex = "1";
  input.style.border = `1px solid ${colors.border}`;
  input.style.borderRadius = "6px";
  input.style.padding = "0.5rem";
  inputArea.appendChild(input);
  const sendBtn = document.createElement("button");
  sendBtn.innerText = "Envoyer";
  sendBtn.style.marginLeft = "0.5rem";
  sendBtn.style.background = colors.primary;
  sendBtn.style.color = colors.userText;
  sendBtn.style.border = "none";
  sendBtn.style.borderRadius = "6px";
  sendBtn.style.padding = "0.5rem 1rem";
  sendBtn.style.fontWeight = "700";
  sendBtn.style.cursor = "pointer";
  inputArea.appendChild(sendBtn);
  chatWindow.appendChild(inputArea);

  // Logique d'ouverture/fermeture du chat
  chatBtn.onclick = () => (chatWindow.style.display = "flex");
  header.querySelectorAll("#chatbot-close")[0].onclick = () =>
    (chatWindow.style.display = "none");

  // Interpréteur markdown simple
  function parseMarkdown(md) {
    let html = md;
    // Titres
    html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
    // Gras
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Italique
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Souligné
    html = html.replace(/__(.*?)__/g, "<u>$1</u>");
    // Barré
    html = html.replace(/~~(.*?)~~/g, "<s>$1</s>");
    // Liens
    html = html.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank">$1</a>'
    );
    // Listes à puces
    html = html.replace(/(^|\n)- (.*)/g, "$1<li>$2</li>");
    // Regroupe les <li> consécutifs en <ul>
    html = html.replace(
      /(<li>.*?<\/li>(?:<br>?<li>.*?<\/li>)*)/g,
      function (m) {
        return "<ul>" + m.replace(/<br>/g, "") + "</ul>";
      }
    );
    // Listes numérotées (rendu en <ul> comme les puces)
    html = html.replace(/(^|\n)(\d+)\. (.*)/g, "$1<li>$3</li>");
    // Regroupe toutes les <li> consécutifs en <ul>
    html = html.replace(
      /(<li>.*?<\/li>(?:<br>?<li>.*?<\/li>)*)/g,
      function (m) {
        return "<ul>" + m.replace(/<br>/g, "") + "</ul>";
      }
    );
    // Sauts de ligne
    html = html.replace(/\n/g, "<br>");
    return html;
  }

  // Envoi du message
  async function sendMessage(message) {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";
    await botReply(text);
  }

  // Ajout d'un message dans la fenêtre de chat
  function addMessage(text, from) {
    const msg = document.createElement("div");
    msg.style.marginBottom = "0.7rem";
    msg.style.textAlign = from === "user" ? "right" : "left";
    let content = from === "bot" ? parseMarkdown(text) : text;
    const bgColor = from === "user" ? colors.userBg : colors.botBg;
    const textColor = from === "user" ? colors.userText : colors.botText;
    msg.innerHTML = `<span style="background:${bgColor};color:${textColor};padding:0.5rem 1rem;border-radius:16px;display:inline-block;max-width:80%;">${content}</span>`;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  // Réponse du bot (simulation)
  async function botReply(userText) {
    addMessage("...", "bot");
    try {
      const res = await fetch("http://localhost:3001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, sessionId }),
      });
      const data = await res.json();
      console.log("*** : ", data);

      // tools
      if (
        data.reply === '{"tool":"doc"}' ||
        data.reply === "{'tool':'doc'}" ||
        data.reply === "{'tool':'shipping'}" ||
        data.reply === '{"tool":"shipping"}'
      ) {
        let type = "doc";
        switch (data.reply) {
          case "{'tool':'doc'}":
          case '{"tool":"doc"}':
            type = "doc";
            break;
          case "{'tool':'shipping'}":
          case '{"tool":"shipping"}':
            type = "shipping";
            break;
          default:
            type = "doc";
        }
        // cache
        let docName = "shop";
        if (type === "shipping") docName = docName + "Shipping";
        if (type === "doc") docName = docName + "Doc";

        let doc = localStorage.getItem(docName);
        if (!doc) {
          const docRes = await fetch(`http://localhost:3001/fetchDoc/${type}`);
          doc = await docRes.text();
          localStorage.setItem(docName, doc);
        }
        // interrogate again with doc in context
        const res2 = await fetch("http://localhost:3001/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            documentation: doc,
            sessionId,
          }),
        });
        const data2 = await res2.json();
        messages.lastChild.remove();
        addMessage(data2.reply || "Réponse indisponible.", "bot");
        if (data2.extra) addMessage(data2.extra, "bot");
      } else {
        messages.lastChild.remove();
        addMessage(data.reply || "Réponse indisponible.", "bot");
        if (data.extra) addMessage(data.extra, "bot");
      }
    } catch {
      messages.lastChild.remove();
      addMessage("Erreur serveur.", "bot");
    }
  }

  // Gérer l'envoie des messages
  sendBtn.onclick = sendMessage;
  input.addEventListener("keydown", (e) => {
    if (e.key == "Enter") sendMessage();
  });
})();
