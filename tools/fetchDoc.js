const puppeteer = require("puppeteer");

const fetchDoc = async (docType) => {
  const urls = {
    shipping:
      "https://skinny-cut-94d.notion.site/ShopEx-Frais-de-livraison-2a95f375e2e4809b92cae57f538ff88d",
    doc: "https://skinny-cut-94d.notion.site/ShopEx-Documentation-2a95f375e2e480129ad9c39ee4993a7f",
    default:
      "https://skinny-cut-94d.notion.site/ShopEx-Documentation-2a95f375e2e480129ad9c39ee4993a7f",
  };

  const url = urls[docType] || urls["default"];

  console.log("💬 Loading page : ", url);

  const browser = await puppeteer.launch({
    headless: true, // passe à false pour voir le navigateur
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  //   page.on("console", (msg) =>
  //     console.log("BROWSER LOG:", msg.text())
  //   ); // <— affiche les console.log du navigateur

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // petite pause pour laisser Notion rendre le contenu
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const text = await page.evaluate(() => {
      const el = document.querySelector(".notion-page-content");
      if (!el) {
        console.log("No .notion-page-content found");
        return null;
      }
      return el.innerText;
    });

    console.log("✅ Page loaded");
    return text;
  } catch (err) {
    console.error("❌ Error in fetchDoc:", err);
  } finally {
    await browser.close();
  }
};

module.exports = fetchDoc;
