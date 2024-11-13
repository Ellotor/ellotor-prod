const mongoose = require('mongoose');

// Define the schema for storing user data
const userSchema = new mongoose.Schema({
    tokenNo: { type: String, required: true, unique: true },
    stand: { type: String, default: '' },
    action: { type: String, default: '' },
    name: { type: String, default: '' },
    mobile: { type: String, default: '' },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    paymentMode: { type: String, default: '' },
    securityAmount: { type: Number, default: 0 },
    rideSelections: {
        single: { type: Number, default: 0 },
        double: { type: Number, default: 0 },
        ellotor: { type: Number, default: 0 },
        kids: { type: Number, default: 0 },
        babyride: { type: Number, default: 0 }
    },
    // New fields
    finalBill: { type: Number, default: 0 }, // New field for final bill
    finalPaymentMode: { type: String, default: '' },
    penalty: { type: Number, default: 0 }, // New field for penalty
    comments: { type: String, default: '' } // New field for additional comments
}, { timestamps: true });

// Pre-save hook to generate tokenNo
userSchema.pre('save', async function(next) {
    console.log("Pre-save hook triggered");  // Debugging line
    if (!this.tokenNo) {
        console.log("Generating tokenNo...");  // Debugging line
        const lastUser = await mongoose.model('User').findOne().sort({ createdAt: -1 }).limit(1);
        const lastTokenNo = lastUser ? parseInt(lastUser.tokenNo.slice(1)) : 0;  // Get the last token number
        this.tokenNo = `T${lastTokenNo + 1}`;  // Generate new token number
        console.log("Generated tokenNo:", this.tokenNo);  // Debugging line
        console.log("Last user:", lastUser);
    }

    // Ensure all fields that should be numbers are properly cast from strings
    if (typeof this.securityAmount === 'string') {
        this.securityAmount = parseFloat(this.securityAmount) || 0;  // Cast to number
    }
    if (typeof this.finalBill === 'string') {
        this.finalBill = parseFloat(this.finalBill) || 0;  // Cast to number
    }
    if (typeof this.penalty === 'string') {
        this.penalty = parseFloat(this.penalty) || 0;  // Cast to number
    }

    // Cast numbers inside rideSelections
    for (let key in this.rideSelections) {
        if (typeof this.rideSelections[key] === 'string') {
            this.rideSelections[key] = parseInt(this.rideSelections[key], 10) || 0; // Convert to number
        }
    }

    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
