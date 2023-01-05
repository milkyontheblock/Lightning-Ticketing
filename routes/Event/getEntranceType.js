const EntranceType = require('../../misc/database/entranceType');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can retrieve their entrance types
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can retrieve their entrance types',
                success: false
            })
        }

        // Find the entrance type in the database and populate the event
        const entranceType = await EntranceType.findById(req.params.id).populate({
            path: 'event',
            select: '-entranceTypes'
        });

        // Make sure the entrance type exists
        if (!entranceType) {
            return res.status(404).json({
                message: 'Entrance type not found',
                success: false
            })
        }

        // Make sure the entrance type belongs to the vendor
        if (entranceType.event.vendor.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Entrance type not found',
                success: false
            })
        }

        // Return the entrance type
        res.status(200).json({
            message: `Entrance type found`,
            success: true,
            entranceType: entranceType
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}