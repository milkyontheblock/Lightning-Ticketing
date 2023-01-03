const mongoose = require('mongoose');

// Entrance type schema with name, description, location and products
const entranceTypeSchema = new mongoose.Schema({
    title: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        required: [true, 'Entrance type title is required'],
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: [true, 'Event is required'],
    },
    capacity: {
        type: Number,
        required: [true, 'Entrance type capacity is required'],
    },
    price: {
        currency: {
            type: String,
            enum: ['EUR', 'USD'],
            default: 'EUR',
        },
        amount: {
            type: Number,
            required: [true, 'Entrance type price is required'],
        },
    },
});

module.exports = mongoose.model('EntranceType', entranceTypeSchema);