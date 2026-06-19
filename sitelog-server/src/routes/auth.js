import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/auth.js';
import { checkUserLimit } from '../middleware/planEnforcement.js';

const router = Router();

router.post('/register', auth.register);
router.post('/login', auth.login);
router.post('/logout', protect, auth.logout);
router.delete('/me', protect, auth.deleteAccount);
router.post('/refresh', auth.refreshToken);
router.get('/me', protect, auth.getMe);
router.patch('/profile', protect, auth.updateProfile);
router.post('/invite', protect, restrictTo('PM', 'Owner', 'SuperAdmin'), checkUserLimit, auth.inviteUser);
router.get('/users', protect, auth.listOrgUsers);

// ── Email Verification ──
router.get('/check-email', auth.checkEmail);
router.post('/send-verification', protect, auth.sendVerificationEmail);
router.get('/verify-email/:token', auth.verifyEmail);

// ── Google OAuth ──
router.get('/google', auth.googleRedirect);
router.get('/google/callback', auth.googleCallback);

export default router;
