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

        // Request body
        const { eventId, entranceTypeId } = req.params;

        // Find the entrance type in the database and populate the event
        // but only select the title, description, and price
        const entranceType = await EntranceType.findById(entranceTypeId)
            .select('-_id -__v')
            .populate({
                path: 'event',
                select: '-_id -maxCapacity -__v -createdOn -creator'
            })


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