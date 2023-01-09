// Create a database schema for an event
const mongoose = require('mongoose');

// Event schema with name, description, location and products
const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        minlength: 1,
        maxlength: 100,
        required: [true, 'Event title is required'],
    },
    description: {
        type: String,
        minlength: 1,
        maxlength: 1000,
        default: null,
    },
    startDate: {
        type: Date,
        required: [true, 'Event start date is required'],
    },
    endDate: {
        type: Date,
        required: false,
        default: null,
    },
    location: {
        type: String,
        minlength: 1,
        maxlength: 100,
        default: null,
    },
    maxCapacity: {
        type: Number,
        default: null,
    },
    referralProgram: {
        refundPercentage: {
            type: Number,
            default: 0,
        },
        requiredReferrals: {
            type: Number,
            default: 0,
        },
        maxClaimPeriod: {
            type: Number,
            default: 0,
        }
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Event creator is required'],
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Event', eventSchema);