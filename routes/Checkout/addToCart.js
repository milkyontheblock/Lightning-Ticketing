const EntranceType = require('../../misc/database/entranceType');
const Event = require('../../misc/database/event');
const Ticket = require('../../misc/database/ticket');
const Order = require('../../misc/database/order');
const config = require('../../config.json');
const {log} = require('../../misc/utility');

module.exports = async function (req, res, next) {
    // Create a document object to store the created ticket IDs
    const documents = {
        createdTicketIds: null
    }

    // Revert the ticket creation if the add to cart process fails
    async function revertTicketCreation() {
        try {
            if (documents.createdTicketIds) {
                const deletedTickets = await Ticket.deleteMany({ _id: { $in: documents.createdTicketIds } });
                if (!deletedTickets.acknowledged) {
                    return false
                }
                log(`Deleted ${documents.createdTicketIds.length} tickets`, 'REVERT');
                return true
            } else {
                return false
            }
        } catch(err) {
            log(err.message, 'REVERT')
            return false
        }
    }
    
    // Revert the cart addition if the add to cart process fails
    async function revertCreatedTicketCartAddition() {
        try {
            if (documents.createdTicketIds) {
                req.cart.tickets = req.cart.tickets.filter(t => !documents.createdTicketIds.map(t => t.toString()).includes(t.toString()));
                req.cart.updatedOn = Date.now();
                await req.cart.save();
                log(`Updated cart after removing created tickets`, `REVERT`)
                return true
            } else {
                return false
            }
        } catch(err) {
            log(err.message, 'REVERT')
            return false
        }
    }

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
        // Find all orders that are pending and not paid within the payment time limit
        const paymentPeriod = config.order.session.maxDuration;
        const orders = await Order.find({ status: 'pending' });
        const expiredOrders = orders.filter(o => o.createdAt.getTime() + paymentPeriod < Date.now());

        // If there are expired orders, create an array of their ticket IDs
        const expiredOrderTicketIds = expiredOrders.map(o => o.tickets.map(t => t.toString())).flat();

        // If there are expired orders, delete them
        if (expiredOrders.length > 0) {
            const orderPurge = await Order.deleteMany({ _id: { $in: expiredOrders.map(o => o._id) } });
            if (!orderPurge.acknowledged) {
                return res.status(500).json({
                    message: 'Oops, failed to delete expired orders',
                    success: false
                });
            }
            log(`Deleted ${expiredOrders.length} expired orders`, 'CHECKOUT');

            // After removing expired orders, delete their tickets
            const ticketPurge = await Ticket.deleteMany({ _id: { $in: expiredOrderTicketIds } });
            if (!ticketPurge.acknowledged) {
                return res.status(500).json({
                    message: 'Oops, failed to delete tickets that belong to expired orders',
                    success: false,
                });
            }
            log(`Deleted ${expiredOrderTicketIds.length} tickets that belong to expired orders`, 'CHECKOUT');
        }

        // Find all tickets that are reserved but not claimed
        // within the reservation time limit
        const reservationPeriod = config.cart.session.maxDuration;
        const tickets = await Ticket.find({entranceType: req.body.entranceTypeId});
        const expiredTickets = tickets.filter(t => t.createdOn.getTime() + reservationPeriod < Date.now());

        // If there are expired tickets, delete them
        if (expiredTickets.length > 0) {
            const expiryPurge = await Ticket.deleteMany({ _id: { $in: expiredTickets.map(t => t._id) } });
            if (!expiryPurge.acknowledged) {
                return res.status(500).json({ 
                    message: 'Oops, failed to delete expired tickets', 
                    success: false
                });
            }
            log(`Deleted ${expiredTickets.length} expired tickets`, 'CHECKOUT');
    
            // After removing expired tickets, remove them from the cart
            req.cart.tickets = req.cart.tickets.filter(t => !expiredTickets.map(t => t._id.toString()).includes(t.toString()));
            req.cart.updatedOn = Date.now();
            await req.cart.save();
            log(`Updated cart after removing expired tickets`, `CHECKOUT`)
        }

        // ### Add to cart logic ###
        // Make sure there is enough space to create the quantity of tickets requested
        const maxCapacity = entranceType.capacity;
        const unavailableSpace = tickets.length - expiredTickets.length;
        log(`Max capacity: ${maxCapacity}, Unavailable space: ${unavailableSpace}`, 'CHECKOUT')
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
        documents.createdTicketIds = createdTickets.map(t => t._id.toString());
        log(`Created ${newTickets.length} tickets`, 'CHECKOUT');

        // Create a new array of ticket IDs
        const newTicketIds = createdTickets.map(t => t._id.toString());
        
        // Add the tickets to the cart
        req.cart.tickets.push([...newTicketIds]);

        // Update the cart timestamp
        req.cart.updatedOn = Date.now();

        // Save the cart
        await req.cart.save();

        // Get the tickets with metadata
        const ticketsWithMetadata = await Ticket.find({ _id: { $in: req.cart.tickets.map(t => t.toString()) } })
            .select('-_id -__v')
            .populate({
                path: 'entranceType',
                select: '-_id -__v -event -capacity',
            })
            .populate({
                path: 'event',
                select: '-_id -__v -creator -createdOn -maxCapacity',
            })

        // Return the cart
        res.status(200).json({
            message: 'Successfully added to cart',
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
                updatedOn: req.cart.updatedOn
            }
        });
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
        revertTicketCreation();
        revertCreatedTicketCartAddition();
    }
};