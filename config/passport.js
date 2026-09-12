const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../db');

const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          `http://localhost:${process.env.PORT || 5000}/auth/google/callback`,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(null, false, { message: 'Google account has no email' });

          const role = email === adminEmail ? 'admin' : 'viewer';

          await pool.query(
            `INSERT INTO users (id, email, name, role)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name = VALUES(name)`,
            [profile.id, email, profile.displayName || email, role]
          );
          const [rows] = await pool.query(
            'SELECT id, email, name, role FROM users WHERE email = ?',
            [email]
          );
          return done(null, rows[0]);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = ?',
      [id]
    );
    done(null, rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;