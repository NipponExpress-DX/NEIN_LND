const express = require('express');
const router = express.Router();

// Import with proper error handling
let loginController;
try {
  loginController = require('../controllers/login/loginController');
  
  // Verify all required methods exist
const requiredMethods = ['getAllData', 'activeEmplList', 'activeEmplList1', 'activeEmplListTrainees'];
  requiredMethods.forEach(method => {
    if (!loginController[method]) {
      throw new Error(`Controller method ${method} is not defined in loginController`);
    }
  });
} catch (err) {
  console.error('Controller import error:', err.message);
  process.exit(1);
}

// Enhanced logging middleware
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Body:', req.body);
  next();
});

// Routes  login through login to web page L&D page
router.post('/getAllData', async (req, res, next) => {
  try {
    await loginController.getAllData(req, res);
  } catch (err) {
    next(err);
  }
});

// Routes login through login to NEIN-DX home page L&D page
router.post('/getAllData01', async (req, res, next) => {
  try {
    await loginController.getAllData01(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/activeEmplList', async (req, res, next) => {
  try {
    await loginController.activeEmplList(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/activeEmplList1', async (req, res, next) => {
  try {
    await loginController.activeEmplList1(req, res);
  } catch (err) {
    next(err);
  }
});
router.post('/activeEmplListTrainees', async (req, res, next) => {
  try {
    await loginController.activeEmplListTrainees(req, res);
  } catch (err) {
    next(err);
  }
});

router.post('/logAudit', async (req, res, next) => {
  try {
    await loginController.Log_Audit(req, res);
  } catch (err) {
    next(err);
  }
});



module.exports = router;