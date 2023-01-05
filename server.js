require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Connect to MongoDB
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Check if connected to MongoDB
const db = mongoose.connection;
db.on('error', (error) => console.log(error));
db.once('open', () => console.log('Connected to MongoDB'));

// Import Routes
app.post('/auth/v1/login', require('./routes/Auth/login'));
app.post('/auth/v1/register', require('./routes/Auth/register'));
app.post('/shop/v1/create', require('./misc/middleware/Auth'), require('./routes/Shop/createShop'));
app.get('/shop/v1/:id', require('./routes/Shop/getShop'));
app.patch('/shop/v1/:id', require('./misc/middleware/Auth'), require('./routes/Shop/updateShop'));
app.delete('/shop/v1/:id', require('./misc/middleware/Auth'), require('./routes/Shop/deleteShop'));

// Routes
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});