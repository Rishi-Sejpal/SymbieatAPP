import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const sanitize = (u) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  role: u.role,
  department: u.department,
  studentId: u.studentId,
  phone: u.phone,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

/** GET /api/users?role=&search= — admin only */
export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role && req.query.role !== 'all') filter.role = req.query.role;
  if (req.query.search) {
    const rx = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { studentId: rx }];
  }
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, users: users.map(sanitize) });
});

/** POST /api/users — create staff/chef/admin accounts */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone, studentId } = req.body;
  if (!name || !email || !password || !role) throw new ApiError(400, 'Name, email, password and role are required.');
  if (!['student', 'staff', 'chef', 'admin'].includes(role)) throw new ApiError(400, 'Invalid role.');
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'A user with this email already exists.');
  const user = await User.create({ name, email, password, role, department, phone, studentId });
  res.status(201).json({ success: true, user: sanitize(user) });
});

/** PATCH /api/users/:id — role change / activate / deactivate */
export const updateUser = asyncHandler(async (req, res) => {
  const { role, isActive, department, phone } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (role) {
    if (!['student', 'staff', 'chef', 'admin'].includes(role)) throw new ApiError(400, 'Invalid role.');
    if (String(user._id) === String(req.user._id) && role !== 'admin') {
      throw new ApiError(400, 'You cannot demote your own admin account.');
    }
    user.role = role;
  }
  if (typeof isActive === 'boolean') {
    if (String(user._id) === String(req.user._id) && !isActive) {
      throw new ApiError(400, 'You cannot deactivate your own account.');
    }
    user.isActive = isActive;
  }
  if (department !== undefined) user.department = department;
  if (phone !== undefined) user.phone = phone;
  await user.save();
  res.json({ success: true, user: sanitize(user) });
});

/** DELETE /api/users/:id */
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new ApiError(400, 'You cannot delete your own account.');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  res.json({ success: true, message: 'User deleted.' });
});

/** GET /api/users/chefs — active chefs for assignment dropdowns */
export const listChefs = asyncHandler(async (_req, res) => {
  const chefs = await User.find({ role: 'chef', isActive: true }).select('name department').lean();
  res.json({ success: true, chefs: chefs.map((c) => ({ id: String(c._id), name: c.name, department: c.department })) });
});
