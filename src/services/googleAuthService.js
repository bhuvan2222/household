const { OAuth2Client } = require('google-auth-library');
const { googleClientIds } = require('../config/env');

const client = new OAuth2Client();

async function verifyGoogleIdToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: googleClientIds,
  });

  const payload = ticket.getPayload();

  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Invalid Google token payload');
  }

  return {
    googleSub: payload.sub,
    email: payload.email,
    name: payload.name || payload.email,
    pictureUrl: payload.picture || null,
    emailVerified: Boolean(payload.email_verified),
  };
}

module.exports = {
  verifyGoogleIdToken,
};
