require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
});

const parsedGoogleClientIds = [
  ...(process.env.GOOGLE_CLIENT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  ...(process.env.GOOGLE_CLIENT_ID ? [process.env.GOOGLE_CLIENT_ID.trim()] : []),
];

if (parsedGoogleClientIds.length === 0) {
  throw new Error('Missing required env variable: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_IDS');
}

const rawClientOrigins =
  process.env.CLIENT_ORIGINS ||
  process.env.CLIENT_ORIGIN ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8081');

const clientOrigins = rawClientOrigins
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && clientOrigins.length === 0) {
  throw new Error('Missing required env variable: CLIENT_ORIGINS');
}

if (process.env.NODE_ENV === 'production' && clientOrigins.includes('*')) {
  throw new Error('CLIENT_ORIGINS cannot contain "*" in production');
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  clientOrigins,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  googleClientId: parsedGoogleClientIds[0],
  googleClientIds: parsedGoogleClientIds,
};
