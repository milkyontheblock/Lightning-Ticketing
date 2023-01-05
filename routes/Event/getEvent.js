const Event = require('../../misc/database/event');
const EntranceType = require('../../misc/database/entranceType');

module.exports = async function (req, res, next) {
    try {
        // Get the event from the database 
        // and populate with entrance types
        // but remove the entrance types' event property
        const event = await Event.findById(req.params.id).select(['-creator', '-_id', '-createdOn', '-__v'])

        // Make sure the event exists
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Find the entrance types for the event
        const entranceTypes = await EntranceType.find({event: event._id}).select('-event');

        // Add the entrance types to the event
        event.entranceTypes = [];

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