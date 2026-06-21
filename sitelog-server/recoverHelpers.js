import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import SiteLog from './src/models/SiteLog.js';
import Expense from './src/models/Expense.js';

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

    if (log) {
      const helper500 = log.labour.find(l => l.trade === 'helper' && l.wagePerDay === 500);
      if (helper500 && helper500.present >= 2) {
        helper500.present -= 2;
        log.labour.push({ trade: 'helper', present: 2, absent: 0, wagePerDay: 400 });
        await log.save();
        console.log('Successfully restored 2 helpers at ₹400 in SiteLog');
      } else {
        console.log('Helper 500 not found or not enough present');
      }
    }

    const expense = await Expense.findOne({
      vendor: 'Internal Payroll',
      invoiceDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (expense) {
      expense.amount -= 200; // 2 helpers * (500 - 400)
      await expense.save();
      console.log('Successfully corrected Expense amount by subtracting ₹200');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
