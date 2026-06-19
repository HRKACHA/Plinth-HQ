const mongoose = require('mongoose');
const http = require('http');

async function test() {
  await mongoose.connect('mongodb+srv://hemanshukacha:Hemu%40183@cluster0.s1hj4pc.mongodb.net/sitelog?retryWrites=true&w=majority');
  const User = require('./src/models/User.js').default;
  const admin = await User.findOne({ role: 'PM' });
  if (!admin) {
    console.log('No PM found!'); process.exit(0);
  }
  const token = require('jsonwebtoken').sign({ id: admin._id }, 'sitelog-dev-access-secret-key-256-bits-minimum-length', { expiresIn: '90d' });
  
  const member = await User.findOne({ _id: { $ne: admin._id } });
  
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/v1/team/members/' + member._id + '/role',
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }
  }, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => console.log('Response:', res.statusCode, body));
  });
  req.write(JSON.stringify({ role: 'site_engineer' }));
  req.end();
}
test().catch(console.error);
