const Shop = require('../../misc/database/shop');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can create shops
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can create shops',
                success: false
            })
        }

        // Get the shop data from the request body
        const shopData = req.body;

        // Create a new shop object
        const shop = new Shop({
            name: shopData.name,
            description: shopData.description,
            location: shopData.location,
            vendor: req.user._id,
            events: shopData.events
        });

        // Store the shop in the database
        await shop.save();

        // Send a response
        res.status(201).json({
            message: 'Shop created',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}