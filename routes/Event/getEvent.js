const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Get the event from the database 
        // and populate with entrance types
        // but remove the entrance types' event property
        const event = await Event.findById(req.params.id).populate({
            path: 'entranceTypes',
            select: '-event'
        });

        // Make sure the event exists
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Return the event
        res.status(200).json({
            message: `Event found`,
            success: true,
            event: event
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}