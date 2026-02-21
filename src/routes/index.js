const express = require('express');

const authRoutes = require('./authRoutes');
const householdRoutes = require('./householdRoutes');
const categoryRoutes = require('./categoryRoutes');
const expenseRoutes = require('./expenseRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'household-expense-backend' });
});

router.use('/auth', authRoutes);
router.use('/households', householdRoutes);
router.use('/categories', categoryRoutes);
router.use('/expenses', expenseRoutes);

module.exports = router;
