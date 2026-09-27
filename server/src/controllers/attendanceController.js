import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/ApiError.js';

const today = () => new Date().toISOString().slice(0, 10);

/** GET /api/attendance?date=YYYY-MM-DD — roster for a day (admin/staff) */
export const listAttendance = asyncHandler(async (req, res) => {
  const date = req.query.date || today();
  const staff = await User.find({ role: { $in: ['chef', 'staff'] }, isActive: true })
    .select('name role department')
    .lean();
  const records = await Attendance.find({ date }).lean();
  const rows = staff.map((s) => {
    const rec = records.find((r) => String(r.staff) === String(s._id));
    return {
      staffId: String(s._id),
      name: s.name,
      role: s.role,
      department: s.department,
      status: rec?.status || 'unmarked',
      checkIn: rec?.checkIn || '',
      checkOut: rec?.checkOut || '',
      note: rec?.note || '',
      recordId: rec ? String(rec._id) : null,
    };
  });
  res.json({ success: true, date, rows });
});

/** GET /api/attendance/me — my attendance history */
export const myAttendance = asyncHandler(async (req, res) => {
  const rows = await Attendance.find({ staff: req.user._id }).sort({ date: -1 }).limit(60).lean();
  res.json({ success: true, rows });
});

/** POST /api/attendance — mark one person (admin/staff) */
export const markAttendance = asyncHandler(async (req, res) => {
  const { staffId, date, status, checkIn, checkOut, note } = req.body;
  if (!staffId) throw new ApiError(400, 'staffId is required.');
  if (status && !['present', 'absent', 'leave', 'half-day'].includes(status)) {
    throw new ApiError(400, 'Invalid attendance status.');
  }
  const doc = await Attendance.findOneAndUpdate(
    { staff: staffId, date: date || today() },
    { staff: staffId, date: date || today(), status: status || 'present', checkIn, checkOut, note, markedBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json({ success: true, record: doc });
});
