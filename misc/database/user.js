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
        required: [true, 'Email is required'],
        unique: [true, 'Email already exists']
    },
    password: {
        type: String,
        minlength: 8,
        maxlength: 100,
        match: /^\S*$/,
        required: [true, 'Password is required']
    },
    firstName: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        required: [true, 'First name is required'],
    },
    lastName: {
        type: String,
        minlength: 1,
        maxlength: 100,
        match: /^\S*$/,
        required: [true, 'Last name is required'],
    },
    zipCode: {
        type: String,
        default: null
    },
    houseNumber: {
        type: String,
        default: null
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);