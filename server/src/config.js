import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Demo mode = no real MongoDB / Razorpay credentials configured.
  // The app runs fully (in-memory Mongo + simulated payments) until keys are added.
  get isDemo() {
    return !process.env.MONGODB_URI || !process.env.MONGODB_URI.trim();
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'symbieat-dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keyIdPublic: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    get enabled() {
      return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
    },
  },
};
