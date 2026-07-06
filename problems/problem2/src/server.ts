import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/database';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

/** Close the HTTP server and DB connection cleanly on shutdown. */
async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
