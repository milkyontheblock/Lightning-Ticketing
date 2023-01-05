const EntranceType = require('../../misc/database/entranceType');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can update entrance types
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can update entrance types',
                success: false
            })
        }

        // Get the entrance type data from the request params
        const { eventId, entranceTypeId } = req.params;

        // Get the entrance type data from the request body
        const entranceTypeData = req.body;

        // Make sure the entrance type exists
        const entranceType = await EntranceType.findById(entranceTypeId).populate({
            path: 'event',
            select: '-entranceTypes'
        });
        if (!entranceType) {
            return res.status(404).json({
                message: 'Entrance type not found',
                success: false
            })
        }

        // Only the vendor that created the event can update the entrance type
        if (entranceType.event.creator.toString() !== req.user.id) {
            return res.status(401).json({
                message: 'Only the vendor that created the event can update the entrance type',
                success: false
            })
        }

        // Update the entrance type
        entranceType.price = {
            currency: entranceTypeData.price.currency,
            amount: entranceTypeData.price.amount
        }

        // Store the entrance type in the database
        await entranceType.save();

        // Return the entrance type
        res.status(200).json({
            message: `Entrance type updated for ${entranceType.title}`,
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