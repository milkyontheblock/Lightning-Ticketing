const EntranceType = require('../../misc/database/entranceType');
const Event = require('../../misc/database/event');
const Ticket = require('../../misc/database/ticket');
const config = require('../../config.json');

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(500).json({ 
                message: 'Oops, there seems to be a problem with your cart', 
                success: false
            });
        }

        // Request body should contain the entrance type ID & event ID
        const payload = req.body;
        if (!payload.entranceTypeId || !payload.eventId) {
            return res.status(400).json({
                message: 'Please provide the entrance type ID and event ID',
                success: false
            });
        }

        // Make sure the entrance type exists
        const entranceType = await EntranceType.findById(payload.entranceTypeId).populate('event');
        if (!entranceType) {
            return res.status(400).json({
                message: 'The entrance type does not exist',
                success: false
            });
        }

        // Make sure the event exists
        const event = await Event.findById(payload.eventId);
        if (!event) {
            return res.status(400).json({
                message: 'The event does not exist',
                success: false
            });
        }

        // ### Default cart logic ###
        // Find all tickets that are reserved but not claimed
        // within the reservation time limit
        const reservationPeriod = config.cart.session.maxDuration;
        const tickets = await Ticket.find({entranceType: req.body.entranceTypeId});
        const expiredTickets = tickets.filter(t => t.createdOn.getTime() + reservationPeriod < Date.now());

        // If there are expired tickets, delete them
        const expiryPurge = await Ticket.deleteMany({ _id: { $in: expiredTickets.map(t => t._id) } });
        if (!expiryPurge.acknowledged) {
            return res.status(500).json({ 
                message: 'Oops, failed to delete expired tickets', 
                success: false
            });
        }

        // After removing expired tickets, remove them from the cart
        req.cart.tickets = req.cart.tickets.filter(t => !expiredTickets.map(t => t._id.toString()).includes(t.toString()));
        await req.cart.save();

        // ### Add to cart logic ###
        // Make sure there is enough space to create the quantity of tickets requested
        const maxCapacity = entranceType.capacity;
        const unavailableSpace = tickets.length - expiredTickets.length;
        const availableSpace = maxCapacity - unavailableSpace;
        if (availableSpace < payload.quantity) {
            return res.status(400).json({
                message: `Not enough space to add your tickets. There are ${availableSpace} available`,
                success: false
            });
        }

        // Create the tickets
        const newTickets = [];
        for (let i = 0; i < payload.quantity; i++) {
            newTickets.push(new Ticket({
                entranceType: payload.entranceTypeId,
                event: payload.eventId
            }));
        }
        const createdTickets = await Ticket.insertMany(newTickets);

        // Create a new array of ticket IDs
        const newTicketIds = createdTickets.map(t => t._id.toString());
        
        // Add the tickets to the cart
        req.cart.tickets.push([...newTicketIds]);
        await req.cart.save();

        // Return the cart
        res.status(200).json({
            message: 'Successfully added to cart',
            success: true,
            cart: req.cart
        });
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
    }
};