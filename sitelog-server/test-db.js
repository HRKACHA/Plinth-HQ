import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const InviteTokenSchema = new mongoose.Schema({
  email: String,
  used: Boolean,
  organisation: mongoose.Schema.Types.ObjectId
});
const InviteToken = mongoose.model('InviteToken', InviteTokenSchema);

async function run() {
  const invites = await InviteToken.find({ email: 'hrkacha3@gmail.com' }).lean();
  console.log(JSON.stringify(invites, null, 2));
  process.exit(0);
}

run();
