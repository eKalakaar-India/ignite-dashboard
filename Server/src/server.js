import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const port = env.PORT || 4000;

const server = app.listen(port, () => {
  logger.info({ port, environment: env.NODE_ENV }, 'Server started');
});

const shutdown = (signal) => {
  logger.info({ signal }, 'Shutting down server');
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));


export default app;