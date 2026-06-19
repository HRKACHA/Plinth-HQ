import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { seedDatabase } from './seedData.js';

async function seed() {
  await connectDB();
  await seedDatabase({ clear: true });
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
