const EntranceType = require('../../misc/database/entranceType');
const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {  
        // Make sure only vendors can retrieve entrance types
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can retrieve entrance types',
                success: false
            })
        }

        // Get the event
        const event = await Event.findById(req.params.id)
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Find the entrance types in the database
        const entranceTypes = await EntranceType.find({ event: req.params.id })

        // Make sure the entrance types exist
        if (!entranceTypes) {
            return res.status(404).json({
                message: 'Entrance types not found',
                success: false
            })
        }

        // Return the entrance types
        res.status(200).json({
            message: `Entrance types found for ${event.title}`,
            success: true,
            entranceTypes: entranceTypes,
            event: event
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}