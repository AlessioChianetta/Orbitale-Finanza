import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Admin/consultant access control helpers
export function isAdmin(user: SelectUser | undefined): boolean {
  return user?.role === "admin";
}

export function isConsultant(user: SelectUser | undefined): boolean {
  return user?.role === "consultant" || user?.role === "admin";
}

// Middleware to require admin access
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!isAdmin(req.user)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
}

// Middleware to require consultant access
export function requireConsultant(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (!isConsultant(req.user)) {
    return res.status(403).json({ error: "Consultant access required" });
  }
  
  next();
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);
  
  // Forza logout ad ogni riavvio del server usando timestamp
  const serverStartTime = Date.now();
  const sessionName = `pc.sid.${serverStartTime}`;
  
  const sessionSettings: session.SessionOptions = {
    name: sessionName,
    secret: process.env.SESSION_SECRET || "percorso-capitale-secret-key-" + serverStartTime,
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      // SameSite=None is REQUIRED so the session cookie is sent when the app runs
      // inside the partner's cross-origin iframe (auto-login). None mandates Secure,
      // which is true in production. In development we fall back to "lax".
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          // Check if using global access password
          if (password === process.env.GLOBAL_ACCESS_PASSWORD) {
            let user = await storage.getUserByEmail(email);
            
            // If user doesn't exist, create a temporary admin user
            if (!user) {
              // Create user with global access
              const hashedPassword = await hashPassword(password);
              user = await storage.createUser({
                email,
                password: hashedPassword,
                firstName: "Admin",
                lastName: "User",
              });
            }
            
            return done(null, user);
          }
          
          // Normal authentication flow
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false);
          } else {
            return done(null, user);
          }
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email già registrata" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Errore durante la registrazione" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Rigenerare la sessione per prevenire session fixation attacks
    const user = req.user as SelectUser;
    
    req.session.regenerate((err) => {
      if (err) {
        console.error("Error regenerating session:", err);
        return res.status(500).json({ message: "Errore durante il login" });
      }
      
      // Riautenticare l'utente nella nuova sessione
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Error logging in user after session regeneration:", loginErr);
          return res.status(500).json({ message: "Errore durante il login" });
        }
        
        res.status(200).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          websiteUrl: user.websiteUrl || null,
        });
      });
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      
      // Distruggere la sessione e cancellare tutti i cookie
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Error destroying session:", destroyErr);
        }
        
        // Cancellare esplicitamente i cookie di sessione con le opzioni corrette
        const cookieOptions = {
          path: '/',
          sameSite: process.env.NODE_ENV === "production" ? "none" as const : "lax" as const,
          secure: process.env.NODE_ENV === "production"
        };
        
        res.clearCookie(`pc.sid.${serverStartTime}`, cookieOptions);
        res.clearCookie("connect.sid", cookieOptions); // Fallback per cookie vecchi
        
        // Headers per prevenire il caching della risposta
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const sessionUser = req.user as SelectUser;
    
    const freshUser = await storage.getUser(sessionUser.id);
    
    if (!freshUser) {
      return res.sendStatus(401);
    }
    
    res.json({
      id: freshUser.id,
      email: freshUser.email,
      firstName: freshUser.firstName,
      lastName: freshUser.lastName,
      role: freshUser.role,
      websiteUrl: freshUser.websiteUrl || null,
    });
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

// Builds a short, non-reversible fingerprint of an API key so we can group log
// entries by key (e.g. "rotated key vs current key") without persisting the key.
function fingerprintApiKey(key: string | undefined): string | null {
  if (!key || typeof key !== 'string') return null;
  const head = key.slice(0, 4);
  return `${head}…(${key.length})`;
}

// Mount BEFORE requireMasterApiKey on the /api/public/* mount so it captures
// auth failures (401/403/404) as well as successful 2xx/5xx calls.
// Logging is fire-and-forget; logging errors must never break the response path.
export const publicApiCallLogger = (req: any, _res: any, next: any) => {
  const start = Date.now();
  const res = _res;

  // Capture an error message if the route handler attached one via res.json({message}).
  // We monkey-patch res.json on this request only.
  const origJson = res.json.bind(res);
  let capturedErrorMessage: string | null = null;
  res.json = (body: any) => {
    if (res.statusCode >= 400 && body && typeof body === 'object') {
      const msg = (body.message ?? body.error);
      if (typeof msg === 'string') capturedErrorMessage = msg.slice(0, 1000);
    }
    return origJson(body);
  };

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const queryString = Object.keys(req.query || {}).length
      ? JSON.stringify(req.query).slice(0, 4000)
      : null;
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()
                || req.socket?.remoteAddress
                || null);
    const ua = (req.headers['user-agent'] || '').toString().slice(0, 512) || null;
    const payload = {
      apiKeyFingerprint: fingerprintApiKey(req.headers['x-api-key']?.toString()),
      userEmail: maskEmail(req.headers['x-user-email']?.toString() || null),
      userId: req.user?.id ? Number(req.user.id) : null,
      method: req.method,
      path: req.originalUrl?.split('?')[0]?.slice(0, 512) || req.path,
      query: queryString,
      statusCode: res.statusCode,
      durationMs,
      ip: ip?.slice(0, 64) || null,
      userAgent: ua,
      errorMessage: capturedErrorMessage,
    };
    // Fire-and-forget; do NOT await
    storage.recordPublicApiCallLog(payload).catch((err) => {
      console.error('Failed to record public API call log:', err?.message || err);
    });
  });
  next();
};

// Middleware for public API authentication using Master API Key
export const requireMasterApiKey = async (req: any, res: any, next: any) => {
  try {
    // Extract headers
    const apiKey = req.headers['x-api-key'];
    const userEmail = req.headers['x-user-email'];

    // Check if both headers are present
    if (!apiKey || !userEmail) {
      return res.status(401).json({ 
        error: "Missing authentication headers",
        message: "Both X-API-Key and X-User-Email headers are required"
      });
    }

    // Verify Master API Key
    const masterApiKey = process.env.MASTER_API_KEY;
    if (!masterApiKey) {
      console.error("MASTER_API_KEY not configured in environment variables");
      return res.status(500).json({ 
        error: "Server configuration error",
        message: "API authentication not properly configured"
      });
    }

    if (apiKey !== masterApiKey) {
      console.warn(`Invalid API key attempt for email: ${maskEmail(userEmail?.toString())}`);
      return res.status(401).json({ 
        error: "Invalid API key",
        message: "The provided API key is not valid"
      });
    }

    // Find user by email
    const user = await storage.getUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ 
        error: "User not found",
        message: `No user found with email: ${userEmail}`
      });
    }

    // Inject user into request (mimics session authentication)
    req.user = user;
    
    console.log(`Public API access granted for user: ${maskEmail(user.email)} (ID: ${user.id})`);
    next();
  } catch (error) {
    console.error("Error in requireMasterApiKey middleware:", error);
    return res.status(500).json({ 
      error: "Authentication error",
      message: "An error occurred during authentication"
    });
  }
};

// Mask an email so full addresses never appear in clear text in logs.
// e.g. "mario.rossi@example.com" -> "m***@example.com"
function maskEmail(email?: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  return `${email[0]}***${email.slice(at)}`.slice(0, 255);
}

// Constant-time string comparison to avoid leaking the API key via timing.
function safeKeyEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Server-to-server authentication using ONLY the shared X-API-Key.
// Unlike requireMasterApiKey, this does NOT require X-User-Email and does NOT
// require the user to already exist — it is used by the provisioning and SSO-link
// endpoints. These endpoints must never be reachable from the browser: the API
// key is a server secret that must not be exposed client-side.
export const requireApiKeyOnly = (req: any, res: any, next: any) => {
  // Strictly server-to-server: reject any request that carries browser auth
  // context — an active passport session or a session cookie — so the shared
  // API key can never be exercised from a logged-in browser.
  const hasSessionCookie = /(^|;\s*)pc\.sid\./.test(req.headers.cookie || "");
  const hasUserSession = typeof req.isAuthenticated === "function" && req.isAuthenticated();
  if (hasSessionCookie || hasUserSession) {
    return res.status(401).json({
      error: "Browser context not allowed",
      message: "This endpoint is server-to-server only",
    });
  }

  const apiKey = req.headers['x-api-key']?.toString();

  if (!apiKey) {
    return res.status(401).json({
      error: "Missing authentication header",
      message: "X-API-Key header is required",
    });
  }

  const masterApiKey = process.env.MASTER_API_KEY;
  if (!masterApiKey) {
    console.error("MASTER_API_KEY not configured in environment variables");
    return res.status(500).json({
      error: "Server configuration error",
      message: "API authentication not properly configured",
    });
  }

  if (!safeKeyEqual(apiKey, masterApiKey)) {
    console.warn("Invalid API key attempt on server-to-server endpoint");
    return res.status(401).json({
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
  }

  next();
};