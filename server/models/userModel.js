const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'name required'],
    },
    slug: {
      type: String,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'email required'],
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
    },
    profileImage: String,
    password: {
      type: String,
      required: [true, 'password required'],
      minlength: [8, 'Too short password'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetCode: String,
    passwordResetExpires: Date,
    passwordResetVerified: Boolean,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Stamp passwordChangedAt when the password changes (not on initial creation)
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // subtract 1s to ensure the token is created after the change timestamp
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Hide soft-deleted (deactivated) users from all find queries
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance method to compare password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;
