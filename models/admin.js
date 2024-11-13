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

// Compare password method
adminSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
