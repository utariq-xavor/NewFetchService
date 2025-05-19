const Parser = require("rss-parser");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

const parser = new Parser();

// Helper: scrape article content from given URL
async function fetchFullContent(url) {
  try {
    const res = await fetch(url, { timeout: 8000 });
    const html = await res.text();
    const $ = cheerio.load(html);

    // Try scraping typical article containers (fallback logic)
    const content =
      $("article").text() ||
      $('div[class*="article"]').text() ||
      $('div[class*="content"]').text() ||
      $('div[itemprop="articleBody"]').text();

    return content.trim().slice(0, 1000) || "No readable content found";
  } catch (err) {
    return "Failed to load article content";
  }
}

module.exports = async (req, res) => {
  const query = req.query.q || "PPP Pakistan";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

  try {
    const feed = await parser.parseURL(url);

    // Process first 5 items only to keep it fast
    const articles = await Promise.all(
      feed.items.slice(0, 5).map(async (item) => {
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
    console.error("News API Error:", err.message);
    res.status(500).json({ error: "News fetch failed", message: err.message });
  }
};
