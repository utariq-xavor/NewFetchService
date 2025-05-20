const Parser = require("rss-parser");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const parser = new Parser();

// ✅ Extract clean article body from a given URL
async function extractArticleBody(url) {
  try {
    const response = await fetch(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0", // Avoid bot detection
      },
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // 🧠 Try different patterns to locate readable content
    const body =
      $("article").text() ||
      $('div[itemprop="articleBody"]').text() ||
      $('div[class*="content"]').text() ||
      $('div[class*="main"]').text() ||
      $('div[class*="story"]').text();

    return body.trim().slice(0, 5000) || "No readable article body found.";
  } catch (error) {
    console.error(`Error extracting article from ${url}:`, error.message);
    return "Failed to extract article body.";
  }
}

module.exports = async (req, res) => {
  // ✅ Add CORS headers
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
