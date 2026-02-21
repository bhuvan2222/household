const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const {
  listHouseholds,
  createHousehold,
  joinHousehold,
} = require('../controllers/householdController');

const router = express.Router();
const joinHouseholdLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: 'Too many join attempts. Please wait and try again.',
});

router.use(requireAuth);
router.get('/', listHouseholds);
router.post('/', createHousehold);
router.post('/join', joinHouseholdLimiter, joinHousehold);

module.exports = router;
