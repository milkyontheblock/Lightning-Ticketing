const Ticket = require('../../misc/database/ticket');
const config = require('../../config.json')

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(400).json({ message: 'Cart not initialized', success: false });
        }

        // Find expired tickets in the database and remove them
        const reserveDuration = config.cart.session.maxDuration
        const expiredTickets = await Ticket.find({
            _id: { $in: req.cart.tickets },
            status: 'reserved',
            createdOn: { $lt: new Date(new Date().getTime() - reserveDuration) }
        });
        await Ticket.deleteMany({ _id: { $in: expiredTickets.map(ticket => ticket._id) } });

        // Remove expired tickets from the cart
        req.cart.tickets = req.cart.tickets.filter(ticket => !expiredTickets.map(ticket => ticket._id).includes(ticket));

        // Save cart to database
        await req.cart.save();

        // Return the cart
        res.status(200).json({ 
            message: "Updated your cart", 
            success: true,
            cart: req.cart
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
}