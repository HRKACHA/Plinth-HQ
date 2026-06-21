import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import SiteLog from './src/models/SiteLog.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const logDate = new Date('2026-06-21');
    const startOfDay = new Date(logDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(logDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const log = await SiteLog.findOne({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (log && log.activities) {
      log.activities = log.activities
        .replace('--- Update (1:07 pm) ---', '--- Update (6:37 pm) ---')
        .replace('--- Update (1:20 pm) ---', '--- Update (6:50 pm) ---');
      await log.save();
      console.log('Successfully corrected UTC times to IST times in activities string');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
