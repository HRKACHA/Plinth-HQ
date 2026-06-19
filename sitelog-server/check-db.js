import mongoose from 'mongoose';
import path from 'path';

async function checkDB() {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.resolve(process.cwd(), '.mongo-data');
  const memoryServer = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger' }
  });
  await mongoose.connect(memoryServer.getUri());
  
  const User = mongoose.connection.collection('users');
  const users = await User.find({}).toArray();
  console.log('USERS:', JSON.stringify(users, null, 2));
  
  const orgs = await mongoose.connection.collection('organisations').find({}).toArray();
  console.log('ORGS:', JSON.stringify(orgs, null, 2));

  process.exit(0);
}

checkDB().catch(console.error);
