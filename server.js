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

// Import Middleware
const auth = require('./misc/middleware/Auth');

// Import Routes
app.post('/auth/v1/login', require('./routes/Auth/login'));
app.post('/auth/v1/register', require('./routes/Auth/register'));
app.post('/shop/v1/create', auth, require('./routes/Shop/createShop'));
app.get('/shop/v1/:id', require('./routes/Shop/getShop'));
app.get('/shops/v1', auth, require('./routes/Shop/getShops'));
app.patch('/shop/v1/:id', auth, require('./routes/Shop/updateShop'));
app.delete('/shop/v1/:id', auth, require('./routes/Shop/deleteShop'));
app.post('/event/v1/create', auth, require('./routes/Event/createEvent'));
app.get('/event/v1/:id', require('./routes/Event/getEvent'));
app.patch('/event/v1/:id', auth, require('./routes/Event/updateEvent'));
app.delete('/event/v1/:id', auth, require('./routes/Event/deleteEvent'));
app.get('/events/v1', auth, require('./routes/Event/getEvents'));

// Routes
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});