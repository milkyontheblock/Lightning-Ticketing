const Cart = require('../../misc/database/cart');
const EntranceType = require('../../misc/database/entranceType');
const Ticket = require('../../misc/database/ticket');
const config = require('../../config.json')

module.exports = async function (req, res, next) {
    try {
        // Check if cart exists on the request body
        if (!req.cart) {
            return res.status(500).json({ 
                message: 'Oops, there seems to be a problem with your cart', 
                success: false
            });
        }

        // Get the metadata from the request body
        const addToCartMetaData = req.body;

        // Remove tickets from cart if they are not in the database anymore
        const cartTickets = await Ticket.find({ _id: { $in: req.cart.tickets } });
        const cartTicketIds = cartTickets.map(ticket => ticket._id.toString());
        req.cart.tickets = req.cart.tickets.filter(ticketId => {
            ticketId = ticketId.toString();
            return cartTicketIds.includes(ticketId);
        });

        // Get entrance type
        const entranceType = await EntranceType.findById(addToCartMetaData.entranceTypeId).populate('event')
        if (!entranceType) {
            return res.status(404).json({ 
                message: 'Sorry, we could not find the entrance type you are looking for',
                success: false 
            });
        }

        // Find all tickets 
        const mintedTickets = await Ticket.find({ entranceType: entranceType._id });

        // Find all unclaimed tickets and delete them
        const reserveDuration = config.cart.session.maxDuration;
        const unclaimedTickets = mintedTickets.filter(ticket => ticket.createdOn.getTime() + reserveDuration < new Date().getTime());
        await Ticket.deleteMany({ _id: { $in: unclaimedTickets.map(ticket => ticket._id) } });

        // Make sure there are enough tickets left
        const maxCapacity = entranceType.capacity;
        if (mintedTickets.length >= maxCapacity) {  
            return res.status(400).json({ 
                message: 'Sorry, there are no tickets left for this entrance type', 
                success: false 
            });
        }
            
        // Check if there is enough space to add the tickets to the cart
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
            }));
        }

        // Save tickets to database
        const createTickets = await Ticket.insertMany(tickets);
        const addedTickets = createTickets.map(addedTicket => {
            return {
                event: addedTicket.event,
                entranceType: addedTicket.entranceType,
            };
        });

        // Add tickets to cart
        req.cart.tickets.push(...tickets.map(ticket => ticket._id));

        // Save cart to database
        await req.cart.save();

        // Create an array of tickets with the ticketId in the cart
        const cartTicketsV2 = await Ticket.find({ _id: { $in: req.cart.tickets } })
            .populate({
                path: 'entranceType',
                select: 'title price',
            })
            .populate({
                path: 'event',
                select: 'title',
            });

        // Return cart
        res.status(200).json({
            message: `Added ${addToCartMetaData.quantity} ticket(s) to cart`,
            success: true,
            cart: {
                id: req.cart._id,
                currentCart: cartTicketsV2,
                addedTickets: addedTickets,
                unfilteredCart: req.cart.tickets,
                total: req.cart.tickets.length,
                expiresOn: new Date(reserveDuration + new Date().getTime()) 
            }
        });
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
    }
};