const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing Bearer token' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.auth = {
      userId: Number(decoded.sub),
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = {
  requireAuth,
};
