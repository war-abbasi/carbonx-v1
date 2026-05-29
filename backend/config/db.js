const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (err) {
    logger.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = { prisma, connectDB };
