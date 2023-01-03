const EntranceType = require('../../misc/database/entranceType');

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
                message: 'Entrance type does not belong to vendor',
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