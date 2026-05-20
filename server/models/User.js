const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  type: { type: String, default: 'home' },
  firstName: String,
  lastName: String,
  phone: String,
  email: String,
  address: String,
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pincode: String,
  zipCode: String,
  country: { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: ['user', 'staff', 'admin'], default: 'user' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  emailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'active' },
  lastLogin: { type: Date },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  otp: { type: String, select: false },
  otpExpire: { type: Date, select: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.compareOtp = async function (enteredOtp) {
  if (!this.otp) return false;
  return await bcrypt.compare(enteredOtp, this.otp);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
