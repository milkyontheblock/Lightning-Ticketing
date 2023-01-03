const EntranceType = require('../../misc/database/entranceType');
const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {
        // Make sure only vendors can create entrance types
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can create entrance types',
                success: false
            })
        }

        // Get the entrance type data from the request body
        const entranceTypeData = req.body;

        // Make sure the event exists
        const event = await Event.findById(entranceTypeData.eventId);
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Create a new entrance type object
        const entranceType = new EntranceType({
            name: entranceTypeData.name,
            description: entranceTypeData.description,
            price: entranceTypeData.price,
            event: entranceTypeData.eventId
        });

        // Store the entrance type in the database
        await entranceType.save();

        // Add the entrance type to the event
        event.entranceTypes.push(entranceType._id);

        // Store the event in the database
        await event.save();

        // Return the entrance type
        res.status(200).json({
            message: `Entrance type created for ${event.title}`,
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