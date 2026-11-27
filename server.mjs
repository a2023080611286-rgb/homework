import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    return res.end("Method Not Allowed");
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  } catch {
    res.writeHead(400);
    return res.end("Bad Request");
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = resolve(root, relativePath);
  if (!filePath.startsWith(root + sep)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  let stats;
  try {
    stats = statSync(filePath);
  } catch {
    res.writeHead(404);
    return res.end("Not Found");
  }

  if (!stats.isFile()) {
    res.writeHead(404);
    return res.end("Not Found");
  }

  res.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": stats.size,
    "Cache-Control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=86400",
  });

  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
});

const port = Number(process.env.PORT) || 10000;
server.listen(port, "0.0.0.0", () => {
  console.log(`Daliyi website listening on port ${port}`);
});
