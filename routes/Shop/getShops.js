const Shop = require('../../misc/database/shop');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can retrieve shops
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can retrieve shops',
                success: false
            })
        }

        // Get the shops from the database that belong to the vendor
        const shops = await Shop.find({ creator: req.user._id })
            .select(['-creator', '-__v', '-_id'])
            .populate('events')

        // Send a response
        res.status(200).json({
            message: 'Retrieved shops you own',
            success: true,
            shops: shops
        });
    } catch(err) {
        res.status(500).json({
            success: false,  
            message: err.message 
        });
    }
}