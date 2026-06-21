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

    const expenses = await Expense.find({});
    
    // Group by project + date + vendor + description
    const grouped = {};
    for (const exp of expenses) {
      if (!exp.invoiceDate) continue;
      const dateKey = exp.invoiceDate.toISOString().split('T')[0];
      const key = `${exp.project.toString()}_${dateKey}_${exp.vendor}_${exp.description}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(exp);
    }

    for (const key in grouped) {
      const group = grouped[key];
      if (group.length > 1) {
        console.log(`Found ${group.length} duplicate expenses for ${key}. Merging...`);
        // Sort by creation time (ascending)
        group.sort((a, b) => a.createdAt - b.createdAt);
        
        const primary = group[0];
        
        for (let i = 1; i < group.length; i++) {
          const duplicate = group[i];
          
          primary.amount += duplicate.amount;
          if (duplicate.receiptUrl && !primary.receiptUrl) primary.receiptUrl = duplicate.receiptUrl;
          
          await Expense.deleteOne({ _id: duplicate._id });
          console.log(`Deleted duplicate ${duplicate._id}`);
        }
        
        await primary.save();
        console.log(`Successfully saved merged primary expense ${primary._id}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
