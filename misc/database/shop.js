// Create a database schema for a shop 
const mongoose = require('mongoose');

// Shop schema with name, description, location and products
const shopSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['open', 'closed', 'deleted', 'pending'],
        default: 'pending',
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
    title: {
        type: String,
        minlength: 1,
        maxlength: 150,
        required: true,
    },
    description: {
        type: String,
        minlength: 1,
        maxlength: 1000,
        required: false,
    },
    location: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        default: null
    },
    events: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    }],
});

module.exports = mongoose.model('Shop', shopSchema);