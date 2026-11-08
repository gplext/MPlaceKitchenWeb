import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { mediaDir } from "../media";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  // Product photos are uploaded from the admin portal as base64 inside the JSON body (up to 5 MB each).
  app.use(express.json({ limit: "8mb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  // One line per API call in the server log, so the hosting panel shows what the site is doing.
  app.use("/api", (req, res, next) => {
    const started = Date.now();
    res.on("finish", () => console.log(`${req.method} ${req.originalUrl.split("?")[0]} ${res.statusCode} ${Date.now() - started}ms`));
    next();
  });
  // Uploaded photos. Names are random and never reused, so browsers may keep them for a long time.
  app.use("/media", express.static(mediaDir(), { index: false, maxAge: "365d", immutable: true, fallthrough: false }));
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send("User-agent: *\nDisallow: /admin\nDisallow: /account\nDisallow: /bag\nDisallow: /order/\nDisallow: /sign-in\nDisallow: /sign-up\n");
  });
  app.use("/api/trpc", createExpressMiddleware({
    router: appRouter,
    createContext,
    // Unexpected failures (database down, bugs) go to the log with their cause; expected ones such as a wrong password do not.
    onError: ({ path: procedure, error }) => { if (error.code === "INTERNAL_SERVER_ERROR") console.error(`Error in ${procedure ?? "unknown"}:`, error.cause ?? error); },
  }));
  // Development serves the client through Vite; production serves the built files.
  if (process.env.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Living Foods is running at http://localhost:${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
