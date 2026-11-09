const mongoose = require("mongoose");

const trainRideSchema = new mongoose.Schema({
    rideNo: {
        type: Number,
        required: true,
        unique: true
    },
    totalSeats: {
        type: Number,
        default: 0
    },
    bookedSeats: {
        type: Number,
        default: 0
    },
    passengers: [{
        passengerName: { type: String, required: true },
        mobile: { type: String, required: true },
        tickets: { type: Number, required: true },
        amount: { type: Number, required: true },
        bookedAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ["Open", "Started", "Completed"],
        default: "Open"
    },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null }
}, {
    timestamps: true
});

module.exports = mongoose.model("TrainRide", trainRideSchema);
