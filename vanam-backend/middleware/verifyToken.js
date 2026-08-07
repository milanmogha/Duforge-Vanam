import jwt from "jsonwebtoken";

const extractToken = (req) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.split(" ")[1];
};

export const verifyUserToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, role }
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const verifyAdminToken = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Admin accounts have role 'admin' or 'owner' (see models/Admin.js). Both are
// authorized for admin routes; anything else (e.g. 'customer') is rejected.
const ADMIN_ROLES = new Set(["admin", "owner"]);
export const verifyAdminRole = (req, res, next) => {
  if (!req.user || !ADMIN_ROLES.has(req.user.role))
    return res.status(403).json({ error: "Admin only" });
  next();
};

// Backwards-compat export
export const verifyToken = verifyUserToken;

// Optional token middleware: if Authorization header exists, verify and set req.user;
// if missing or invalid, do NOT return 401 — just continue without setting req.user.
export const verifyTokenOptional = (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Do not fail the request here; leave req.user undefined and continue.
    console.warn('verifyTokenOptional: token invalid or expired');
  }
  return next();
};
