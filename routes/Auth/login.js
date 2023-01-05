const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../../misc/database/user')
const fs = require('fs');
const path = require('path');

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

        // Find user in database
        const user = await User.findOne({ email: emailAddress });
        if (!user) {
            return res.status(400).json({   
                message: 'User not found',
                success: false
            })
        }

        // Compare password with hashed password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({
                message: 'Invalid password',
                success: false
            })
        }

        // Get private key from file
        const privateKey = fs.readFileSync(path.join(__dirname, '../../misc/certificate/private.pem'), 'utf8');

        // Create a token for user using private key
        const token = jwt.sign({ id: user._id }, privateKey, { algorithm: 'RS256' });

        // Send a response
        res.status(200).json({
            message: 'User logged in',
            success: true,
            token: token
        });
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
}