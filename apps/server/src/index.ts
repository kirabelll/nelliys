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



// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.headers['user-agent']?.substring(0, 50) || 'Unknown'}`);
  next();
});

// Auth routes - Better Auth handles all /api/auth/* routes
app.use("/api/auth", toNodeHandler(auth));

// API routes
app.use("/api", apiRouter);

// Health check endpoints
app.get("/", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

const port = process.env.PORT || 3000;

// Initialize Socket.IO
initializeSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Socket.IO server initialized`);
});
