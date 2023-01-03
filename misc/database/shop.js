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
    },
    createdOn: {
        type: Date,
        default: Date.now,
    },
    title: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        required: true,
    },
    description: {
        type: String,
        minlength: 1,
        maxlength: 1000,
        match: /^\S*$/,
        required: false,
    },
});

module.exports = mongoose.model('Shop', shopSchema);