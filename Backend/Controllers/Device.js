const cron = require('node-cron');
const Device = require('../Models/DeviceSchema');
const { getIO, getDeviceMap } = require('../Config/Socket');
const WaterHistory = require('../Models/WaterHistory');

// Run every 10 seconds
cron.schedule('*/15 * * * * *', async () => {
  const now = new Date();

  try {
    // Fetch devices where the last update was > 10 seconds ago
    const thresholdTime = new Date(now.getTime() - 15 * 1000);
   const staleDevices = await Device.find({
        updatedAt: { $lt: thresholdTime },
        'SensorData.NetworkSensor.description': { 
            $nin: ['Wifi not connected', null] 
        }
        });


    if (staleDevices.length > 0) {
      console.log(`🔄 Resetting ${staleDevices.length} stale device(s)`);

      for (const device of staleDevices) {
        device.SensorData = {
          TankLevelSensor: [{ description: '24KHz Ultrasonic', active: false }],
          FlowSensor: [{ description: '0.0/min', active: false }],
          NetworkSensor: [{ description: 'Wifi not connected', active: false }],
          LeakSensor: [{ description: 'No Leaks', active: false }],
        };
        await device.save();

        const io = getIO();
        const deviceSocketMap = getDeviceMap();
        const socketId = deviceSocketMap.get(device.nameId);

       //inform the frontend 
       io.to(socketId).emit("Esp32-offline");
      }
    }
  } catch (error) {
    console.error('❌ Error resetting sensor data:', error);
  }
});



// Daily at midnight
cron.schedule('0 0 * * *', async () => {
    try {
      const devices = await Device.find({});
      const now = new Date();
      for (const device of devices) {
        const waterHistoryRecord = await WaterHistory.findOne({ deviceId: device._id });
        if (!waterHistoryRecord) continue;
        // Create a new log entry for the day with 0 usage
        waterHistoryRecord.logs.push({
          day: now,
          usage: 0,
        });
        await waterHistoryRecord.save();
      }
    } catch (error) {
        console.error('❌ Error during daily tasks:', error);
    }
})
