import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for local development
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple login endpoint for testing
  app.post("/api/login", async (req, res) => {
    try {
      // Create or get test user
      const testUser = await storage.upsertUser({
        id: "test-user-id",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
      });

      // Set user session
      (req.session as any).user = {
        claims: {
          sub: testUser.id,
          email: testUser.email,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        }
      };

      res.json({ success: true, user: testUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Simple logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Auto-login for testing
  app.get("/api/login", async (req, res) => {
    try {
      // Create or get test user
      const testUser = await storage.upsertUser({
        id: "test-user-id",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        profileImageUrl: null,
      });

      // Set user session
      (req.session as any).user = {
        claims: {
          sub: testUser.id,
          email: testUser.email,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
        }
      };

      res.redirect("/");
    } catch (error) {
      console.error("Auto-login error:", error);
      res.status(500).json({ message: "Auto-login failed" });
    }
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = (req.session as any)?.user;

  if (!user || !user.claims) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Add user to request for compatibility
  (req as any).user = user;

  return next();
};
