/** @param {import('knex').Knex} knex */
exports.seed = async function seed(knex) {
  await knex('expenses').del();
  await knex('categories').del();
  await knex('household_members').del();
  await knex('households').del();
  await knex('users').del();

  const [user] = await knex('users')
    .insert({
      google_sub: 'demo-sub-123',
      email: 'demo@example.com',
      name: 'Demo User',
      picture_url: null,
    })
    .returning(['id']);

  const [household] = await knex('households')
    .insert({
      code: 'AS-9821-X',
      name: 'Noida Home',
      created_by: user.id,
    })
    .returning(['id']);

  await knex('household_members').insert({
    household_id: household.id,
    user_id: user.id,
    role: 'owner',
  });

  const insertedCategories = await knex('categories')
    .insert([
      {
        household_id: household.id,
        name: 'Supplies',
        icon: 'cube-outline',
        tone: '#34d399',
        created_by: user.id,
      },
      {
        household_id: household.id,
        name: 'Taxes',
        icon: 'wallet-outline',
        tone: '#818cf8',
        created_by: user.id,
      },
      {
        household_id: household.id,
        name: 'Groceries',
        icon: 'cart-outline',
        tone: '#f472b6',
        created_by: user.id,
      },
    ])
    .returning(['id', 'name']);

  const supplies = insertedCategories.find((c) => c.name === 'Supplies');

  await knex('expenses').insert([
    {
      household_id: household.id,
      user_id: user.id,
      category_id: supplies?.id,
      title: 'To-go boxes',
      amount: 120,
      spent_at: new Date().toISOString(),
    },
    {
      household_id: household.id,
      user_id: user.id,
      category_id: supplies?.id,
      title: 'Disinfectants',
      amount: 42,
      spent_at: new Date().toISOString(),
    },
  ]);
};
