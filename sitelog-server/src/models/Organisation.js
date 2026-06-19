import mongoose from 'mongoose';

// ─────────────────────────────────────────────
// Plan Definitions — single source of truth
// ─────────────────────────────────────────────
const PLAN_LIMITS = {
  free:       { maxProjects: 1,  maxUsers: 2,  maxStorageMB: 500,   aiChatsPerDay: 10,  price: 0,    priceLabel: 'Free',    period: 'forever' },
  starter:    { maxProjects: 3,  maxUsers: 5,  maxStorageMB: 5120,  aiChatsPerDay: 50,  price: 99,   priceLabel: '₹99',     period: '/month' },
  pro:        { maxProjects: 10, maxUsers: 15, maxStorageMB: 51200, aiChatsPerDay: -1,  price: 299,  priceLabel: '₹299',    period: '/month' },
  business:   { maxProjects: -1, maxUsers: 50, maxStorageMB: 204800,aiChatsPerDay: -1,  price: 999,  priceLabel: '₹999',    period: '/month' },
};

const PLAN_FEATURES = {
  free:     ['1 project', '2 users', '500MB storage', 'Basic logs', '10 AI chats/day'],
  starter:  ['3 projects', '5 users', '5GB storage', 'All features', '50 AI chats/day', 'Email support'],
  pro:      ['10 projects', '15 users', '50GB storage', 'All features', 'Unlimited AI', 'PDF reports', 'Priority support'],
  business: ['Unlimited projects', '50 users', '200GB storage', 'API access', 'Unlimited AI', 'Dedicated support', 'Custom branding'],
};

const organisationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'business'], default: 'starter' },
    planExpiry: Date,
    planSelectedAt: { type: Date, default: Date.now },
    maxProjects: { type: Number, default: 3 },
    maxUsers: { type: Number, default: 5 },
    maxStorageMB: { type: Number, default: 5120 },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    cancelledAt: Date,
    logo: String,
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    billingEmail: String,
  },
  { timestamps: true }
);

organisationSchema.pre('save', async function generateSlug(next) {
  if (!this.slug && this.name) {
    let baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await this.constructor.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }
    this.slug = slug;
  }
  next();
});

// Static: Get limits for any plan name
organisationSchema.statics.getPlanLimits = function (planName) {
  return PLAN_LIMITS[planName] || PLAN_LIMITS.starter;
};

// Static: Get all plans with features for display
organisationSchema.statics.getAllPlans = function () {
  return Object.entries(PLAN_LIMITS).map(([name, limits]) => ({
    name,
    ...limits,
    features: PLAN_FEATURES[name] || [],
    unlimited: limits.maxProjects === -1,
  }));
};

// Instance: Apply plan limits to this org
organisationSchema.methods.applyPlanLimits = function (planName) {
  const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.starter;
  this.plan = planName;
  this.maxProjects = limits.maxProjects;
  this.maxUsers = limits.maxUsers;
  this.maxStorageMB = limits.maxStorageMB;
  this.planSelectedAt = new Date();
  this.cancelledAt = undefined;

  // Set expiry — free = no expiry, paid = 30 days from now
  if (planName === 'free') {
    this.planExpiry = undefined;
  } else {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (this.billingCycle === 'yearly' ? 365 : 30));
    this.planExpiry = expiry;
  }
};

export { PLAN_LIMITS, PLAN_FEATURES };
export default mongoose.model('Organisation', organisationSchema);
