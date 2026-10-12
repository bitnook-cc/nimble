import { isAllowedOrigin } from "./config/security.js";
import express from "express";
import cors from "cors";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./config/session.js";
import passport from "./config/passport.js";
import authRoutes from "./routes/auth.js";
import syncRoutes from "./routes/sync.js";
import imagesRoutes from "./routes/images.js";
import activitySharingRoutes from "./routes/activity-sharing.js";
import campaignRoutes from "./routes/campaigns.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Iron Session middleware
app.use(async (req, res, next) => {
  try {
    req.session = await getIronSession<SessionData>(req, res, sessionOptions);
    next();
  } catch (error) {
    next(error);
  }
});

// Passport middleware (only for OAuth strategies, not for sessions)
app.use(passport.initialize());

// CORS configuration - allow specific origins

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware
app.use((req, res, next) => {
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("origin");
    if (!origin || !isAllowedOrigin(origin))
      return res.status(403).json({ error: "Untrusted request origin" });
  }
  next();
});
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "8kb" }));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Hello world endpoint
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Sidekick API" });
});

// Auth routes
app.use("/auth", authRoutes);

// Sync routes
app.use("/sync", syncRoutes);

// Images routes
app.use("/images", imagesRoutes);

// Activity sharing routes
app.use("/api", activitySharingRoutes);
app.use("/campaigns", campaignRoutes);

// Example API endpoint
app.get("/hello", (req, res) => {
  const name = req.query.name || "World";
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  });
});

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("API request failed:", error.message);
    if (!res.headersSent) res.status(500).json({ error: "Request failed" });
  },
);

// Start server only if not in serverless environment
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`✨ API server running on http://localhost:${PORT}`);

    // Log blob storage configuration status
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      console.log("📦 Blob storage configured - image sync enabled");
    } else {
      console.log(
        "⚠️  Blob storage not configured (BLOB_READ_WRITE_TOKEN missing) - image sync disabled",
      );
      console.log("    Images will only be stored locally in IndexedDB");
    }

    // Log Pusher configuration status
    if (
      process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET
    ) {
      console.log("🔄 Pusher configured - activity log sharing enabled");
    } else {
      console.log(
        "⚠️  Pusher not configured (PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET missing) - activity sharing disabled",
      );
    }
  });
}

// Export for Vercel
export default app;
