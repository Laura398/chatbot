const cors = require("cors");
const express = require("express");
require("dotenv").config();
const axios = require("axios");
const app = express();
const fetchDoc = require("./tools/fetchDoc");
const userDB = require("./tools/usersDB");

app.use(express.json());
app.use(cors());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const URL = process.env.GROQ_URL;
const MODEL = process.env.GROQ_MODEL;
// const URL = process.env.LM_API_URL;
// const MODEL = process.env.LM_MODEL;

// endpoint to get online documentation dynamically
app.get(["/fetchDoc", "/fetchDoc/:docType"], async (req, res) => {
  const docType = req.params.docType || "default";

  try {
    const text = await fetchDoc(docType);
    if (!text) {
      return res.status(404).send("Aucun contenu trouvé");
    }
    res.send(text);
  } catch (err) {
    console.error("Erreur dans /fetchDoc :", err);
    res.status(500).send("Erreur serveur");
  }
});

// Route /chat pour générer les réponses du bot IA
app.post("/chat", async (req, res) => {
  const userMsg = req.body.message;
  const sessionId = req.body.sessionId || "default"; // Identifiant de session

  if (!userMsg) return res.status(400).json({ error: "Message manquant." });

  try {
    let messages;

    if (req.body.documentation) {
      messages = [
        {
          role: "system",
          content:
            "Tu es un assistant utile pour les clients d'un site e-commerce. Utilise la documentation fournie pour répondre précisément à la question de l'utilisateur. Ne propose pas d'utiliser un outil, réponds directement. N'inventes pas d'informations qui ne sont pas dans la documentation. N'inventes pas d'informations. Si tu ne sais pas, dis-le clairement.\n\n" +
            "Réponds en français.",
        },
        {
          role: "system",
          content: "Documentation: \n" + req.body.documentation,
        },
        { role: "user", content: userMsg },
      ];
    } else {
      messages = [
        {
          role: "system",
          content:
            "Tu es un assistant utile pour les clients d'un site e-commerce qui s'appelle ShopEx et qui vend des produits high tech.\n\n" +
            "- Si l'utilisateur pose une question relative à la navigation sur le site (comment voir telle ou telle page), tu dois répondre exactement : {'tool':'doc'} et rien d'autre.\n\n" +
            "- Si l'utilisateur pose une question relative à la création, la connexion ou la gestion de compte (suppression, modification...), tu dois répondre exactement : {'tool':'doc'} et rien d'autre.\n\n" +
            "- Si l'utilisateur pose une question relative à l'achat ou le suivi d'une commande (savoir comment passer commande, ou savoir où elle en est, ou savoir où elle est), tu dois répondre exactement : {'tool':'doc'} et rien d'autre.\n\n" +
            "- Si l'utilisateur pose une question relative au paiement tu dois répondre exactement, tu dois répondre exactement : {'tool':'doc'} et rien d'autre.\n\n" +
            "- Si l'utilisateur pose une question relative au lieu (où on livre, y compris des noms de villes ou), ou à la méthode (comment on livre), ou au suivi d'une livraison, tu dois répondre exactement : {'tool':'doc'} et rien d'autre.\n\n" +
            "- Si la question concerne les frais de livraison, tu dois répondre exactement, tu dois répondre exactement : {'tool':'shipping'} et rien d'autre.\n\n" +
            "- Si l'utilisateur demande à changer son adresse, tu dois répondre exactement : {'tool':'update_address', 'userId':1, 'value': 'NOUVELLE_ADRESSE'} en adaptant la valeur.\n\n" +
            "N'inventes pas d'informations. Si tu ne sais pas, dis-le clairement.\n\n" +
            "Réponds en français.",
        },
        { role: "user", content: userMsg },
      ];
    }
    const response = await axios.post(
      URL,
      {
        model: MODEL,
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    let botMsg = response.data.choices[0].message.content;

    // tools handling
    // change address
    if (botMsg.startsWith("{'tool':'update_address'") || botMsg.startsWith('{"tool":"update_address"')) { 
      try {
        const toolObj = JSON.parse(botMsg.replace(/'/g, '"'));
        
        if (toolObj.tool === 'update_address' && toolObj.userId && toolObj.value) { 
          const ok = userDB.updateAddress(toolObj.userId, toolObj.value);
          botMsg = ok ? "L'adresse a été mise à jour avec succès. Puis-je faire autre chose pour vous aider ?" : "Désolé, je ne peux pas mettre à jour l'adresse pour le moment.";
        }
      } catch {
        botMsg = "Désolé, une erreur est survenue lors de la mise à jour de l'adresse.";
      }
    }

    res.json({ reply: botMsg });
  } catch (err) {
    console.error("Erreur détaillée:", err.response?.data || err.message);
    res.status(500).json({
      error: "Erreur serveur ou API.",
      details: err.response?.data?.error?.message || err.message,
    });
  }
});

app.listen(3001, () => {
  console.log("Serveur chatbot démarré sur http://localhost:3001");
});
