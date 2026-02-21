const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      name: user.name,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

module.exports = {
  signAccessToken,
};
