const Ticket = require('../../misc/database/ticket')
const Cart = require('../../misc/database/cart');
const { updateCart } = require('./misc/updateCart');

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(400).json({ message: 'Cart not initialized', success: false });
        }

        // Get the metadata from the request body
        const { eventId, entranceTypeId, quantity } = req.body;

        // Update the cart before making any changes
        const cartUpdateProcess = await updateCart(req.cart._id);
        if (!cartUpdateProcess.success) {
            return res.status(500).json({ message: cartUpdateProcess.message, success: false });
        }

        // Using the ticket IDs in the cart, find the tickets in the database
        const tickets = await Ticket.find({ _id: { $in: req.cart.tickets } });

        // Create an array of tickets to remove
        const ticketsToRemove = tickets.filter(ticket => {
            return ticket.event == eventId && ticket.entranceType == entranceTypeId
        }).slice(0, quantity);

        // Delete the tickets from the database
        const ticketIdsToRemove = ticketsToRemove.map(ticket => ticket._id.toString());
        const removeQuery = await Ticket.deleteMany({ _id: { $in: ticketIdsToRemove } });
        if (removeQuery.deletedCount != ticketIdsToRemove.length) {
            return res.status(500).json({ message: 'Could not remove tickets from cart', success: false });
        }

        // Remove the tickets from the cart
        req.cart.tickets = req.cart.tickets.filter(ticketId => {
            ticketId = ticketId.toString();
            return !ticketIdsToRemove.includes(ticketId)
        });

        // Save the cart to the database
        const updatedCart = await req.cart.save();

        res.json({ 
            message: 'Tickets removed from cart',
            success: true,
            cart: updatedCart
        })
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
    }
}