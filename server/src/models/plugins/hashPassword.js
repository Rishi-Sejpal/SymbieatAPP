import bcrypt from 'bcryptjs';

export default function addPasswordMethods(schema) {
  schema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  schema.methods.comparePassword = function comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  };
}
