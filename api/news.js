const Parser = require("rss-parser");
const parser = new Parser();

module.exports = async (req, res) => {
  try {
    const query = req.query.q || "PPP Pakistan";
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

    const feed = await parser.parseURL(url);
    const articles = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.creator || item.source,
    }));

    res.status(200).json({ query, articles });
  } catch (err) {
    console.error("News API error:", err.message);
    res.status(500).json({ error: "Failed to fetch news", message: err.message });
  }
};
