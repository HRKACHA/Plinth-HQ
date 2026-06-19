import { verifyAccessToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/User.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authenticated. Please log in.', 401));
  }

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('User no longer exists or is deactivated.', 401));
  }

  req.user = user;
  next();
});

export const restrictTo = (...roles) => (req, res, next) => {
  let allowedRoles = [...roles];
  if (allowedRoles.includes('PM') || allowedRoles.includes('SuperAdmin')) {
    allowedRoles.push('admin', 'project_manager', 'owner', 'Owner');
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

export const optionalAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = verifyAccessToken(authHeader.split(' ')[1]);
      req.user = await User.findById(decoded.id);
    } catch {
      // public route — ignore invalid token
    }
  }
  next();
});
