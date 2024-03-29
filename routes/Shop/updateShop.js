const Shop = require('../../misc/database/shop');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can update shops
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can update shops',
                success: false
            })
        }

        // Get the shop data from the request body
        const shopData = req.body;
        console.log(shopData)

        // Get the shop from the database
        const shop = await Shop.findById(req.params.id);

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

        // Update the shop
        if (shopData.title) shop.title = shopData.title;
        if (shopData.description) shop.description = shopData.description;
        if (shopData.location) shop.location = shopData.location;

        // Store the shop in the database
        await shop.save();

        // Send a response
        res.status(200).json({
            message: 'Shop updated',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}