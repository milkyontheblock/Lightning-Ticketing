const Shop = require('../../misc/database/shop');
const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can add events to shops
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can add events to shops',
                success: false
            })
        }

        // Get the shop from the database
        const shop = await Shop.findById(req.params.shopId);

        // Make sure the shop exists
        if (!shop) {
            return res.status(404).json({
                message: 'Shop not found',
                success: false
            })
        }

        // Make sure the shop belongs to the vendor
        if (shop.creator.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Shop does not belong to vendor',
                success: false
            })
        }

        // Get the event from the database
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Make sure the event belongs to the vendor
        if (event.creator.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Event does not belong to vendor',
                success: false
            })
        }

        // Add the event to the shop but make sure it's not already added
        if (!shop.events.includes(event._id)) {
            shop.events.push(event._id);
        } else {
            return res.status(400).json({
                message: 'Event already added to shop',
                success: false
            })
        }

        // Save the shop in the database
        await shop.save();

        // Send a response
        res.status(200).json({
            message: 'Event added to shop',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}