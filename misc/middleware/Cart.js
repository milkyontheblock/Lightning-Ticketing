const Cart = require('../../misc/database/cart');

module.exports = async function (req, res, next) {
    try {
        // Check if the cart ID is in the request headers
        const cartId = req.headers['x-cart-id'];

        // Find the cart in the database or create a new one
        const cart = cartId
            ? await Cart.findById(cartId)
            : new Cart({
                createdOn: new Date(),
                tickets: []
            });

        // Make sure 'cart' exists (after initialization)
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found', success: false });
        }

        // Add 'cart' to the request body
        req.cart = cart;

        next();
    } catch(err) {
        res.status(500).json({ message: err.message, success: false });
    }
}