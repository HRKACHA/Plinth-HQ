import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLE_LABELS = {
  site_engineer: 'Site Engineer (Can view and submit logs)',
  accounts: 'Accounts (Can view budget and expenses)',
  owner: 'Owner (View-only executive access)',
  project_manager: 'Project Manager (Full access)',
  admin: 'Admin',
  contractor: 'Contractor (Execution and daily logging)',
  // Legacy roles mapped for backwards compatibility
  SuperAdmin: 'Admin',
  PM: 'Project Manager (Full access)',
  Engineer: 'Site Engineer (Can view and submit logs)',
  Owner: 'Owner (View-only executive access)',
  Labour: 'Site Engineer (Can view and submit logs)',
  Accounts: 'Accounts (Can view budget and expenses)',
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 8, select: false },
    role: {
      type: String,
      enum: [
        // New roles
        'site_engineer', 'accounts', 'owner', 'project_manager', 'admin', 'contractor',
        // Legacy roles (kept for backwards compatibility with existing data)
        'SuperAdmin', 'PM', 'Engineer', 'Owner', 'Labour', 'Accounts',
      ],
      default: 'Engineer',
    },
    roleLabel: {
      type: String,
      enum: [
        'Site Engineer (Can view and submit logs)',
        'Accounts (Can view budget and expenses)',
        'Owner (View-only executive access)',
        'Project Manager (Full access)',
        'Admin',
        'Contractor (Execution and daily logging)',
      ],
    },
    phone: String,
    avatar: { type: String, default: '' },
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
    inviteToken: String,
    inviteExpiry: Date,
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    joinedAt: { type: Date, default: Date.now },
    notifPrefs: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
    },
    lastLogin: Date,

    // ── Email Verification ──
    emailVerified: { type: Boolean, default: false },

    // ── Google OAuth ──
    googleId: String,
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    avatarUrl: String,

    // ── Security ──
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
  },
  { timestamps: true }
);

userSchema.index({ organisation: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// Auto-set roleLabel from role on save
userSchema.pre('save', async function setRoleLabel(next) {
  if (this.isModified('role') && !this.roleLabel) {
    this.roleLabel = ROLE_LABELS[this.role] || undefined;
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

export { ROLE_LABELS };
export default mongoose.model('User', userSchema);
