function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
}

module.exports = { requireAuth, requireAdmin };