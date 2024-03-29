const Ticket = require('../../misc/database/ticket');
const config = require('../../config.json');

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(400).json({ message: 'Cart not initialized', success: false });
        }

        // ### Default cart logic ###
        // Find all tickets in your cart that are reserved but not claimed
        // within the reservation time limit
        const reservationPeriod = config.cart.session.maxDuration;
        const tickets = await Ticket.find({ _id: { $in: req.cart.tickets } });
        const expiredTickets = tickets.filter(t => t.createdOn.getTime() + reservationPeriod < Date.now());

        // If there are expired tickets, delete them
        if (expiredTickets.length > 0) {
            const expiredTicketIds = expiredTickets.map(t => t._id.toString());
            const expiryPurge = await Ticket.deleteMany({ _id: { $in: expiredTicketIds } });
            if (!expiryPurge.acknowledged) {
                return res.status(500).json({ message: 'Failed to delete expired tickets', success: false });
            }
    
            // After removing expired tickets, remove them from the cart
            req.cart.tickets = req.cart.tickets.filter(t => !expiredTicketIds.includes(t.toString()));
            req.cart.updatedOn = Date.now();
            await req.cart.save();
        }

        // ### Custom cart logic ###
        // Create an array of tickets with metadata
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
            message: 'Cart retrieved successfully',
            success: true, 
            cart: {
                id: req.cart._id,
                tickets: ticketsWithMetadata.map(t => {
                    // Calculate and add how long until a ticket expires
                    t = t.toObject();
                    t.expiresIn = reservationPeriod - (Date.now() - t.createdOn.getTime());
                    return t;
                }),
                total: ticketsWithMetadata.reduce((acc, t) => acc + t.entranceType.price.amount, 0),
                updatedOn: req.cart.updatedOn,
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.stack, success: false });
    }
}