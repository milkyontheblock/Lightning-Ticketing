const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'pending'
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        match: /^[a-zA-Z]+$/,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        match: /^[a-zA-Z]+$/,
    },
    tickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: []
    }],
    total: {
        type: Number,
        required: [true, 'Total is required'],
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema);