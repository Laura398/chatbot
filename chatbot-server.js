const cors = require("cors");
const express = require("express");
require("dotenv").config();
const axios = require("axios");
const app = express();
const fetchDoc = require("./tools/fetchDoc");
const userDB = require("./tools/usersDB");
const ordersDB = require("./tools/ordersDB");

app.use(express.json());
app.use(cors());

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const URL = process.env.GROQ_URL;
const MODEL = process.env.GROQ_MODEL;
// const URL = process.env.LM_API_URL;
// const MODEL = process.env.LM_MODEL;
const loggedUserId = 1;

// hadling of incomplete demands
const pendingRequests = new Map();

// automatic cleanup of old pending requests
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, request] of pendingRequests.entries()) {
    if (now - request.timestamp > 300000) {
      // 5 minutes
      pendingRequests.delete(sessionId);
    }
  }
}, 60000); // check every minute

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
    // check for pending incomplete requests
    if (pendingRequests.has(sessionId)) {
      const pending = pendingRequests.get(sessionId);
      if (pending.type === "invoice") {
        // user gives order number
        const orderMatch = userMsg.match(/\d+/);
        if (orderMatch) {
          const orderId = parseInt(orderMatch[0]);
          pendingRequests.delete(sessionId); // clear pending request

          // generate invoice
          try {
            const invoicesDir = require("path").join(__dirname, "invoices");
            if (!require("fs").existsSync(invoicesDir))
              require("fs").mkdirSync(invoicesDir);
            const pdfPath = require("path").join(
              invoicesDir,
              `facture_${orderId}.pdf`
            );
            ordersDB.generateInvoicePDF(orderId, pdfPath);
            const url = `/invoices/facture_${orderId}.pdf`;
            return res.json({
              reply: `La facture est prête : <a href="${url}" target="_blank">Télécharger la facture</a>.`,
            });
          } catch (err) {
            return res.json({
              error:
                "Erreur lors de la génération de la facture. Vérifiez que le numéro de commande est correct.",
            });
          }
        }
      }
    }

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
            "- Si l'utilisateur te demande la facture d'une commande avec un numéro précis (ex: 'Envoie-moi la facture de la commande 101'), tu dois répondre exactement : {'tool':'invoice', 'userId':1, 'id':NUMERO_COMMANDE} en adaptant le numéro de commande.\n\n" +
            "- Si l'utilisateur demande une facture sans préciser le numéro (ex: 'je veux ma facture', 'envoie-moi ma facture', 'facture de ma dernière commande'), tu dois répondre exactement : {'tool':'askOrderId'} et rien d'autre.\n\n" +
            "- Si l'utilisateur rencontre un bug, problème technique ou tout dysfonctionnement ou erreur sur le site, tu dois répondre exactement : {'tool':'bug', 'message':'MESSAGE_UTILISATEUR'} en remplaçant MESSAGE_UTILISATEUR par le message complet de l'utilisateur.\n\n" +
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
    if (
      botMsg.startsWith("{'tool':'update_address'") ||
      botMsg.startsWith('{"tool":"update_address"')
    ) {
      try {
        const toolObj = JSON.parse(botMsg.replace(/'/g, '"'));

        if (
          toolObj.tool === "update_address" &&
          toolObj.userId &&
          toolObj.value
        ) {
          if (toolObj.userId !== loggedUserId) {
            botMsg =
              "Désolé, vous n'êtes pas autorisé à modifier cette adresse.";
          } else {
            const ok = userDB.updateAddress(toolObj.userId, toolObj.value);
            botMsg = ok
              ? "L'adresse a été mise à jour avec succès. Puis-je faire autre chose pour vous aider ?"
              : "Désolé, je ne peux pas mettre à jour l'adresse pour le moment.";
          }
        }
      } catch {
        botMsg =
          "Désolé, une erreur est survenue lors de la mise à jour de l'adresse.";
      }
    } else if (
      botMsg.startsWith("{'tool':'invoice'") ||
      botMsg.startsWith('{"tool":"invoice"')
    ) {
      try {
        const toolObj = JSON.parse(botMsg.replace(/'/g, '"'));

        if (toolObj.userId !== loggedUserId) {
          botMsg =
            "Désolé, vous n'êtes pas autorisé à accéder à cette facture.";
        } else if (toolObj.tool === "invoice" && toolObj.id) {
          const invoicesDir = require("path").join(__dirname, "invoices");
          if (!require("fs").existsSync(invoicesDir))
            require("fs").mkdirSync(invoicesDir);
          const pdfPath = require("path").join(
            invoicesDir,
            `facture_${toolObj.id}.pdf`
          );
          ordersDB.generateInvoicePDF(toolObj.id, pdfPath);
          const url = `/invoices/facture_${toolObj.id}.pdf`;
          botMsg = `La facture est prête : <a href="${url}" target="_blank">Télécharger la facture</a>.`;
        }
      } catch {
        botMsg =
          "Désolé, une erreur est survenue lors de la génération de la facture.";
      }
    } else if (
      botMsg.startsWith("{'tool':'askOrderId'}") ||
      botMsg.startsWith('{"tool":"askOrderId"}')
    ) {
      // ask user for order ID
      pendingRequests.set(sessionId, {
        type: "invoice",
        timestamp: Date.now(),
      });
      botMsg =
        "Pourriez-vous me fournir le numéro de votre commande afin que je puisse générer la facture correspondante ?";
    } else if (
      botMsg.startsWith("{'tool':'bug'") ||
      botMsg.startsWith('{"tool":"bug"}')
    ) {
      let toolObj;
      try {
        toolObj = JSON.parse(botMsg.replace(/'/g, '"'));
      } catch {
        // extraction of message if JSON parsing fails
        const match =
          botMsg.match(/"message"\s*:\s*"([^"]+)"/) ||
          botMsg.match(/'message'\s*:\s*'([^']+)'/);
        toolObj = { tool: "bug", message: match ? match[1] : userMsg };
      }

      if (toolObj.tool === "bug" && toolObj.message) {
        // here we would log the bug report to discord
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        // clean message
        const cleanedMessage = toolObj.message
          .replace(/```/g, "")
          .replace(/`/g, "")
          .substring(0, 1900);
        const payload = {
          content: `🐛 **Nouveau rapport de bug utilisateur**\n\`\`\`\n${cleanedMessage}\n\`\`\` 🦋`,
          headers: {
            "Content-Type": "application/json",
          },
        };

        console.error(`🐛 Rapport de bug utilisateur : ${toolObj.message} 🦋`);
        try {
          await axios.post(webhookUrl, payload);
          botMsg =
            "Merci de nous avoir signalé ce problème. Notre équipe technique va l'examiner rapidement.";
        } catch (e) {
          console.error("Erreur lors de l'envoi du rapport de bug à discord :", e);
          botMsg =
            "Désolé, une erreur est survenue lors de la prise en compte de votre rapport de bug.";
        }
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
