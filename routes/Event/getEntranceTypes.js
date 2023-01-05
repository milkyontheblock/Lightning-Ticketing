const EntranceType = require('../../misc/database/entranceType');

module.exports = async function (req, res, next) {
    try {  
        // Make sure only vendors can retrieve entrance types
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can retrieve entrance types',
                success: false
            })
        }

        // Find the entrance types in the database and populate the event
        const entranceTypes = await EntranceType.find({ event: req.params.id }).populate({
            path: 'event',
            select: '-entranceTypes'
        });

        // Make sure the entrance types exist
        if (!entranceTypes) {
            return res.status(404).json({
                message: 'Entrance types not found',
                success: false
            })
        }

        // Make sure the entrance types belong to the vendor
        if (entranceTypes[0].event.vendor.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Entrance types not found',
                success: false
            })
        }

        // Return the entrance types
        res.status(200).json({
            message: `Entrance types found`,
            success: true,
            entranceTypes: entranceTypes
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}