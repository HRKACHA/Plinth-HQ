import crypto from 'crypto';
import User from '../models/User.js';
import Organisation from '../models/Organisation.js';
import Token from '../models/Token.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function sendTokens(res, user) {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  res.cookie('refreshToken', refreshToken, cookieOptions);
  return accessToken;
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: user.roleLabel,
    phone: user.phone,
    avatar: user.avatar,
    avatarUrl: user.avatarUrl,
    organisation: user.organisation,
    notifPrefs: user.notifPrefs,
    emailVerified: user.emailVerified,
    provider: user.provider,
    lastSeen: user.lastSeen,
    joinedAt: user.joinedAt,
  };
}

// ─────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────
export const register = catchAsync(async (req, res) => {
  const { name, email, password, inviteToken, preferredRole } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.', 400);
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format.', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 400);
  }

  // ── Scenario A: Registration via invite token (new InviteToken model) ──
  if (inviteToken) {
    // First try the new InviteToken model
    const InviteToken = (await import('../models/InviteToken.js')).default;
    const invite = await InviteToken.findOne({
      token: inviteToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (invite) {
      // New invite flow — use role from the InviteToken
      const existing = await User.findOne({ email: invite.email.toLowerCase() });
      if (existing) throw new AppError('Email already registered.', 400);

      const user = await User.create({
        name,
        email: invite.email,
        password,
        role: invite.role,
        roleLabel: invite.roleLabel,
        organisation: invite.organisation,
        provider: 'local',
        isVerified: true,
      });

      // Mark invite as used
      invite.used = true;
      invite.usedAt = new Date();
      await invite.save();

      // Assign to project if applicable
      if (invite.project) {
        const Project = (await import('../models/Project.js')).default;
        await Project.findByIdAndUpdate(invite.project, {
          $addToSet: { team: { user: user._id, role: user.role, invitedBy: invite.invitedBy } }
        });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      await createVerificationToken(user);
      const accessToken = sendTokens(res, user);

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: { user: sanitizeUser(user), accessToken },
      });
    }

    // Fallback: try legacy invite flow (inviteToken stored on User model)
    const invited = await User.findOne({ inviteToken, inviteExpiry: { $gt: Date.now() } });
    if (!invited) throw new AppError('Invalid or expired invite token.', 400);
    invited.name = name;
    invited.password = password;
    invited.inviteToken = undefined;
    invited.inviteExpiry = undefined;
    invited.isActive = true;
    invited.provider = 'local';
    await invited.save();
    const accessTokenLegacy = sendTokens(res, invited);

    await createVerificationToken(invited);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your email.',
      data: { user: sanitizeUser(invited), accessToken: accessTokenLegacy },
    });
  }

  // ── Scenario B: Direct registration (no invite token) ──
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already registered.', 400);

  // Determine role
  const validDirectRoles = ['site_engineer', 'accounts', 'owner', 'project_manager'];
  let role = 'PM'; // Default to PM for org creators (backwards compatible)
  if (preferredRole && validDirectRoles.includes(preferredRole)) {
    role = preferredRole;
  }

  const { ROLE_LABELS } = await import('../models/User.js');

  const org = await Organisation.create({
    name: `${name.split(' ')[0]}'s Company`,
    plan: 'starter',
    maxProjects: 3,
    maxUsers: 5,
    maxStorageMB: 5120,
  });

  const user = await User.create({
    name,
    email,
    password,
    role,
    roleLabel: ROLE_LABELS[role],
    organisation: org._id,
    provider: 'local',
  });

  await Organisation.findByIdAndUpdate(org._id, { owner: user._id });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Create email verification token
  await createVerificationToken(user);

  const accessToken = sendTokens(res, user);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: { user: sanitizeUser(user), accessToken },
  });
});

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password required.', 400);

  const user = await User.findOne({ email }).select('+password');

  if (user && user.provider === 'google' && !user.password) {
    throw new AppError('This account was created via Google. Please click "Continue with Google" to sign in.', 401);
  }

  // Never reveal whether email exists for local users
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Check account lockout
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const waitMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new AppError(`Account is locked. Try again in ${waitMinutes} minute(s).`, 423);
  }

  // Reset failed attempts on successful login
  if (user.failedAttempts > 0) {
    user.failedAttempts = 0;
    user.lockedUntil = undefined;
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const accessToken = sendTokens(res, user);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { user: sanitizeUser(user), accessToken },
  });
});

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────
export const logout = catchAsync(async (req, res) => {
  res.clearCookie('refreshToken', cookieOptions);
  res.json({ success: true, message: 'Logged out.' });
});

// ─────────────────────────────────────────────
// Delete Account
// ─────────────────────────────────────────────
export const deleteAccount = catchAsync(async (req, res) => {
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  // Delete the user record
  await User.findByIdAndDelete(req.user._id);

  // Clear cookie and log out
  res.clearCookie('refreshToken', cookieOptions);

  res.status(200).json({ success: true, message: 'Account permanently deleted.' });
});

// ─────────────────────────────────────────────
// Refresh Token
// ─────────────────────────────────────────────
export const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) throw new AppError('Refresh token missing.', 401);

  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User not found.', 401);

  const accessToken = generateAccessToken(user._id);
  res.json({ success: true, data: { accessToken } });
});

// ─────────────────────────────────────────────
// Get Me / Update Profile / List Users / Invite
// ─────────────────────────────────────────────
export const getMe = catchAsync(async (req, res) => {
  res.json({ success: true, data: { user: sanitizeUser(req.user) } });
});

export const updateProfile = catchAsync(async (req, res) => {
  const { name, phone, notifPrefs } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { ...(name && { name }), ...(phone && { phone }), ...(notifPrefs && { notifPrefs }) },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: { user: sanitizeUser(user) } });
});

export const inviteUser = catchAsync(async (req, res) => {
  const { email, role, name } = req.body;
  if (!email || !role) throw new AppError('Email and role required.', 400);

  // Check if user with this email already exists in the same org
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new AppError('A user with this email already exists.', 400);

  const { v4: uuidv4 } = await import('uuid');
  const token = uuidv4();
  const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);

  const newUser = await User.create({
    email,
    name: name || email.split('@')[0],
    password: uuidv4(),
    role,
    organisation: req.user.organisation,
    inviteToken: token,
    inviteExpiry: expiry,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: 'Team member added successfully.',
    data: {
      user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      inviteLink: `${process.env.FRONTEND_URL}/register?token=${token}`,
    },
  });
});

export const listOrgUsers = catchAsync(async (req, res) => {
  const users = await User.find({ organisation: req.user.organisation })
    .select('name email role avatar avatarUrl phone lastLogin emailVerified provider isActive');
  res.json({ success: true, data: users });
});

// ─────────────────────────────────────────────
// Email Verification
// ─────────────────────────────────────────────

/**
 * Create a verification token and log it to console (in production, send email).
 */
async function createVerificationToken(user) {
  // Delete existing verification tokens for this user
  await Token.deleteMany({ userId: user._id, type: 'email_verification' });

  // Generate token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await Token.create({
    userId: user._id,
    token: hashedToken,
    type: 'email_verification',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${rawToken}`;
  console.log(`[Email Verification] User: ${user.email}`);
  console.log(`[Email Verification] Link: ${verifyUrl}`);

  // In production: send via Nodemailer/SendGrid
  // await sendEmail({ to: user.email, subject: 'Verify your email', html: `<a href="${verifyUrl}">Verify Email</a>` });

  return rawToken;
}

/**
 * GET /auth/check-email — Check if email is available for registration.
 */
export const checkEmail = catchAsync(async (req, res) => {
  const { email } = req.query;
  if (!email) throw new AppError('Email query parameter required.', 400);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({ success: true, data: { available: false, reason: 'Invalid email format' } });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  res.json({
    success: true,
    data: { available: !existing, reason: existing ? 'Email is already registered' : null },
  });
});

/**
 * POST /auth/send-verification — Resend verification email.
 */
export const sendVerificationEmail = catchAsync(async (req, res) => {
  const user = req.user;
  if (user.emailVerified) {
    return res.json({ success: true, message: 'Email is already verified.' });
  }

  await createVerificationToken(user);
  res.json({ success: true, message: 'Verification email sent. Check your console/email.' });
});

/**
 * GET /auth/verify-email/:token — Verify email address.
 */
export const verifyEmail = catchAsync(async (req, res) => {
  const rawToken = req.params.token;
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const tokenDoc = await Token.findOne({
    token: hashedToken,
    type: 'email_verification',
    expiresAt: { $gt: new Date() },
    usedAt: null,
  });

  if (!tokenDoc) {
    // Redirect to frontend with error
    return res.redirect(`${process.env.FRONTEND_URL}/login?verified=expired`);
  }

  // Mark email as verified
  await User.findByIdAndUpdate(tokenDoc.userId, { emailVerified: true });
  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  // Redirect to frontend with success
  res.redirect(`${process.env.FRONTEND_URL}/login?verified=success`);
});

// ─────────────────────────────────────────────
// Google OAuth
// ─────────────────────────────────────────────

/**
 * GET /auth/google — Redirect to Google OAuth consent screen.
 */
export const googleRedirect = catchAsync(async (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback';

  if (!clientId) {
    throw new AppError('Google OAuth is not configured. Set GOOGLE_CLIENT_ID in .env', 500);
  }

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString('hex');
  // Store state in a short-lived cookie
  res.cookie('oauth_state', state, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });

  const { inviteToken } = req.query;
  if (inviteToken) {
    res.cookie('oauth_invite', inviteToken, { httpOnly: true, maxAge: 10 * 60 * 1000, sameSite: 'lax' });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

/**
 * GET /auth/google/callback — Handle Google OAuth callback.
 */
export const googleCallback = catchAsync(async (req, res) => {
  const { code, state } = req.query;
  const savedState = req.cookies?.oauth_state;

  // CSRF protection — validate state
  if (!state || !savedState || state !== savedState) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_csrf`);
  }
  res.clearCookie('oauth_state');

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_denied`);
  }

  const inviteToken = req.cookies?.oauth_invite;
  if (inviteToken) {
    res.clearCookie('oauth_invite');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/v1/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error('[Google OAuth] Token exchange error:', tokenData.error);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_token`);
    }

    // Decode the id_token (JWT) to get user info
    const idToken = tokenData.id_token;
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_no_email`);
    }

    // Find or create user
    const user = await findOrCreateGoogleUser({ googleId, email, name, picture, email_verified, inviteToken });

    // Issue JWT tokens
    const accessToken = sendTokens(res, user);

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Redirect to frontend with access token
    res.redirect(`${process.env.FRONTEND_URL}/login?access_token=${accessToken}&provider=google`);
  } catch (err) {
    console.error('[Google OAuth] Error:', err);
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
});

/**
 * Find or create a user from Google OAuth data.
 * Three cases:
 * 1. Existing user with this googleId → return them
 * 2. Existing user with same email (local) → link googleId
 * 3. New user → create account with provider=google
 */
async function findOrCreateGoogleUser({ googleId, email, name, picture, email_verified, inviteToken }) {
  let user;

  // Case 1: User already linked with this Google ID
  user = await User.findOne({ googleId });
  
  if (!user) {
    // Case 2: Existing user with same email (local signup) — link Google
    user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      user.googleId = googleId;
      user.provider = user.provider === 'local' ? 'local' : 'google';
      user.avatarUrl = user.avatarUrl || picture;
      if (email_verified) user.emailVerified = true;
      await user.save({ validateBeforeSave: false });
    }
  }

  // Process Invite Token if provided
  let invite = null;
  if (inviteToken) {
    const InviteToken = (await import('../models/InviteToken.js')).default;
    invite = await InviteToken.findOne({
      token: inviteToken,
      used: false,
      expiresAt: { $gt: new Date() },
    });
  }

  // If user doesn't exist, create them
  if (!user) {
    if (invite && invite.email.toLowerCase() === email.toLowerCase()) {
      // Create user from invite
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: invite.role,
        roleLabel: invite.roleLabel,
        organisation: invite.organisation,
        provider: 'google',
        googleId,
        avatarUrl: picture,
        emailVerified: !!email_verified,
        isActive: true,
      });
      console.log(`[Google OAuth] New user created via invite: ${email}`);
    } else {
      // Create fresh user with new organisation
      const org = await Organisation.create({
        name: `${(name || email.split('@')[0]).split(' ')[0]}'s Company`,
        plan: 'starter',
        maxProjects: 3,
        maxUsers: 5,
        maxStorageMB: 5120,
      });

      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        role: 'PM',
        organisation: org._id,
        provider: 'google',
        googleId,
        avatarUrl: picture,
        emailVerified: !!email_verified,
      });

      await Organisation.findByIdAndUpdate(org._id, { owner: user._id });
      console.log(`[Google OAuth] New user created: ${email}`);
    }
  }

  // Apply invite if valid and matches email
  if (invite && invite.email.toLowerCase() === email.toLowerCase()) {
    invite.used = true;
    invite.usedAt = new Date();
    await invite.save();

    // Assign to project if applicable
    if (invite.project) {
      const Project = (await import('../models/Project.js')).default;
      await Project.findByIdAndUpdate(invite.project, {
        $addToSet: { team: { user: user._id, role: user.role, invitedBy: invite.invitedBy } }
      });
    }
    
    // Ensure user has the correct role and organisation if they were existing
    if (user.organisation?.toString() !== invite.organisation?.toString() || user.role !== invite.role) {
      user.organisation = invite.organisation;
      user.role = invite.role;
      user.roleLabel = invite.roleLabel;
      await user.save({ validateBeforeSave: false });
    }
  }

  return user;

}
