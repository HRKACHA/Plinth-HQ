import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

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

    const expense = await Expense.findOne({
      vendor: 'Internal Payroll',
      invoiceDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (expense) {
      expense.amount += 200; // Adding back the 200 I erroneously subtracted
      await expense.save();
      console.log('Successfully corrected Expense amount by adding ₹200');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
