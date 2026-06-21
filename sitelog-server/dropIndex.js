import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    await mongoose.connection.collection('sitelogs').dropIndex('project_1_date_1');
    console.log('Successfully dropped the unique index on project and date');
  } catch (error) {
    console.error('Error dropping index:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

run();
