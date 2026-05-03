const app = require('./app');
const config = require('./config');
const logger = require('./config/logger');
const prisma = require('./config/database');

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');

    const server = app.listen(config.port, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${config.port}`);
    });

    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Server shut down successfully');
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
      gracefulShutdown('unhandledRejection');
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
}

startServer();
