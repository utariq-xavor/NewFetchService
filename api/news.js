const Parser = require("rss-parser");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const parser = new Parser();

async function fetchFullContent(url) {
  try {
    const res = await fetch(url, {
      timeout: 5000,
      headers: {
        "Accept-Encoding": "identity",
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
    return `Error fetching full content: ${err.message}`;
  }
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // ✅ Allow frontend access
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const query = req.query.q || "PPP Pakistan";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

  try {
    const feed = await parser.parseURL(url);

    const articles = await Promise.all(
      feed.items.slice(0, 2).map(async (item) => {
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
    console.error("News API error:", err.message);
    res.status(500).json({
      error: "Failed to fetch news",
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};
