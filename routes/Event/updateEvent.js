const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can update events
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can update events',
                success: false
            })
        }

        // Get the event data from the request body
        const eventData = req.body;

        // Get the event from the database
        const event = await Event.findById(req.params.id);

        // Make sure the event exists
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Make sure the event belongs to the vendor
        if (event.creator.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Only vendors can update their own events',
                success: false
            })
        }

        // Update the event
        event.title = eventData.title;
        event.description = eventData.description;
        event.location = eventData.location;
        event.startDate = eventData.startDate;
        
        // Store the event in the database
        await event.save();

        // Send a response
        res.status(200).json({
            message: 'Event updated',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}