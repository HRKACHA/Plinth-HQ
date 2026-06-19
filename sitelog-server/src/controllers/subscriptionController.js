import Organisation from '../models/Organisation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * GET /api/v1/subscription/plans
 * Returns all available plans with features and pricing.
 */
export const listPlans = catchAsync(async (req, res) => {
  const plans = Organisation.getAllPlans();

  // Mark which plan is the user's current plan
  const org = await Organisation.findById(req.user.organisation);
  const enriched = plans.map((p) => ({
    ...p,
    current: org?.plan === p.name,
  }));

  res.json({ success: true, data: enriched });
});

/**
 * GET /api/v1/subscription/status
 * Returns the user's current plan, usage stats, and limits.
 */
export const getStatus = catchAsync(async (req, res) => {
  const org = await Organisation.findById(req.user.organisation).populate('owner', 'name email');
  if (!org) throw new AppError('Organisation not found.', 404);

  const [projectCount, userCount] = await Promise.all([
    Project.countDocuments({ organisation: org._id, isDeleted: false }),
    User.countDocuments({ organisation: org._id, isActive: true }),
  ]);

  const limits = Organisation.getPlanLimits(org.plan);

  res.json({
    success: true,
    data: {
      plan: org.plan,
      planExpiry: org.planExpiry,
      planSelectedAt: org.planSelectedAt,
      billingCycle: org.billingCycle,
      cancelledAt: org.cancelledAt,
      limits: {
        maxProjects: org.maxProjects,
        maxUsers: org.maxUsers,
        maxStorageMB: org.maxStorageMB,
        aiChatsPerDay: limits.aiChatsPerDay,
      },
      usage: {
        projects: projectCount,
        users: userCount,
        projectsRemaining: org.maxProjects === -1 ? 'unlimited' : Math.max(0, org.maxProjects - projectCount),
        usersRemaining: org.maxUsers === -1 ? 'unlimited' : Math.max(0, org.maxUsers - userCount),
      },
      pricing: {
        price: limits.price,
        priceLabel: limits.priceLabel,
        period: limits.period,
      },
      organisation: {
        name: org.name,
        slug: org.slug,
        owner: org.owner,
      },
    },
  });
});

/**
 * POST /api/v1/subscription/select-plan
 * Select or change the organisation's plan.
 * For now: no payment required (demo mode). In production, integrate Stripe here.
 */
export const selectPlan = catchAsync(async (req, res) => {
  const { plan, billingCycle } = req.body;
  
  const validPlans = ['free', 'starter', 'pro', 'business'];
  if (!plan || !validPlans.includes(plan)) {
    throw new AppError(`Invalid plan. Must be one of: ${validPlans.join(', ')}`, 400);
  }

  const org = await Organisation.findById(req.user.organisation);
  if (!org) throw new AppError('Organisation not found.', 404);

  // Only org owner or PM can change plan
  if (
    org.owner?.toString() !== req.user._id.toString() &&
    req.user.role !== 'PM' &&
    req.user.role !== 'SuperAdmin'
  ) {
    throw new AppError('Only the organisation owner or a PM can change the plan.', 403);
  }

  const newLimits = Organisation.getPlanLimits(plan);

  // Validate downgrade is possible
  if (newLimits.maxProjects !== -1) {
    const projectCount = await Project.countDocuments({
      organisation: org._id,
      isDeleted: false,
    });
    if (projectCount > newLimits.maxProjects) {
      throw new AppError(
        `Cannot switch to "${plan}" plan: you have ${projectCount} project(s) but this plan allows only ${newLimits.maxProjects}. Please delete or archive ${projectCount - newLimits.maxProjects} project(s) first.`,
        400
      );
    }
  }

  if (newLimits.maxUsers !== -1) {
    const userCount = await User.countDocuments({
      organisation: org._id,
      isActive: true,
    });
    if (userCount > newLimits.maxUsers) {
      throw new AppError(
        `Cannot switch to "${plan}" plan: you have ${userCount} active user(s) but this plan allows only ${newLimits.maxUsers}. Please deactivate ${userCount - newLimits.maxUsers} user(s) first.`,
        400
      );
    }
  }

  // Apply new plan limits
  if (billingCycle) org.billingCycle = billingCycle;
  org.applyPlanLimits(plan);
  await org.save();

  const updatedLimits = Organisation.getPlanLimits(plan);

  res.json({
    success: true,
    message: `Successfully switched to the "${plan}" plan!`,
    data: {
      plan: org.plan,
      planExpiry: org.planExpiry,
      planSelectedAt: org.planSelectedAt,
      limits: {
        maxProjects: org.maxProjects,
        maxUsers: org.maxUsers,
        maxStorageMB: org.maxStorageMB,
        aiChatsPerDay: updatedLimits.aiChatsPerDay,
      },
    },
  });
});
