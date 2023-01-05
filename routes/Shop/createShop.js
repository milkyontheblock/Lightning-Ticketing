const Shop = require('../../misc/database/shop');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can create shops
        console.log(req.user)
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
            title: shopData.title,
            description: shopData.description,
            location: shopData.location,
            creator: req.user._id
        });

        // Store the shop in the database
        await shop.save();

        // Send a response
        res.status(201).json({
            message: 'Shop created',
            success: true,
            id: shop._id
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}