// Config/SocketService.js
const { Server } = require("socket.io");
const {corsOptions} = require('./CorsConfig');
const {settingsUpdate, automationStatusUpdate, waterPumpStatusUpdate, watersupplyStatusUpdate} = require('../Services/Updates');
const notifyESP32 = require('../Controllers/Esp32').notifyESP32;
const {sendPumpCommand, sendSupplyCommand, sendAutomationConfig,} = require('./MqttConfig');

let io; // shared socket instance
let deviceSocketMap = new Map(); // deviceId -> socket.id

function initSocket(server) {
  io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    socket.on("register-device", (deviceId) => {
    if (!deviceSocketMap.has(deviceId)) {
      deviceSocketMap.set(deviceId, new Set());
    }

    deviceSocketMap.get(deviceId).add(socket.id);
    socket.deviceId = deviceId;

  console.log(`✅ Device registered: ${deviceId} on socket ${socket.id}`);
});


    

    // app events
    socket.on("update-automation-status", async ({ deviceId, newStatus }) => {
      try {
        const updatedStatus = await automationStatusUpdate(deviceId, newStatus);
        io.to(socket.id).emit("automation-status-updated", updatedStatus);
        const Status = {
          auto_pump : newStatus.autoPump,
           minLevel: newStatus.waterThreshold?.minLevel, 
           maxLevel: newStatus.waterThreshold?.maxLevel
        };
        sendAutomationConfig(deviceId, Status);
        console.log(`🔄 Automation status updated for device: ${deviceId}`);
      } catch (error) {
        console.error("Error updating automation status:", error);
      }
    });

    socket.on("update-settings-status", async ({ userId, newSettings }) => {
      try {
        const updatedSettings = await settingsUpdate(userId, newSettings);
        io.to(socket.id).emit("settings-status-updated", updatedSettings);
        console.log(`🔄 Settings updated for user: ${userId}`);
      } catch (error) {
        console.error("Error updating settings:", error);
      }
    });

    socket.on("update-pump-status", async ({ deviceId, pumpStatus, autoStatus }) => {
  try {
    if(autoStatus === true){
      pumpStatus = true;
    }
    const updatedStatus = await waterPumpStatusUpdate(deviceId, pumpStatus, autoStatus);
    io.to(socket.id).emit("pump-status-updated", updatedStatus);
    notifyESP32(deviceId, { pumpStatus, autoStatus });


    // Automation settings update
    sendAutomationConfig(deviceId, { auto_pump: autoStatus });
    sendPumpCommand(deviceId, pumpStatus);

    console.log(`🔄 Pump status updated for device: ${deviceId}`);
  } catch (error) {
    console.error("Error updating pump status:", error);
  }
});


    socket.on("update-supply-status", async ({ deviceId, supplyStatus }) => {
      try {
        const updatedStatus = await watersupplyStatusUpdate(deviceId, supplyStatus);
        io.to(socket.id).emit("supply-status-updated", updatedStatus);
        notifyESP32(deviceId, { supplyStatus });
        sendSupplyCommand(deviceId, supplyStatus);
        console.log(`🔄 Supply status updated for device: ${deviceId}`);
      }
        catch (error) {
        console.error("Error updating supply status:", error);
      }
    });

    // esp32 events


    socket.on("disconnect", () => {
      const deviceId = socket.deviceId;
      if (deviceId && deviceSocketMap.has(deviceId)) {
        const set = deviceSocketMap.get(deviceId);
        set.delete(socket.id);

        if (set.size === 0) {
          deviceSocketMap.delete(deviceId);
        }
      }

      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Getter function to access io instance anywhere
function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket(server) first!");
  }
  return io;
}

function getDeviceMap() {
  return deviceSocketMap;
}

module.exports = {
  initSocket,
  getIO,
  getDeviceMap,
};
