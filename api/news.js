const Parser = require("rss-parser");
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const query = req.query.q || "PPP Pakistan";
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

    const feed = await parser.parseURL(url);

    // Return all fields as-is for each item
    const articles = feed.items.map(item => ({
      ...item  // spread all properties (title, link, pubDate, content, contentSnippet, guid, isoDate, etc.)
    }));

    res.status(200).json({
      query,
      source: feed.title || "Google News RSS",
      total: articles.length,
      articles
    });
  } catch (err) {
    console.error("News API error:", err.message);
    res.status(500).json({ error: "Failed to fetch news", message: err.message });
  }
};
