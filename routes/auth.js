const express = require('express');
const passport = require('passport');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.CLIENT_URL }),
  (_req, res) => res.redirect(process.env.CLIENT_URL)
);

router.get('/me', requireAuth, (req, res) => {
  const { id, email, name, role } = req.user;
  res.json({ id, email, name, role });
});

router.post('/logout', (req, res, next) => {
  req.logout((logoutErr) => {
    if (logoutErr) return next(logoutErr);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
});

module.exports = router;