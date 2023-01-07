const Ticket = require('../../misc/database/ticket')
const Cart = require('../../misc/database/cart');
const config = require('../../config.json');

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(400).json({ message: 'Cart not initialized', success: false });
        }

        // Get the metadata from the request body
        const { eventId, entranceTypeId, quantity } = req.body;

        // ### Default cart logic ###
        // Find all tickets in your cart that are reserved but not claimed
        // within the reservation time limit
        const reservationPeriod = config.cart.session.maxDuration;
        const tickets = await Ticket.find({ _id: { $in: req.cart.tickets } });
        const expiredTickets = tickets.filter(t => t.createdOn.getTime() + reservationPeriod < Date.now());

        // If there are expired tickets, delete them
        const expiredTicketIds = expiredTickets.map(t => t._id.toString());
        const expiryPurge = await Ticket.deleteMany({ _id: { $in: expiredTicketIds } });
        if (!expiryPurge.acknowledged) {
            return res.status(500).json({ message: 'EXP_PURGE_UNACKNOWLEDGED', success: false });
        }

        // After removing expired tickets, remove them from the cart
        req.cart.tickets = req.cart.tickets.filter(t => !expiredTicketIds.includes(t.toString()));
        await req.cart.save();

        // ### Custom cart logic ###
        // Find the tickets in the cart that match the metadata
        const ticketsToRemove = await Ticket.find({
            _id: { $in: req.cart.tickets },
            event: eventId,
            entranceType: entranceTypeId
        });

        // If there are no tickets to remove, return an error
        if (ticketsToRemove.length === 0) {
            return res.status(400).json({ message: 'NO_TICKETS_TO_REMOVE', success: false });
        }

        // If the quantity to remove is greater than the quantity in the cart
        // just remove the quantity in the cart
        const quantityToRemove = quantity > ticketsToRemove.length ? ticketsToRemove.length : quantity;
        const ticketsToRemoveIds = ticketsToRemove.slice(0, quantityToRemove).map(t => t._id.toString());

        // Remove the tickets from the cart
        req.cart.tickets = req.cart.tickets.filter(t => !ticketsToRemoveIds.includes(t.toString()));
        req.cart.updatedOn = Date.now();
        await req.cart.save();

        // Delete the tickets from the database
        const ticketPurge = await Ticket.deleteMany({ _id: { $in: ticketsToRemoveIds } });
        if (!ticketPurge.acknowledged) {
            return res.status(500).json({ message: 'TICKET_PURGE_UNACKNOWLEDGED', success: false });
        }

        // Get the metadata of the tickets in the cart
        const ticketsWithMetadata = await Ticket.find({ _id: { $in: req.cart.tickets } })
            .select('-_id -__v')
            .populate({
                path: 'entranceType',
                select: '-_id -__v -event -capacity',
            })
            .populate({
                path: 'event',
                select: '-_id -__v -creator -createdOn -maxCapacity',
            });

        // Return the cart
        res.status(200).json({
            message: 'Successfully removed tickets from cart',
            success: true,
            cart: {
                id: req.cart._id,
                tickets: ticketsWithMetadata,
                total: ticketsWithMetadata.reduce((acc, t) => acc + t.entranceType.price.amount, 0),
                updatedOn: req.cart.updatedOn
            }
        });
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
    }
}