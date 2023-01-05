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

        // Check if the chosen title is already taken by the vendor
        const existingEvent = await Event.findOne({ title: eventData.title, creator: req.user._id });
        if (existingEvent) {
            return res.status(400).json({
                message: 'To prevent confusion, you can\'t have two events with the same title',
                success: false
            });
        }

        // Create a new event object
        const event = new Event({
            title: eventData.title,
            description: eventData.description,
            location: eventData.location,
            startDate: eventData.startDate,
            maxCapacity: eventData.maxCapacity,
            creator: req.user._id,
            entranceTypes: eventData.entranceTypes
        });

        // Store the event in the database
        await event.save();

        // Send a response
        res.status(201).json({
            message: `Event ${event.title} created`,
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            success: false,  
            message: err.message 
        });
    }
}