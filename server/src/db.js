import mongoose from 'mongoose';
import { config } from './config.js';

/**
 * Connects to MongoDB Atlas when MONGODB_URI is set; otherwise spins up an
 * in-memory MongoDB so the whole system (auth, orders, payments, analytics)
 * works instantly in demo mode with zero external setup.
 */
export async function connectDB() {
  if (config.isDemo) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mem = await MongoMemoryServer.create();
    await mongoose.connect(mem.getUri('symbieat'));
    console.log('[db] MongoDB (in-memory demo) connected');
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[db] MongoDB Atlas connected');
}
