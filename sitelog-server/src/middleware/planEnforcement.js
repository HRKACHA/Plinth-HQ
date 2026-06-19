import Organisation from '../models/Organisation.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';

/**
 * Check if the user's org has room for another project.
 * Attach to POST /projects (create) route.
 */
export const checkProjectLimit = catchAsync(async (req, res, next) => {
  const org = await Organisation.findById(req.user.organisation);
  if (!org) return next(new AppError('Organisation not found.', 404));

  // -1 means unlimited
  if (org.maxProjects === -1) return next();

  const projectCount = await Project.countDocuments({
    organisation: org._id,
    isDeleted: false,
  });

  if (projectCount >= org.maxProjects) {
    return next(
      new AppError(
        `Your "${org.plan}" plan allows a maximum of ${org.maxProjects} project(s). You currently have ${projectCount}. Please upgrade your plan to create more projects.`,
        403
      )
    );
  }

  next();
});

/**
 * Check if the user's org has room for another team member.
 * Attach to invite user / add team member routes.
 */
export const checkUserLimit = catchAsync(async (req, res, next) => {
  const org = await Organisation.findById(req.user.organisation);
  if (!org) return next(new AppError('Organisation not found.', 404));

  if (org.maxUsers === -1) return next();

  const userCount = await User.countDocuments({
    organisation: org._id,
    isActive: true,
  });

  if (userCount >= org.maxUsers) {
    return next(
      new AppError(
        `Your "${org.plan}" plan allows a maximum of ${org.maxUsers} user(s). You currently have ${userCount}. Please upgrade your plan to invite more users.`,
        403
      )
    );
  }

  next();
});

/**
 * Check if the user's subscription plan is still active (not expired).
 * Free plans never expire.
 */
export const checkPlanActive = catchAsync(async (req, res, next) => {
  const org = await Organisation.findById(req.user.organisation);
  if (!org) return next(new AppError('Organisation not found.', 404));

  // Free plan never expires
  if (org.plan === 'free') return next();

  // Check expiry
  if (org.planExpiry && new Date() > org.planExpiry) {
    // Auto-downgrade to free
    org.applyPlanLimits('free');
    await org.save();
    console.log(`[Plan] Auto-downgraded org ${org._id} to free (expired)`);
  }

  next();
});
