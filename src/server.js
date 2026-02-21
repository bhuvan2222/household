const app = require('./app');
const db = require('./config/db');
const { port } = require('./config/env');

async function start() {
  try {
    await db.raw('select 1+1 as result');
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`API running on http://localhost:${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
