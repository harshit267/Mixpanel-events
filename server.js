const express = require('express');
const path = require('path');
require('dotenv').config();

const pageevent = require('./Routes/eventpage');
const mixpanelRoutes = require('./Routes/mixpanelRoutes');
const linkEventsRoutes = require('./Routes/linkEventsRoutes');





const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
 

// Static Files
app.use(express.static('public'));
app.use(express.json());

// Routes
app.use('/', pageevent);
app.use('/api', mixpanelRoutes);
app.use('/api', linkEventsRoutes);

// Home Page Route
app.get('/', (req, res) => {
    res.render('home');
});

// Start Server
const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
