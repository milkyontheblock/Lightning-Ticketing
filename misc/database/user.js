const mongoose = require('mongoose');

// User schema with email and password but personal information is not required
const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['customer', 'vendor', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active'],
        default: 'active'
    },
    email: {
        type: String,
        minlength: 3,
        maxlength: 100,
        match: /^\S*$/,
        required: true,
        unique: true
    },
    password: {
        type: String,
        minlength: 8,
        maxlength: 100,
        match: /^\S*$/,
        required: true
    },
    firstName: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        required: true,
    },
    lastName: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        required: true,
    },
    zipCode: {
        type: String,
        required: false,
        default: null
    },
    houseNumber: {
        type: String,
        required: false,
        default: null
    },
});

module.exports = mongoose.model('User', userSchema);