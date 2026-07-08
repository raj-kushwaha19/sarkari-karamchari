const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

// Defer strategy registration until credentials are available
// (allows app.js to load cleanly even without .env; OAuth endpoints will
//  throw 500 if called before credentials are set — expected in dev without .env)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const role = adminEmails.includes(email) ? 'admin' : 'user';

      const updateData = {
        googleId: profile.id,
        name: profile.displayName,
        email,
        role,
      };

      if (refreshToken) {
        updateData.gmailRefreshToken = refreshToken;
      }

      const user = await User.findOneAndUpdate(
        { googleId: profile.id },
        updateData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.warn('[Passport] ⚠️  GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set. Google OAuth disabled until .env is configured.');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
