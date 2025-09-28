const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
        minlength:[8,"Too short password"]
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }
},
    {
        timestamps: true
    }
);

// Hash password before save if modified
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Instance method to compare password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return bcrypt.compare(candidatePassword, userPassword);
};

const userModel = mongoose.model('user', userSchema);

module.exports = userModel;