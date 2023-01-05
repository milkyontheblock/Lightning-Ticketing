const Shop = require('../../misc/database/shop');
const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can remove shops
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can remove shops',
                success: false
            })
        }

        // Get the shop from the database
        const shop = await Shop.findById(req.body.shopId);

        // Make sure the shop exists
        if (!shop) {
            return res.status(404).json({
                message: 'Shop not found',
                success: false
            })
        }

        // Make sure the shop belongs to the vendor
        if (shop.vendor.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Shop does not belong to vendor',
                success: false
            })
        }

        // Pop event from events array in shop
        const index = shop.events.indexOf(req.body.eventId);
        if (index > -1) {
            shop.events.splice(index, 1);
        } else {
            return res.status(404).json({
                message: 'Event not found in shop',
                success: false
            })
        }

        // Store the shop in the database
        await shop.save();

        // Return the shop
        res.status(200).json({
            message: 'Event removed from shop',
            success: true,
            shop: shop
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}