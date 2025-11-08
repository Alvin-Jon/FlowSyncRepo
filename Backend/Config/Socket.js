// Config/SocketService.js
const { Server } = require("socket.io");
const {corsOptions} = require('./CorsConfig');
const {settingsUpdate, automationStatusUpdate, waterPumpStatusUpdate, watersupplyStatusUpdate} = require('../Services/Updates');

let io; // shared socket instance
let deviceSocketMap = new Map(); // deviceId -> socket.id

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`⚡ Client connected: ${socket.id}`);

    socket.on("register-device", (deviceId) => {
      deviceSocketMap.set(deviceId, socket.id);
      socket.deviceId = deviceId;
      console.log(`✅ Device registered: ${deviceId}`);
    });

    

    // app events
    socket.on("update-automation-status", async ({ deviceId, newStatus }) => {
      try {
        const updatedStatus = await automationStatusUpdate(deviceId, newStatus);
        io.to(socket.id).emit("automation-status-updated", updatedStatus);
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
        const updatedStatus = await waterPumpStatusUpdate(deviceId, pumpStatus, autoStatus);
        io.to(socket.id).emit("pump-status-updated", updatedStatus);
        console.log(`🔄 Pump status updated for device: ${deviceId}`);
      }
        catch (error) {
        console.error("Error updating pump status:", error);
      }
    });

    socket.on("update-supply-status", async ({ deviceId, supplyStatus }) => {
      try {
        const updatedStatus = await watersupplyStatusUpdate(deviceId, supplyStatus);
        io.to(socket.id).emit("supply-status-updated", updatedStatus);
        console.log(`🔄 Supply status updated for device: ${deviceId}`);
      }
        catch (error) {
        console.error("Error updating supply status:", error);
      }
    });

    // esp32 events


    socket.on("disconnect", () => {
      if (socket.deviceId) {
        deviceSocketMap.delete(socket.deviceId);
        console.log(`❌ Device disconnected: ${socket.deviceId}`);
      }
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
