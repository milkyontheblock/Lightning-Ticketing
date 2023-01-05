const Shop = require('../../misc/database/shop');
const Event = require('../../misc/database/event');
const EntranceType = require('../../misc/database/entranceType');

module.exports = async function (req, res, next) {
    try {
        // Get shop ID from the request parameters
        const shopId = req.params.id;

        // Find the shop in the database but join 
        // the events to the result and populate the events 
        // with entrance types
        const shop = await Shop.findById(shopId)
            .select(['-_id', '-createdOn', '-__v'])
            .populate({ 
                path: 'events', 
                populate: { path: 'entranceTypes' } 
            })

        // Make sure the shop exists
        if (!shop) {
            return res.status(404).json({
                message: 'Shop not found',
                success: false
            })
        }

        // Send a response
        res.status(200).json({
            message: 'Shop found',
            success: true,
            shop: shop
        });
    } catch(err) {
        console.log(err.stack)
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}