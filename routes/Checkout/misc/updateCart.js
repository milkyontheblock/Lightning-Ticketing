const Cart = require('../../../misc/database/cart');
const Ticket = require('../../../misc/database/ticket');
const config = require('../../../config.json');

async function updateCart(id) {
    // Find the cart in the database and 
    // populate the tickets array with the tickets in the database
    const cart = await Cart.findById(id).populate({
        path: 'tickets',
        populate: [
            { path: 'entranceType', select: 'title price -_id' },
            { path: 'event', select: 'title description startDate endDate location -_id' }
        ]
    });
    if (!cart) {
        return { 
            message: 'MISSING_CART', 
            success: false 
        };
    }

    // Find expired tickets in the database and remove them
    const reserveDuration = config.cart.session.maxDuration
    const expiredTickets = cart.tickets.filter(ticket => {
        const timeElapsed = new Date().getTime() - ticket.createdOn.getTime();
        return timeElapsed > reserveDuration;
    });

    // Delete the tickets from the database
    const expiredTicketIds = expiredTickets.map(ticket => ticket._id.toString());
    const purgeExpiredTicketsQuery = await Ticket.deleteMany({ _id: { $in: expiredTicketIds } });
    if (!purgeExpiredTicketsQuery.acknowledged) {
        return { 
            message: 'COULD_NOT_DELETE_TICKETS_FROM_DATABASE', 
            success: false 
        };
    }

    // Remove expired ticket IDs from the cart
    cart.tickets = cart.tickets.filter(ticket => {
        return !expiredTicketIds.includes(ticket._id.toString());
    });

    // Remove ticket IDs from cart if they are not in the database
    const ticketIds = cart.tickets.map(ticket => ticket._id.toString());
    cart.tickets = cart.tickets.filter(ticket => {
        return ticketIds.includes(ticket._id.toString());
    });

    // Update cart timestamp
    cart.updatedOn = new Date();

    // Save the cart to the database
    const saveCartQuery = await cart.save();

    // Return the cart
    return {
        cart: saveCartQuery,
        success: true
    };
}

module.exports = {updateCart};