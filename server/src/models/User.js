import mongoose from 'mongoose';
import addPasswordMethods from './plugins/hashPassword.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ['student', 'staff', 'chef', 'admin'], default: 'student', index: true },
    department: { type: String, default: '' },
    studentId: { type: String, trim: true, sparse: true },
    phone: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, isActive: 1 });

addPasswordMethods(userSchema);

export default mongoose.model('User', userSchema);
