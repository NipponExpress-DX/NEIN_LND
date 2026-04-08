const express = require('express');
const router = express.Router(); // Create the router instance

// Import the function from TrainingInformation.js
const {
    getUserAllPlanningDetails
} = require('../controllers/UserView/TrainingInformation');

// Define the route for getting user planning details
router.post('/list', getUserAllPlanningDetails);

module.exports = router; // Export the router
