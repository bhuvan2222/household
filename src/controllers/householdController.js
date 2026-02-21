const db = require('../config/db');
const { generateHouseholdCode } = require('../utils/code');

async function uniqueCode(trx) {
  for (let i = 0; i < 10; i += 1) {
    const code = generateHouseholdCode();
    const exists = await trx('households').where({ code }).first();
    if (!exists) return code;
  }
  throw new Error('Could not generate unique household code');
}

async function listHouseholds(req, res, next) {
  try {
    const households = await db('household_members as hm')
      .join('households as h', 'h.id', 'hm.household_id')
      .where('hm.user_id', req.auth.userId)
      .select('h.id', 'h.name', 'h.code', 'hm.role', 'h.created_at as createdAt')
      .orderBy('h.created_at', 'desc');

    return res.status(200).json({ households });
  } catch (error) {
    return next(error);
  }
}

async function createHousehold(req, res, next) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'name is required' });
    }

    const household = await db.transaction(async (trx) => {
      const code = await uniqueCode(trx);

      const inserted = await trx('households')
        .insert({
          name: name.trim(),
          code,
          created_by: req.auth.userId,
        })
        .returning(['id', 'name', 'code']);

      await trx('household_members').insert({
        household_id: inserted[0].id,
        user_id: req.auth.userId,
        role: 'owner',
      });

      return inserted[0];
    });

    return res.status(201).json({ household });
  } catch (error) {
    return next(error);
  }
}

async function joinHousehold(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'code is required' });
    }

    const household = await db('households').where({ code: code.trim().toUpperCase() }).first();
    if (!household) {
      return res.status(404).json({ message: 'Household not found for provided code' });
    }

    const existing = await db('household_members')
      .where({ household_id: household.id, user_id: req.auth.userId })
      .first();

    if (!existing) {
      await db('household_members').insert({
        household_id: household.id,
        user_id: req.auth.userId,
        role: 'member',
      });
    }

    return res.status(200).json({
      household: {
        id: household.id,
        name: household.name,
        code: household.code,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listHouseholds,
  createHousehold,
  joinHousehold,
};
