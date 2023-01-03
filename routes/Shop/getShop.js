const Shop = require('../../misc/database/shop');

module.exports = async function (req, res, next) {
    try {
        // Find the shop in the database but join 
        // the events to the result and populate the events 
        // with entrance types
        const shop = await Shop.findById(req.params.id)
            .populate({ 
                path: 'events', 
                populate: { path: 'entranceTypes' } 
            });

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
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}