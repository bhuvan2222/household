const db = require('../config/db');
const { assertMembership } = require('../services/accessService');

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

async function listExpenses(req, res, next) {
  try {
    const householdId = Number(req.query.householdId);
    if (!householdId) {
      return res.status(400).json({ message: 'householdId query param is required' });
    }

    await assertMembership(req.auth.userId, householdId);

    const query = db('expenses as e')
      .leftJoin('categories as c', 'c.id', 'e.category_id')
      .leftJoin('users as u', 'u.id', 'e.user_id')
      .where('e.household_id', householdId)
      .select(
        'e.id',
        'e.title',
        'e.amount',
        'e.spent_at as spentAt',
        'e.notes',
        'e.category_id as categoryId',
        'c.name as categoryName',
        'c.icon as categoryIcon',
        'c.tone as categoryTone',
        'u.id as createdById',
        'u.name as createdByName'
      )
      .orderBy('e.spent_at', 'desc');

    if (req.query.from) {
      query.andWhere('e.spent_at', '>=', new Date(req.query.from).toISOString());
    }
    if (req.query.to) {
      query.andWhere('e.spent_at', '<=', new Date(req.query.to).toISOString());
    }

    const expenses = await query;

    return res.status(200).json({ expenses });
  } catch (error) {
    return next(error);
  }
}

async function createExpense(req, res, next) {
  try {
    const { householdId, title, amount, spentAt, categoryId, notes } = req.body;
    const parsedHouseholdId = Number(householdId);

    if (!parsedHouseholdId || !title || Number(amount) <= 0) {
      return res.status(400).json({ message: 'householdId, title and positive amount are required' });
    }

    await assertMembership(req.auth.userId, parsedHouseholdId);

    if (categoryId) {
      const category = await db('categories')
        .where({ id: Number(categoryId), household_id: parsedHouseholdId })
        .first();
      if (!category) {
        return res.status(400).json({ message: 'Invalid category for this household' });
      }
    }

    const inserted = await db('expenses')
      .insert({
        household_id: parsedHouseholdId,
        user_id: req.auth.userId,
        category_id: categoryId ? Number(categoryId) : null,
        title: title.trim(),
        amount: Number(amount),
        spent_at: spentAt ? new Date(spentAt).toISOString() : new Date().toISOString(),
        notes: notes || null,
      })
      .returning(['id', 'title', 'amount', 'spent_at as spentAt', 'category_id as categoryId', 'notes']);

    return res.status(201).json({ expense: inserted[0] });
  } catch (error) {
    return next(error);
  }
}

async function deleteExpense(req, res, next) {
  try {
    const expenseId = Number(req.params.id);
    const householdId = Number(req.query.householdId);

    if (!expenseId || !householdId) {
      return res.status(400).json({ message: 'expense id and householdId are required' });
    }

    await assertMembership(req.auth.userId, householdId);

    const deleted = await db('expenses').where({ id: expenseId, household_id: householdId }).del();

    if (!deleted) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
}

async function expenseSummary(req, res, next) {
  try {
    const householdId = Number(req.query.householdId);
    const mode = req.query.mode === 'month' ? 'month' : 'week';
    const anchor = req.query.anchor ? new Date(req.query.anchor) : new Date();

    if (!householdId) {
      return res.status(400).json({ message: 'householdId query param is required' });
    }

    await assertMembership(req.auth.userId, householdId);

    const from = mode === 'week' ? startOfWeek(anchor) : startOfMonth(anchor);
    const to = mode === 'week' ? endOfWeek(anchor) : endOfMonth(anchor);

    const rows = await db('expenses as e')
      .leftJoin('categories as c', 'c.id', 'e.category_id')
      .where('e.household_id', householdId)
      .where('e.spent_at', '>=', from.toISOString())
      .where('e.spent_at', '<=', to.toISOString())
      .groupBy('c.id', 'c.name', 'c.icon', 'c.tone')
      .select(
        'c.id as categoryId',
        'c.name as categoryName',
        'c.icon as categoryIcon',
        'c.tone as categoryTone'
      )
      .sum({ total: 'e.amount' });

    const totalSpent = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);

    return res.status(200).json({
      mode,
      from: from.toISOString(),
      to: to.toISOString(),
      totalSpent,
      byCategory: rows.map((row) => ({
        categoryId: row.categoryId,
        categoryName: row.categoryName || 'Uncategorized',
        categoryIcon: row.categoryIcon || 'pricetag-outline',
        categoryTone: row.categoryTone || '#9ca3af',
        total: Number(row.total || 0),
      })),
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listExpenses,
  createExpense,
  deleteExpense,
  expenseSummary,
};
