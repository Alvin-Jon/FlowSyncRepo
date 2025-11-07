const express = require('express');
const router = express.Router();
const { getDeviceState } = require('../Services/State');
const {esp32StatusUpdate, esp32SensorDataUpdate} = require('../Services/Updates');
const { getIO, getDeviceMap } = require('../Config/Socket');

// 🧩 Get device data
router.post('/data', async (req, res) => {
  const { deviceId } = req.body;

  if (!deviceId) return res.status(400).json({ message: 'Device ID is required' });

  try {
    const deviceStatus = await getDeviceState(deviceId);
    res.json({ message: 'Device status fetched successfully', deviceStatus });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ⚡ Update device status
router.post('/status-update', async (req, res) => {
  const { deviceId, status } = req.body;
  console.log('Status update received:', { deviceId, status });
  
  if (!deviceId || !status) {
    console.log('Missing deviceId or status');
    return res.status(400).json({ message: 'Device ID and status are required' });
  }

  try {
    const io = getIO();
    const deviceSocketMap = getDeviceMap();
    const socketId = deviceSocketMap.get(deviceId);

    const updatedStatus = await esp32StatusUpdate(deviceId, status);
    console.log('Status updated successfully:', updatedStatus);

    if (socketId) {
      io.to(socketId).emit("update-device-details", updatedStatus);
      console.log(`✅ Status sent to ${deviceId}`);
    } else {
      console.warn(`⚠️ Device ${deviceId} not connected`);
    }

    res.json({ message: 'Status updated successfully', status: updatedStatus });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// 🌡 Update sensor data
router.post('/sensor-data-update', async (req, res) => {
  const { deviceId, sensorData } = req.body;
  if (!deviceId || !sensorData)
    return res.status(400).json({ message: 'Device ID and sensor data are required' });

  try {
    const io = getIO();
    const deviceSocketMap = getDeviceMap();
    const socketId = deviceSocketMap.get(deviceId);

    const updatedSensorData = await esp32SensorDataUpdate(deviceId, sensorData);

    if (socketId) {
      io.to(socketId).emit("update-device-details", updatedSensorData);
      console.log(`✅ Sensor data sent to ${deviceId}`);
    } else {
      console.warn(`⚠️ Device ${deviceId} not connected`);
    }

    res.json({ message: 'Sensor data updated successfully', sensorData: updatedSensorData });
  } catch (error) {
    console.error('Error updating sensor data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
