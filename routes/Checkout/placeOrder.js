const Ticket = require('../../misc/database/ticket')
const config = require('../../config.json')
const Order = require('../../misc/database/order')

module.exports = async function (req, res, next) {
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
        const expiredOrderTicketIds = expiredOrders.map(o => o.tickets.map(t => t.toString())).flat();
        console.log({ expiredOrderTicketIds })

        // If there are expired orders, delete them
        const orderPurge = await Order.deleteMany({ _id: { $in: expiredOrders.map(o => o._id) } });
        if (!orderPurge.acknowledged) {
            return res.status(500).json({
                message: 'Oops, failed to delete expired orders',
                success: false
            });
        }

        // After removing expired orders, delete their tickets
        const ticketPurge = await Ticket.deleteMany({ _id: { $in: expiredOrderTicketIds } });
        if (!ticketPurge.acknowledged) {
            return res.status(500).json({
                message: 'Oops, failed to delete tickets that belong to expired orders',
                success: false,
            });
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

        // After removing expired tickets, remove them from the cart
        req.cart.tickets = req.cart.tickets.filter(t => !expiredTicketIds.includes(t.toString()));
        req.cart.updatedOn = Date.now();
        await req.cart.save();

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
        await order.save();

        // Clear the cart
        req.cart.tickets = [];
        req.cart.updatedOn = Date.now();
        await req.cart.save();
        
        res.status(201).json({ 
            message: 'Order created successfully',
            success: true,
            order: order,
            cart: req.cart,
            continueUrl: '/checkout/confirm'
        });
    } catch(err) {
        res.status(500).json({ message: err.stack, success: false });
    }
}