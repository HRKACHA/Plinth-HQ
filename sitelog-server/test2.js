const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sitelog');
  const SiteLog = require('./src/models/SiteLog.js').default;
  
  const logs = await SiteLog.find({ materials: { $not: { $size: 0 } } });
  const log = logs[0];
  if (!log) { console.log('No logs'); process.exit(0); }
  
  console.log('Before:', log.materials);
  
  const newMat = { name: 'Steel', qty: '500', unit: 'bags', price: 200000, recdAt: new Date() };
  log.materials = [...log.materials, newMat];
  
  await log.save();
  
  console.log('After:', log.materials);
  process.exit(0);
}

test().catch(console.error);
