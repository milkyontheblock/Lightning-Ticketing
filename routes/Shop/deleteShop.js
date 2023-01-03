const Shop = require('../../misc/database/shop');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can delete shops
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can delete shops',
                success: false
            })
        }

        // Find the shop in the database
        const shop = await Shop.findById(req.params.id);

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
                message: 'You are not allowed to delete this shop',
                success: false
            })
        }

        // Delete the shop from the database
        await shop.remove();

        // Send a response
        res.status(200).json({
            message: 'Shop deleted',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}