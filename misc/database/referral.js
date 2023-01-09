const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
    createdOn: { 
        type: Date, 
        default: Date.now 
    },
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        unique: true,
        required: true
    },
    orders: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: []
    }],
});

module.exports = mongoose.model('Referral', referralSchema);