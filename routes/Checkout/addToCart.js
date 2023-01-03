const Cart = require('../../misc/database/cart');
const EntranceType = require('../../misc/database/entranceType');
const Ticket = require('../../misc/database/ticket');
const config = require('../../config.json')

module.exports = async function (req, res, next) {
    try {
        // Add-to-cart metadata
        const addToCartMetaData = req.body;

        // Initialize cart
        // - If cartId is provided, get cart from database
        // - If cartId is not provided, create new cart
        const cart = req.body.cartId
            ? await Cart.findById(req.body.cartId)
            : new Cart({
                createdOn: new Date(),
                tickets: []
            });

        // Make sure 'cart' exists (after initialization)
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found', success: false });
        }

        // Get entrance type
        const entranceType = await EntranceType.findById(addToCartMetaData.entranceTypeId).populate('event')
        if (!entranceType) {
            return res.status(404).json({ message: 'Entrance type not found', success: false });
        }

        // Check the entrance type capacity
        const maxCapacity = entranceType.capacity;
        const mintedTickets = await Ticket.find({ entranceType: entranceType._id });
        if (mintedTickets.length >= maxCapacity) {  
            return res.status(400).json({ message: 'Entrance type is sold out', success: false });
        }

        // Find tickets that are reserved but not claimed within 8 minutes
        const unclaimedTickets = mintedTickets.filter(ticket => {
            return ticket.status === 'reserved' && ticket.createdOn.getTime() + 8 * 60 * 1000 > new Date().getTime()
        });

        // Remove those tickets from the database
        await Ticket.deleteMany({ _id: { $in: unclaimedTickets.map(ticket => ticket._id) } });

        // Check if there are enough tickets left
        const ticketsLeft = maxCapacity - mintedTickets.length + unclaimedTickets.length;
        if (ticketsLeft < addToCartMetaData.quantity) {
            return res.status(400).json({ message: 'Not enough tickets left', success: false });
        }

        // Create tickets
        const tickets = [];
        for (let i = 0; i < addToCartMetaData.quantity; i++) {
            tickets.push(new Ticket({
                event: entranceType.event._id,
                entranceType: entranceType._id,
                personalInformation: addToCartMetaData.personalInformation,
            }));
        }

        // Save tickets to database
        await Ticket.insertMany(tickets);

        // Add tickets to cart
        cart.tickets.push(...tickets.map(ticket => ticket._id));

        // Save cart to database
        await cart.save();

        // Return cart
        res.status(200).json({ cart, success: true });
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
    }
};