import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';
import { notifyUser } from '../services/notificationService.js';

const signToken = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

const sanitize = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  studentId: u.studentId,
  phone: u.phone,
});

const cookieOptions = {
  httpOnly: true,
  secure: config.env === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, studentId, department, phone } = req.body;
  if (!name || !email || !password) throw new ApiError(400, 'Name, email and password are required.');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'An account with this email already exists.');

  const user = await User.create({
    name,
    email,
    password,
    studentId,
    department,
    phone,
    role: 'student', // public registration is always student; staff/chef/admin are created by admins
  });

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  notifyUser(String(user._id), {
    title: `Welcome to SymbiEat, ${user.name.split(' ')[0]}!`,
    body: 'Browse today\u2019s menu and place your first order.',
    type: 'system',
    link: '/menu',
  });

  res.status(201).json({ success: true, token, user: sanitize(user) });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new ApiError(400, 'Email and password are required.');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email or password.');
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated. Contact the canteen office.');

  const token = signToken(user);
  res.cookie('token', token, cookieOptions);
  res.json({ success: true, token, user: sanitize(user) });
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitize(req.user) });
});

/** PUT /api/auth/profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'department', 'phone'];
  const updates = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  if (req.body.newPassword) {
    const { currentPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect.');
    }
    user.password = req.body.newPassword;
    await user.save();
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, user: sanitize(user) });
});
