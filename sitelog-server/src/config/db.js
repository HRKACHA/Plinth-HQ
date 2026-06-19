import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sitelog';

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri.replace(/\/\/.*@/, '//***@'));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Make sure MongoDB is running. On Windows: net start MongoDB');
    process.exit(1);
  }
}

export default connectDB;
