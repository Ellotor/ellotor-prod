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
    try {
        if (this.isModified('password') || this.isNew) {
            // Hash the password only if it has been modified or is new
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(this.password, salt);
            console.log('Hashed password:', hashedPassword);  // Debugging line
            this.password = hashedPassword;
        }
        next();
    } catch (err) {
        next(err);  // Pass any errors to the next middleware
    }
});

// Compare password method
adminSchema.methods.comparePassword = async function(password) {
    try {
        const isMatch = await bcrypt.compare(password, this.password);
        return isMatch;
    } catch (err) {
        console.error("Error comparing password:", err);  // Log the error
        return false;  // Return false to indicate password mismatch
    }
};

module.exports = mongoose.model('Admin', adminSchema);
