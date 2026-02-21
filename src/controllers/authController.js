const db = require('../config/db');
const { verifyGoogleIdToken } = require('../services/googleAuthService');
const { signAccessToken } = require('../utils/jwt');
const { generateHouseholdCode } = require('../utils/code');

async function getUserHouseholds(executor, userId) {
  return executor('household_members as hm')
    .join('households as h', 'h.id', 'hm.household_id')
    .select('h.id', 'h.name', 'h.code', 'hm.role')
    .where('hm.user_id', userId)
    .orderBy('h.created_at', 'desc');
}

async function ensureUniqueHouseholdCode(trx) {
  for (let i = 0; i < 10; i += 1) {
    const code = generateHouseholdCode();
    const existing = await trx('households').where({ code }).first();
    if (!existing) return code;
  }
  throw new Error('Could not generate unique household code');
}

async function createStarterDataForUser(trx, userId, userName) {
  const code = await ensureUniqueHouseholdCode(trx);
  const [household] = await trx('households')
    .insert({
      name: `${userName.split(' ')[0] || 'My'} Home`,
      code,
      created_by: userId,
    })
    .returning(['id']);

  await trx('household_members').insert({
    household_id: household.id,
    user_id: userId,
    role: 'owner',
  });

  await trx('categories').insert([
    {
      household_id: household.id,
      name: 'Supplies',
      icon: 'cube-outline',
      tone: '#34d399',
      created_by: userId,
    },
    {
      household_id: household.id,
      name: 'Taxes',
      icon: 'wallet-outline',
      tone: '#818cf8',
      created_by: userId,
    },
    {
      household_id: household.id,
      name: 'Groceries',
      icon: 'cart-outline',
      tone: '#f472b6',
      created_by: userId,
    },
    {
      household_id: household.id,
      name: 'Transport',
      icon: 'car-outline',
      tone: '#fb923c',
      created_by: userId,
    },
  ]);
}

async function loginWithGoogle(req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }

    const profile = await verifyGoogleIdToken(idToken);

    if (!profile.emailVerified) {
      return res.status(401).json({ message: 'Google account email is not verified' });
    }

    const result = await db.transaction(async (trx) => {
      let user = await trx('users').where({ google_sub: profile.googleSub }).first();

      if (!user) {
        user = await trx('users').where({ email: profile.email }).first();
      }

      if (!user) {
        const inserted = await trx('users')
          .insert({
            google_sub: profile.googleSub,
            email: profile.email,
            name: profile.name,
            picture_url: profile.pictureUrl,
          })
          .returning(['id', 'email', 'name', 'picture_url']);

        user = inserted[0];
        await createStarterDataForUser(trx, user.id, user.name);
      } else {
        const updated = await trx('users')
          .where({ id: user.id })
          .update({
            google_sub: profile.googleSub,
            email: profile.email,
            name: profile.name,
            picture_url: profile.pictureUrl,
            updated_at: trx.fn.now(),
          })
          .returning(['id', 'email', 'name', 'picture_url']);
        user = updated[0];
      }

      const households = await getUserHouseholds(trx, user.id);
      return { user, households };
    });

    const token = signAccessToken(result.user);

    return res.status(200).json({
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        pictureUrl: result.user.picture_url,
      },
      households: result.households,
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await db('users')
      .select('id', 'email', 'name', 'picture_url as pictureUrl')
      .where({ id: req.auth.userId })
      .first();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const households = await getUserHouseholds(db, req.auth.userId);

    return res.status(200).json({ user, households });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  loginWithGoogle,
  me,
};
