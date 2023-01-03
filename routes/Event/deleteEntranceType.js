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

        // Find the entrance type in the database
        const entranceType = await EntranceType.findById(req.body.entranceTypeId).populate({
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
                message: 'Entrance type does not belong to vendor',
                success: false
            })
        }

        // Find the event in the database
        const event = await Event.findById(entranceType.event._id);

        // Make sure the event exists
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        const index = event.entranceTypes.indexOf(entranceType._id);
        if (index > -1) {
            event.entranceTypes.splice(index, 1);
        } else {
            return res.status(404).json({
                message: 'Entrance type not found in event',
                success: false
            })
        }

        // Delete the entrance type
        await entranceType.remove();

        // Return the entrance type
        res.status(200).json({
            message: `Entrance type deleted for ${entranceType.title}`,
            success: true,
            entranceType: entranceType
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}