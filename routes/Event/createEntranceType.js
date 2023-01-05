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

        // Get the event id from the request params
        const eventId = req.params.id;

        // Make sure the event exists
        const event = await Event.findById(eventId)
        if (!event) {
            return res.status(404).json({
                message: 'Event not found',
                success: false
            })
        }

        // Make sure the event belongs to the vendor
        if (event.creator.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'This event does not belong to you',
                success: false
            })
        }

        // Make sure the event has not started yet
        if (event.date < Date.now()) {
            return res.status(401).json({
                message: 'This event has already started',
                success: false
            })
        }

        // Make sure the title is not chosen yet
        const entranceTypeExists = await EntranceType.findOne({ title: entranceTypeData.title, event: eventId });
        if (entranceTypeExists) {
            return res.status(400).json({
                message: `Entrance type with title '${entranceTypeData.title}' already exists`,
                success: false
            })
        }

        // Create a new entrance type object
        const entranceType = new EntranceType({
            title: entranceTypeData.title,
            event: eventId,
            capacity: entranceTypeData.capacity,
            price: {
                amount: entranceTypeData.price.amount,
                currency: entranceTypeData.price.currency
            },
        });

        // Store the entrance type in the database
        await entranceType.save();

        // Return the entrance type
        res.status(200).json({
            message: `Entrance type created for ${event.title}`,
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