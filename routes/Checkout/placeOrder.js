const Ticket = require('../../misc/database/ticket')
const config = require('../../config.json')
const Order = require('../../misc/database/order')
const { log } = require('../../misc/utility')

module.exports = async function (req, res, next) {
    const documents = {
        createdOrder: null,
        designatedTickets: null
    }

    // Revert the order creation if the process fails
    async function revertOrderCreation() {
        try {
            if (documents.createdOrder) {
                const deletedOrder = await Order.deleteOne({ _id: documents.createdOrder._id });
                if (!deletedOrder.acknowledged) {
                    return false
                }
                log(`Deleted order ${documents.createdOrder._id}`, 'REVERT')
                return true
            } else {
                log(`No order to revert`, 'REVERT')
                return false
            }
        } catch(err) {
            log(err.message, 'REVERT')
            return false
        }
    }

    // Set the tickets' status back to 'reserved'
    // and add them back to the cart
    async function revertTicketReservation() {
        try {
            if (documents.designatedTickets) {
                const ticketIds = documents.designatedTickets;
                const updatedTickets = await Ticket.updateMany({ _id: { $in: ticketIds } }, { $set: { status: 'reserved' } });
                if (!updatedTickets.acknowledged) {
                    return false
                }
                log(`Updated ${updatedTickets.modifiedCount} tickets' status back to 'reserved'`, 'REVERT')
                for (const ticketId of ticketIds) {
                    if (!req.cart.tickets.includes(ticketId)) {
                        req.cart.tickets.push(ticketId);
                    }
                }
                req.cart.updatedOn = Date.now();
                await req.cart.save();
                log(`Added ${updatedTickets.modifiedCount} tickets back to the cart`, 'REVERT')
                return true
            } else {
                log(`No tickets to revert`, 'REVERT')
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

        // Make sure all required fields are present
        const requiredFields = ['email', 'firstName', 'lastName', 'phone']
        const missingFields = requiredFields.filter(f => !req.body[f]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'MISSING_FIELDS',
                success: false,
                missingFields: missingFields
            });
        }

        // ### Default cart logic ###
        // Find all orders that are pending and not paid within the payment time limit
        const paymentPeriod = config.order.session.maxDuration;
        const orders = await Order.find({ status: 'pending' });
        const expiredOrders = orders.filter(o => o.createdAt.getTime() + paymentPeriod < Date.now());

        // If there are expired orders, create an array of their ticket IDs
        if (expiredOrders.length > 0) {
            const expiredOrderTicketIds = expiredOrders.map(o => o.tickets.map(t => t.toString())).flat();

            // If there are expired orders, delete them
            const orderPurge = await Order.deleteMany({ _id: { $in: expiredOrders.map(o => o._id) } });
            if (!orderPurge.acknowledged) {
                return res.status(500).json({
                    message: 'Oops, failed to delete expired orders',
                    success: false
                });
            }
            log(`Deleted ${orderPurge.deletedCount} expired orders`, 'CHECKOUT')
    
            // After removing expired orders, delete their tickets
            const ticketPurge = await Ticket.deleteMany({ _id: { $in: expiredOrderTicketIds } });
            if (!ticketPurge.acknowledged) {
                return res.status(500).json({
                    message: 'Oops, failed to delete tickets that belong to expired orders',
                    success: false,
                });
            }
            log(`Deleted ${ticketPurge.deletedCount} expired tickets`, 'CHECKOUT')
        }

        // Find all tickets in your cart that are reserved but not claimed
        // within the reservation time limit
        const reservationPeriod = config.cart.session.maxDuration;
        const tickets = await Ticket.find({ _id: { $in: req.cart.tickets } });
        const expiredTickets = tickets.filter(t => t.createdOn.getTime() + reservationPeriod < Date.now());

        // If there are expired tickets, delete them
        const expiredTicketIds = expiredTickets.map(t => t._id.toString());
        const expiryPurge = await Ticket.deleteMany({ _id: { $in: expiredTicketIds } });
        if (!expiryPurge.acknowledged) {
            return res.status(500).json({ message: 'Failed to delete expired tickets', success: false });
        }
        log(`Deleted ${expiryPurge.deletedCount} expired tickets`, 'CHECKOUT')

        // After removing expired tickets, remove them from the cart
        req.cart.tickets = req.cart.tickets.filter(t => !expiredTicketIds.includes(t.toString()));
        req.cart.updatedOn = Date.now();
        await req.cart.save();
        log(`Updated cart with ${req.cart.tickets.length} tickets`, 'CHECKOUT')

        // ### Custom cart logic ###
        // Block the client from placing an order if there were expired tickets 
        if (expiryPurge.deletedCount > 0) {
            const message = expiryPurge.deletedCount > 1 
                ? `Oops, ${expiryPurge.deletedCount} tickets have expired. Please try again.`
                : 'Oops, one of your tickets has expired. Please try again.';
            return res.status(400).json({ 
                message: message,
                success: false,
                cart: req.cart,
                expiredTickets: expiredTickets
            });
        }

        // Make sure the cart is not empty
        if (req.cart.tickets.length === 0) {
            return res.status(400).json({
                message: 'Cannot place an order with an empty cart',
                success: false,
                cart: req.cart
            });
        }

        // Claim all tickets in the cart
        const claimedTickets = await Ticket.updateMany({ _id: { $in: req.cart.tickets } }, { status: 'claimed' });
        if (!claimedTickets.acknowledged) {
            return res.status(500).json({ message: 'Failed to claim tickets', success: false });
        }
        documents.designatedTickets = req.cart.tickets.map(t => t.toString());
        log(`Claimed ${claimedTickets.modifiedCount} tickets`, 'CHECKOUT')
        
        // Calculate the total price of the order
        const currentCart = await Ticket.find({ _id: { $in: req.cart.tickets } }).populate({
            path: 'entranceType',
            populate: { path: 'price' }
        });
        const total = currentCart.reduce((acc, t) => acc + t.entranceType.price.amount, 0);

        // Create a new order
        const order = new Order({
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: req.body.phone,
            tickets: req.cart.tickets,
            total: total
        });
        documents.createdOrder = order;
        await order.save();
        log(`Created order ${order._id}`, 'CHECKOUT')

        // Clear the cart
        req.cart.tickets = [];
        req.cart.updatedOn = Date.now();
        await req.cart.save();
        
        res.status(201).json({ 
            message: 'Order created successfully',
            success: true,
            continueUrl: '/checkout/confirm',
            order: order,
            cart: req.cart,
        });
    } catch(err) {
        res.status(500).json({ message: err.stack, success: false });
        revertOrderCreation();
        revertTicketReservation();
    }
}