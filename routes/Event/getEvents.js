const Event = require('../../misc/database/event');

module.exports = async function (req, res, next) {
    try {  
        // Make sure only vendors can retrieve events
        if (req.user.role !== 'vendor') {
            return res.status(401).json({
                message: 'Only vendors can retrieve events',
                success: false
            })
        }

        // Get the events from the database that belong to the vendor
        const events = await Event.find({ vendor: req.user._id });
        
        // Send a response
        res.status(200).json({
            message: 'Events retrieved',
            success: true,
            events: events
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}