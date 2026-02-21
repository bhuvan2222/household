/** @param {import('knex').Knex} knex */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.string('google_sub', 255).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.string('name', 255).notNullable();
    table.string('picture_url', 1024).nullable();
    table.timestamps(true, true);
  });

  await knex.schema.createTable('households', (table) => {
    table.bigIncrements('id').primary();
    table.string('code', 32).notNullable().unique();
    table.string('name', 255).notNullable();
    table.bigInteger('created_by').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('household_members', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('household_id').unsigned().notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('role', 30).notNullable().defaultTo('member');
    table.timestamps(true, true);
    table.unique(['household_id', 'user_id']);
  });

  await knex.schema.createTable('categories', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('household_id').unsigned().notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.string('name', 120).notNullable();
    table.string('icon', 80).nullable();
    table.string('tone', 20).nullable();
    table.bigInteger('created_by').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.timestamps(true, true);
    table.unique(['household_id', 'name']);
  });

  await knex.schema.createTable('expenses', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('household_id').unsigned().notNullable().references('id').inTable('households').onDelete('CASCADE');
    table.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('category_id').unsigned().nullable().references('id').inTable('categories').onDelete('SET NULL');
    table.string('title', 255).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.timestamp('spent_at', { useTz: true }).notNullable();
    table.text('notes').nullable();
    table.timestamps(true, true);

    table.index(['household_id', 'spent_at']);
    table.index(['user_id']);
    table.index(['category_id']);
  });
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('household_members');
  await knex.schema.dropTableIfExists('households');
  await knex.schema.dropTableIfExists('users');
};
