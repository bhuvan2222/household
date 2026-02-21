const db = require('../config/db');
const { assertMembership } = require('../services/accessService');

async function listCategories(req, res, next) {
  try {
    const householdId = Number(req.query.householdId);
    if (!householdId) {
      return res.status(400).json({ message: 'householdId query param is required' });
    }

    await assertMembership(req.auth.userId, householdId);

    const categories = await db('categories')
      .where({ household_id: householdId })
      .select('id', 'name', 'icon', 'tone', 'created_at as createdAt')
      .orderBy('name', 'asc');

    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
}

async function createCategory(req, res, next) {
  try {
    const { householdId, name, icon, tone } = req.body;
    const parsedHouseholdId = Number(householdId);

    if (!parsedHouseholdId || !name || !name.trim()) {
      return res.status(400).json({ message: 'householdId and name are required' });
    }

    await assertMembership(req.auth.userId, parsedHouseholdId);

    const inserted = await db('categories')
      .insert({
        household_id: parsedHouseholdId,
        name: name.trim(),
        icon: icon || 'pricetag-outline',
        tone: tone || '#9ca3af',
        created_by: req.auth.userId,
      })
      .returning(['id', 'name', 'icon', 'tone', 'created_at as createdAt']);

    return res.status(201).json({ category: inserted[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Category name already exists in this household' });
    }
    return next(error);
  }
}

async function deleteCategory(req, res, next) {
  try {
    const categoryId = Number(req.params.id);
    const householdId = Number(req.query.householdId);

    if (!categoryId || !householdId) {
      return res.status(400).json({ message: 'category id and householdId are required' });
    }

    await assertMembership(req.auth.userId, householdId);

    const deleted = await db('categories')
      .where({ id: categoryId, household_id: householdId })
      .del();

    if (!deleted) {
      return res.status(404).json({ message: 'Category not found' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCategories,
  createCategory,
  deleteCategory,
};
