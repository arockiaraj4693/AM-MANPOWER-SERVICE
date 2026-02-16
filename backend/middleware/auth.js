const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "..", "config.env") });

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No token" });
  const parts = header.split(" ");
  if (parts.length !== 2)
    return res.status(401).json({ error: "Invalid token format" });
  const token = parts[1];
  try {
    const payload = jwt.verify(
      token,
      process.env.ADMIN_JWT_SECRET || "changeme",
    );
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function requireSuper(req, res, next) {
  if (!req.admin) return res.status(401).json({ error: "No admin" });
  if (req.admin.role !== "super")
    return res.status(403).json({ error: "Forbidden" });
  next();
}

function requireAdminOrSuper(req, res, next) {
  if (!req.admin) return res.status(401).json({ error: "No admin" });
  if (req.admin.role === "admin" || req.admin.role === "super") return next();
  return res.status(403).json({ error: "Forbidden" });
}

function requireAtLeastSupervisor(req, res, next) {
  if (!req.admin) return res.status(401).json({ error: "No admin" });
  if (["super", "admin", "supervisor"].includes(req.admin.role)) return next();
  return res.status(403).json({ error: "Forbidden" });
}

module.exports = {
  authMiddleware,
  requireSuper,
  requireAdminOrSuper,
  requireAtLeastSupervisor,
};
