const Parser = require("rss-parser");
const fetch = require("node-fetch");
const Mercury = require("@postlight/parser");

const parser = new Parser();

// 🔧 Helper: extract real article link from Google News redirect
function getActualLink(googleLink) {
  const match = googleLink.match(/url=([^&]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return googleLink;
}

// 📄 Extract readable article body using Mercury Parser
async function extractArticleBody(url) {
  try {
    const result = await Mercury.parse(url);
    return result.content
      ? result.content.replace(/<[^>]+>/g, "").slice(0, 5000)
      : "No article content found.";
  } catch (err) {
    console.error("Mercury error for URL:", url, "|", err.message);
    return "Failed to extract article body.";
  }
}

module.exports = async (req, res) => {
  // ✅ Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = req.query.q || "PPP Pakistan";
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

  try {
    const feed = await parser.parseURL(rssUrl);

    const articles = await Promise.all(
      feed.items.slice(0, 5).map(async (item) => {
        const realUrl = getActualLink(item.link);
        const fullArticle = await extractArticleBody(realUrl);

        return {
          title: item.title,
          link: realUrl,
          pubDate: item.pubDate,
          snippet: item.contentSnippet || item.content,
          source: item.creator || item.source || "Unknown",
          fullArticle
        };
      })
    );

    res.status(200).json({
      query,
      total: articles.length,
      articles
    });
  } catch (err) {
    console.error("News API error:", err.message);
    res.status(500).json({
      error: "News fetch failed",
      message: err.message
    });
  }
};
