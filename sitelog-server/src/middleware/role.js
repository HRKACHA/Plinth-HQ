/**
 * Role-based access control middleware.
 * Usage: requireRole('admin', 'project_manager')
 *
 * Must be used AFTER the protect/auth middleware so req.user is set.
 * Supports both new roles (site_engineer, project_manager, etc.)
 * and legacy roles (PM, SuperAdmin, etc.) via mapping.
 */

const LEGACY_ROLE_MAP = {
  SuperAdmin: 'admin',
  PM: 'project_manager',
  Engineer: 'site_engineer',
  Owner: 'owner',
  Labour: 'site_engineer',
  Accounts: 'accounts',
};

export const requireRole = (...allowedRoles) => (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) {
    return res.status(403).json({ success: false, message: 'Access denied. No role assigned.' });
  }

  // Check direct match first
  if (allowedRoles.includes(userRole)) return next();

  // Check legacy role mapping
  const mappedRole = LEGACY_ROLE_MAP[userRole];
  if (mappedRole && allowedRoles.includes(mappedRole)) return next();

  return res.status(403).json({
    success: false,
    message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
  });
};

export default requireRole;
