const EntranceType = require('../../misc/database/entranceType');
const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can delete entrance types
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can delete entrance types',
                success: false
            })
        }

        // Get the entrance type and event id from request params
        const { eventId, entranceTypeId } = req.params;

        // Find the entrance type in the database
        const entranceType = await EntranceType.findById(entranceTypeId).populate({
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
        if (entranceType.event.creator.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Entrance type does not belong to vendor',
                success: false
            })
        }

        // Delete the entrance type
        await entranceType.remove();

        // Return the entrance type
        res.status(200).json({
            message: `Deleted ${entranceType.title}`,
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