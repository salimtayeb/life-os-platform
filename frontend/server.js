const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_TARGET = process.env.API_TARGET || "http://backend:5000";
const STATIC_DIR = path.join(__dirname, "out");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStatic(req, res) {
  let filePath = path.join(STATIC_DIR, req.url === "/" ? "index.html" : req.url);

  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(STATIC_DIR, "404.html");
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end("Not Found");
    }
  }

  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end("Server Error");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function proxyApi(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const targetUrl = `${API_TARGET}${url.pathname}${url.search}`;

  const options = new URL(targetUrl);
  const proxyReq = http.request(
    {
      hostname: options.hostname,
      port: options.port,
      path: options.pathname + options.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: options.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", () => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, message: "Backend unavailable" }));
  });

  if (req.body || req.method !== "GET") {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    proxyApi(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}, API target: ${API_TARGET}`);
});
