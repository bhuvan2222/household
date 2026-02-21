const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const { clientOrigins } = require('./config/env');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients that do not send Origin (mobile apps, curl, servers).
      if (!origin) {
        return callback(null, true);
      }

      if (clientOrigins.includes(origin)) {
        return callback(null, true);
      }

      const corsError = new Error('CORS origin not allowed');
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: false,
  })
);
app.use(express.json({ limit: '1mb' }));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(error);

  const statusCode = error.statusCode || 500;
  const message = statusCode >= 500 ? 'Internal server error' : error.message;

  res.status(statusCode).json({ message });
});

module.exports = app;
