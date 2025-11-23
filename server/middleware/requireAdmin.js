export default function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado: no eres admin" });
  }
  next();
}
