const mongoose = require('mongoose');

// Cart schema that can hold tickets
const cartSchema = new mongoose.Schema({
    tickets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        default: [],
    }],
    createdOn: {
        type: Date,
        default: Date.now,
    },
    updatedOn: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Cart', cartSchema);