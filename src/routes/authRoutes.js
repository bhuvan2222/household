const express = require('express');
const { loginWithGoogle, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');

const router = express.Router();

const googleLoginLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: 'Too many sign-in attempts. Please try again in a few minutes.',
});

router.post('/google', googleLoginLimiter, loginWithGoogle);
router.get('/me', requireAuth, me);

module.exports = router;
