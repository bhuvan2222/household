const db = require('../config/db');

async function getMembership(userId, householdId) {
  return db('household_members')
    .where({ user_id: userId, household_id: householdId })
    .first();
}

async function assertMembership(userId, householdId) {
  const membership = await getMembership(userId, householdId);
  if (!membership) {
    const err = new Error('Forbidden: not a member of this household');
    err.statusCode = 403;
    throw err;
  }
  return membership;
}

module.exports = {
  getMembership,
  assertMembership,
};
