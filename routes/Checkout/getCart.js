const Ticket = require('../../misc/database/ticket');
const config = require('../../config.json');
const ticket = require('../../misc/database/ticket');

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(400).json({ message: 'Cart not initialized', success: false });
        }

        // Using the ticket IDs in the cart, find the tickets in the database
        const tickets = await Ticket.find({ _id: { $in: req.cart.tickets } })
            .select('entranceType event status createdOn')
            .populate({
                path: 'entranceType',
                select: 'title price -_id'
            })
            .populate({
                path: 'event',
                select: 'title description startDate endDate location -_id'
            });

        // Find expired tickets in the database and remove them
        const reserveDuration = config.cart.session.maxDuration
        const expiredTickets = tickets.filter(ticket => {
            const timeElapsed = new Date().getTime() - ticket.createdOn.getTime();
            return timeElapsed > reserveDuration;
        });
        const expiredTicketIds = expiredTickets.map(ticket => ticket._id.toString());

        // Delete the tickets from the database
        const purgeExpiredTicketsQuery = await Ticket.deleteMany({ _id: { $in: expiredTicketIds } });
        if (!purgeExpiredTicketsQuery.acknowledged) {
            return res.status(500).json({ 
                message: 'Could not delete tickets from database (unacknowledged)', 
                success: false
            });
        } else if (purgeExpiredTicketsQuery.deletedCount !== expiredTickets.length) {
            return res.status(500).json({ 
                message: `Tried to delete ${expiredTicketIds.length} tickets, but removed ${purgeExpiredTicketsQuery.deletedCount}`, 
                success: false 
            });
        }

        // Remove expired tickets from the cart
        req.cart.tickets = req.cart.tickets.filter(ticketId => {
            ticket = ticketId.toString();
            return !expiredTicketIds.includes(ticketId)
        });

        // Save cart to database
        await req.cart.save();

        // Create cart content object
        const cartContent = {
            tickets: req.cart.tickets.map(ticket => {
                return tickets.find(t => t._id.toString() === ticket.toString());
            }),
            total: tickets.reduce((total, ticket) => total + ticket.entranceType.price.amount, 0)
        }

        // Return the cart
        res.status(200).json({ 
            message: "Updated your cart", 
            success: true,
            cart: cartContent
        });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
}