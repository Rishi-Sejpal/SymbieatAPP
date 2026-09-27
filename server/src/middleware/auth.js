import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7)
      : req.cookies?.token || null;

    if (!token) throw new ApiError(401, 'Not authenticated. Please log in.');

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (e) {
      if (e.name === 'TokenExpiredError') throw new ApiError(401, 'Session expired. Please log in again.');
      throw new ApiError(401, 'Invalid authentication token.');
    }

    const user = await User.findById(decoded.sub || decoded.id);
    if (!user || !user.isActive) throw new ApiError(401, 'Account not found or deactivated.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Restrict a route to specific roles, e.g. authorize('admin', 'chef') */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated.'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
