const Parser = require("rss-parser");
const fetch = require("node-fetch");
const Mercury = require("@postlight/parser");

const parser = new Parser();

// ✅ Use Mercury to extract readable article content
async function extractArticleBody(url) {
  try {
    const result = await Mercury.parse(url);
    return result.content
      ? result.content.replace(/<[^>]+>/g, "").slice(0, 5000)
      : "No article content found.";
  } catch (err) {
    console.error("Mercury parsing error:", err.message);
    return "Failed to parse article with Mercury.";
  }
}

module.exports = async (req, res) => {
  // ✅ CORS headers
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
        const fullArticle = await extractArticleBody(item.link);
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          snippet: item.contentSnippet || item.content,
          source: item.creator || item.source || "Unknown",
          fullArticle,
        };
      })
    );

    res.status(200).json({ query, total: articles.length, articles });
  } catch (err) {
    console.error("News API error:", err.message);
    res.status(500).json({ error: "News fetch failed", message: err.message });
  }
};
