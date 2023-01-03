const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can create events
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can create events',
                success: false
            })
        }

        // Get the event data from the request body
        const eventData = req.body;

        // Create a new event object
        const event = new Event({
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            date: eventData.date,
            vendor: req.user._id,
            entranceTypes: eventData.entranceTypes
        });

        // Store the event in the database
        await event.save();

        // Send a response
        res.status(201).json({
            message: 'Event created',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}