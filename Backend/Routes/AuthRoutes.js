const express = require('express');
const router = express.Router();
const passport = require('../Config/PassportConfig');
require('dotenv').config();
const bcrypt = require('bcrypt');
const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');
const WaterHistory = require('../Models/WaterHistory');
const {sendEmail} = require('../Services/AlertServices');
const { getUserState } = require('../Services/State');


// Login route
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
  
    if (err) return res.status(500).json({ message: 'Internal server error' });
    if (!user) return res.status(401).json({ message: info.message || 'Unauthorized' });

    req.logIn(user, async (loginErr) => {
      if (loginErr) return res.status(500).json({ message: 'Login failed' });
      const Details = await getUserState(user._id);
      res.json({ message: 'Login successful', user: { id: user._id, Username: user.Username }, Details });
    });
  })(req, res, next);
});

// Logout route
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.json({ message: 'Logout successful' });
  });
});


// Registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, deviceId } = req.body;
    if (!username || !email || !password || !deviceId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (not saved yet)
    const newUser = new User({
      Username: username,
      Password: hashedPassword,
      Email: email,
    });

    // Initialize water history for the device
    const day = new Date();
    const newWaterHistory = new WaterHistory({
      //deviceId: newDevice._id,
      logs: [{ day: day, usage: 0 }],
    });

    // Create device linked to the new user
    const newDevice = new Device({
      nameId: deviceId,
      accountLinkedTo: newUser._id,
      paired: true,
      history: newWaterHistory._id,
    });

    // Cross-link references
    newUser.registeredDevices = newDevice._id;
    newWaterHistory.deviceId = newDevice._id;
    newDevice.status.history = newWaterHistory._id;

    // Save both (device first ensures reference consistency)
   await Promise.all([
      newWaterHistory.save(),
      newDevice.save(),
      newUser.save(),
    ]);

    res.status(201).json({ message: 'Successfully registered' });
    sendEmail(email, 'Registration Successful', `Hello ${username},\n\nYour registration was successful! Welcome to Flowsync.\n\nBest regards,\nFlowsync Team`);
  } catch (err) {
    console.error(err);
    res.status(err.code === 11000 ? 400 : 500).json({
      message: err.code === 11000 ? 'User Email already exists' : 'Registration failed',
      error: err.message,
    });
  }
});



// CHECK AUTHENTICATION STATUS
router.get('/check-isAuthenticated', async (req, res) => {
  try {
    if (req.isAuthenticated()) {
      const { _id: id, Username } = req.user;
      const Details = await getUserState(id); 
      return res.status(200).json({
        isAuthenticated: true,
        user: { id, Username },
        Details,
      });
    }
    res.status(401).json({ isAuthenticated: false });
  } catch (error) {
    console.error('Error in check-isAuthenticated:', error);
    res.status(500).json({ isAuthenticated: false, error: 'Failed to fetch user ' });
  }
});


router.post('/send-email-registered', (req, res) => {
    console.log('sending email.......')
})


const deleteAllWaterLogs = async () => {
  try {
    await WaterHistory.updateMany({}, { $set: { logs: [] } }); 
    console.log('All water history logs deleted successfully.');
  } catch (error) {
    console.error('Error deleting water history logs:', error);
  }
};

deleteAllWaterLogs();


module.exports = router;