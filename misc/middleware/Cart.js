const Cart = require('../../misc/database/cart');

module.exports = async function (req, res, next) {
    try {
        // Check if 'cartId' exists in the request body
        // If it does, find the cart in the database
        // If it doesn't, create a new cart
        const cart = req.body.cartId
            ? await Cart.findById(req.body.cartId)
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