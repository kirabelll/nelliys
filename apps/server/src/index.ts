import "dotenv/config";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { initializeSocket } from "./lib/socket";
import apiRouter from "./routers";

const app = express();
const server = createServer(app);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from Next.js build in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  
  // Serve Next.js static files
  app.use('/_next/static', express.static(path.join(process.cwd(), 'apps/web/.next/static')));
  app.use('/static', express.static(path.join(process.cwd(), 'apps/web/public')));
  
  // Serve the Next.js app for non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes and health check
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return next();
    }
    
    // Serve the Next.js index.html for all other routes
    res.sendFile(path.join(process.cwd(), 'apps/web/.next/server/pages/index.html'), (err) => {
      if (err) {
        // Fallback to a simple response if file not found
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Nelliys App</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
              <div id="__next">
                <h1>Nelliys Cafe Management System</h1>
                <p>Application is starting up...</p>
                <script>
                  setTimeout(() => {
                    window.location.reload();
                  }, 3000);
                </script>
              </div>
            </body>
          </html>
        `);
      }
    });
  });
}

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - ${
      req.headers["user-agent"]?.substring(0, 50) || "Unknown"
    }`
  );
  next();
});

// Auth routes - Better Auth handles all /api/auth/* routes
app.use("/api/auth", toNodeHandler(auth));

// API routes
app.use("/api", apiRouter);

// Health check endpoints
app.get("/", (_req, res) => {
  res.status(200).send("Nelliys App Server - Ready");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

const port = process.env.PORT || 3000;

// Initialize Socket.IO
initializeSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Socket.IO server initialized`);
});
