import { randomBytes } from "node:crypto";
import { validateCallbackUrl, validOAuthState } from "../config/security.js";
import { Router } from "express";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import { AuthService } from "../services/auth-service.js";

const router = Router();
const prisma = new PrismaClient();
const authService = new AuthService(prisma);

// Bind each OAuth callback to the browser that initiated it.
router.get("/google", async (req, res, next) => {
  try {
    const redirectUri = validateCallbackUrl(req.query.redirect_uri);
    if (!redirectUri)
      return res.status(400).json({ error: "Invalid callback URL" });
    const session = req.session;
    const state = randomBytes(32).toString("hex");
    session.googleOAuth = { state, redirectUri, createdAt: Date.now() };
    await session.save();
    passport.authenticate("google", { scope: ["profile", "email"], state })(
      req,
      res,
      next,
    );
  } catch (error) {
    next(error);
  }
});

router.get("/google/callback", async (req, res, next) => {
  try {
    const session = req.session;
    const pending = session.googleOAuth;
    delete session.googleOAuth;
    await session.save();
    if (!validOAuthState(req.query.state, pending) || !pending) {
      return res
        .status(400)
        .json({ error: "Invalid or expired OAuth state; start login again" });
    }
    const callback = new URL(pending.redirectUri);
    passport.authenticate(
      "google",
      { session: false },
      async (err: unknown, user: import("@nimble/shared").AuthUser | false) => {
        try {
          if (err || !user) {
            callback.searchParams.set("status", "failed");
          } else {
            session.user = user;
            await session.save();
            callback.searchParams.set("status", "success");
          }
          res.redirect(callback.href);
        } catch (error) {
          next(error);
        }
      },
    )(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Logout
router.post("/logout", async (req, res) => {
  const session = req.session;
  session.destroy();
  res.json({ message: "Logged out successfully" });
});

// Get current user
router.get("/user", async (req, res) => {
  const session = req.session;

  if (!session.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  // Ensure user exists in database and get updated session
  const user = await authService.ensureUserExists(session);

  if (user) {
    res.json({ user });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

router.get("/failure", (_req, res) => {
  res.status(401).json({ error: "Authentication failed; start login again" });
});

export default router;
