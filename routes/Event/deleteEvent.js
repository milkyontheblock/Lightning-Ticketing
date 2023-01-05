const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can delete events
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can delete events',
                success: false
            })
        }

        // Get the event from the database that belongs to the vendor
        const event = await Event.findOne({ _id: req.params.id, vendor: req.user._id });

        // Make sure the event exists
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Delete the event
        await event.remove();

        // Send a response
        res.status(200).json({
            message: 'Event deleted',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}