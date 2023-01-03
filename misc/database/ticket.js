// Create a database schema for a ticket

const mongoose = require('mongoose');

// Ticket schema that can be owned by a user or contain personal information
const ticketSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['reserved', 'claimed', 'cancelled'],
        default: 'reserved',
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required'],
    },
    entranceType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EntranceType',
        required: [true, 'Entrance type is required'],
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    },
    personalInformation: {
        firstName: {
            type: String,
            minlength: 1,
            maxlength: 100,
            match: /^\S*$/,
            required: false,
            default: null,
        },
        lastName: {
            type: String,
            minlength: 1,
            maxlength: 100,
            match: /^\S*$/,
            required: false,
            default: null,
        },
        email: {
            type: String,
            minlength: 3,
            maxlength: 100,
            match: /^\S*$/,
            required: false,
            default: null,
        },
        phone: {
            type: String,
            minlength: 3,
            maxlength: 100,
            required: false,
            default: null,
        },
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Ticket', ticketSchema);