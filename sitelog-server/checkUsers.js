import mongoose from 'mongoose';
import User from './src/models/User.js';

async function run() {
  await mongoose.connect('mongodb+srv://hemanshukacha:Hemu%40183@cluster0.s1hj4pc.mongodb.net/sitelog?retryWrites=true&w=majority');
  const user = await User.findOne({ email: 'hrkacha1@gmail.com' });
  console.log('User hrkacha1:', user ? { role: user.role, label: user.roleLabel } : 'Not found');
  
  const allUsers = await User.find({});
  console.log('All users:', allUsers.map(u => ({ email: u.email, role: u.role })));
  
  process.exit(0);
}
run().catch(console.error);
