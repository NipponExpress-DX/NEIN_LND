// Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Import routes
const loginRoutes = require('./src/routes/login');
const trainingMaster = require('./src/routes/training_master');
const planningRoutes = require('./src/routes/planning');
const traineeInfoRoutes = require('./src/routes/Trainee');
const roleRoutes = require('./src/routes/roleRoute');
const ListnesRoutes = require('./src/routes/Listners');
const Reports = require('./src/routes/reports');
const Dashboard = require('./src/routes/dashboard');

// Cron controller
const { sendFeedbackFormEmailTrainee } = require('./src/controllers/planning/shedulermail');

// Create Express app
const app = express();

// Enable CORS
app.use(cors());

// Middleware
app.use(express.json());

// Serve static files from 'public' folder
app.use('', express.static(path.join(__dirname, 'public')));

// Route mapping
app.use('/login', loginRoutes);
app.use('/training-master', trainingMaster);
app.use('/planning-route', planningRoutes);
app.use('/trainee-info', traineeInfoRoutes);
app.use('/roleRoutes', roleRoutes);
app.use('/ListnesRoutes', ListnesRoutes);
app.use('/reports', Reports);
app.use('/dashboard', Dashboard);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production') {
    try {
        const sslOptions = {
            key: fs.readFileSync(process.env.SSL_KEY_PATH),
            cert: fs.readFileSync(process.env.SSL_CERT_PATH),
        };

        https.createServer(sslOptions, app).listen(PORT, () => {
            console.log(`🚀 HTTPS server running in production on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start HTTPS server:', err.message);
        process.exit(1);
    }
} else {
    app.listen(PORT, () => {
        console.log(`🚀 HTTP server running in ${NODE_ENV} mode on port ${PORT}`);
    });
}

// Cron Jobs (Only in production)
if (NODE_ENV === 'production') {
    cron.schedule("10 19 * * *", async () => {
        try {
            console.log("⏰ Running scheduled email task at:", new Date());
            await sendFeedbackFormEmailTrainee();
        } catch (error) {
            console.error("❌ Error in scheduler task:", error);
        }
    });
}
