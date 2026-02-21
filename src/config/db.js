const knex = require('knex');
const { databaseUrl, nodeEnv } = require('./env');

const db = knex({
  client: 'pg',
  connection: databaseUrl,
  pool: nodeEnv === 'production' ? { min: 2, max: 10 } : { min: 1, max: 5 },
});

module.exports = db;
