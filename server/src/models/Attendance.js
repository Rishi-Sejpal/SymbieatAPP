import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD
    status: { type: String, enum: ['present', 'absent', 'leave', 'half-day'], default: 'present' },
    checkIn: { type: String, default: '' }, // HH:mm
    checkOut: { type: String, default: '' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
