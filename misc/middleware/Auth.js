const User = require('../../misc/database/user');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

module.exports = async function (req, res, next) {
    try {
        // Get token from request header
        const token = req.header('Authorization').replace('Bearer ', '');

        // Get public key from file
        const publicKey = fs.readFileSync(path.join(__dirname, '../../misc/certificate/public.pem'), 'utf8');

        // Verify token using public key
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        // Find user in database
        const user = await User.findOne({ _id: decoded.id });

        // Check if user exists
        if (!user) {
            throw new Error('User not found');
        }

        // Store user and token in request object
        req.user = user;

        // Continue to next middleware
        next();
    } catch(err) {
        res.status(500).json({ message: err.message });
    }
}