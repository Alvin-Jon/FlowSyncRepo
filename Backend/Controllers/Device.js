const cron = require('node-cron');
const Device = require('../Models/DeviceSchema');
const { getIO, getDeviceMap } = require('../Config/Socket');

// Run every 10 seconds
cron.schedule('*/15 * * * * *', async () => {
  const now = new Date();

  try {
    // Fetch devices where the last update was > 10 seconds ago
    const thresholdTime = new Date(now.getTime() - 10 * 1000);
    const staleDevices = await Device.find({ updatedAt: { $lt: thresholdTime } });

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
