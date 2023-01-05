const User = require('../../misc/database/user')
const bcrypt = require('bcrypt');

module.exports = async function (req, res, next) {
    try {
        // Get email and password from request body
        const emailAddress = req.body.email;
        const password = req.body.password;

        // Check if email and password are provided
        if (!emailAddress || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
                success: false
            })
        }

        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user object
        const user = new User({ 
            role: 'vendor',
            status: 'active',
            email: emailAddress,
            password: hashedPassword,
            firstName: req.body.firstname,
            lastName: req.body.lastname,
            zipCode: req.body.zipcode,
            houseNumber: req.body.houseNumber
        });

        // Store the user in the database
        await user.save();

        // Send a response
        res.status(201).json({
            message: 'User created',
            success: true
        });
    } catch(err) {
        res.status(500).json({ 
            succes: false,  
            message: err.message 
        });
    }
}