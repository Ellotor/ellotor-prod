const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define Admin schema
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    firstTimeLogin: {
        type: Boolean,
        default: true // Default is true, meaning first login requires password change
    }
});

// Pre-save hook to hash password before saving (if password is being changed)
adminSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        try {
            // Hash the password only if it has been modified or is new
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (err) {
            next(err);
        }
    }
    next();
});

// Compare password method
adminSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
