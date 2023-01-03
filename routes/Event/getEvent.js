const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Get the event from the database
        const event = await Event.findById(req.params.id);

        // Make sure the event exists
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Send a response
        res.status(200).json({
            message: 'Event found',
            success: true,
            event: event
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}