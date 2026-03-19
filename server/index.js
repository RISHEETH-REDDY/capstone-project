const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const path = require('path'); // Added path module

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/', (req, res) => res.send('API Running')); // Kept original root API route
const apiRoutes = require('./routes/api'); // Defined apiRoutes
app.use('/api', apiRoutes); // Used apiRoutes

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // For any other requests, serve the React app's index.html
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    });
}

// Models (Loading here ensures they are registered if needed implicitly)
require('./models/User');
require('./models/Classroom');
require('./models/Subject');
require('./models/Faculty');
require('./models/Timetable');


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
