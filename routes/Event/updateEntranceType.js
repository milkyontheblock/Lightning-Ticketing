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

        // Get the entrance type data from the request body
        const entranceTypeData = req.body;

        // Make sure the entrance type exists
        const entranceType = await EntranceType.findById(entranceTypeData.entranceTypeId).populate({
            path: 'event',
            select: '-entranceTypes' // Don't return the entrance types
        })
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

        // Update the entrance type
        entranceType.name = entranceTypeData.name;
        entranceType.description = entranceTypeData.description;
        entranceType.price = entranceTypeData.price;

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