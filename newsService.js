const express = require("express");
const Parser = require("rss-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;
const parser = new Parser();

app.use(cors());

app.get("/api/news", async (req, res) => {
  const query = req.query.q || "PPP Pakistan";
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-PK&gl=PK&ceid=PK:en`;

  try {
    const feed = await parser.parseURL(url);
    const articles = feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.creator || item.source,
    }));
    res.json({ query, articles });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news", details: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("News API is running. Use /api/news?q=your-topic");
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
