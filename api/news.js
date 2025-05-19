const Parser = require("rss-parser");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const parser = new Parser();

async function fetchFullContent(url) {
  try {
    const res = await fetch(url, {
      timeout: 5000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const content =
      $("article").text() ||
      $('div[class*="article"]').text() ||
      $('div[class*="content"]').text() ||
      $('div[itemprop="articleBody"]').text();

    return content.trim().slice(0, 1000) || "No readable content found";
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

module.exports = async (req, res) => {
  // ✅ Allow CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const query = req.query.q || "PPP Pakistan";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

  try {
    const feed = await parser.parseURL(url);

    const articles = await Promise.all(
      feed.items.slice(0, 3).map(async (item) => {
        const fullContent = await fetchFullContent(item.link);
        return {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          snippet: item.contentSnippet || item.content,
          source: item.creator || item.source || "Unknown",
          fullContent,
        };
      })
    );

    res.status(200).json({ query, total: articles.length, articles });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch", details: err.message });
  }
};
