const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  listExpenses,
  createExpense,
  deleteExpense,
  expenseSummary,
} = require('../controllers/expenseController');

const router = express.Router();

router.use(requireAuth);
router.get('/', listExpenses);
router.post('/', createExpense);
router.delete('/:id', deleteExpense);
router.get('/summary', expenseSummary);

module.exports = router;
