const WebSocket = require('ws');
const Device = require('../Models/DeviceSchema');

class WebSocketService {
  constructor() {
    if (WebSocketService.instance) return WebSocketService.instance;
    this.wss = null;
    this.esp32SocketMap = new Map();
    this.pingIntervals = new Map(); // Store ping intervals for each connection
    WebSocketService.instance = this;
  }

  static getInstance() {
    if (!WebSocketService.instance) WebSocketService.instance = new WebSocketService();
    return WebSocketService.instance;
  }

  init(server, path = "/ws") {
    if (this.wss) return this.wss;

    this.wss = new WebSocket.Server({ noServer: true, path });
    console.log(`✅ Native WS server running on ${path}`);

    this.wss.on("connection", (ws) => {
      console.log("🔌 ESP32 connected (waiting for registration...)");
      
      // Set up ping/pong for connection health
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
        console.log(`💓 Received pong from ${ws.deviceId || 'unregistered device'}`);
      });

      // Start pinging this connection every 30 seconds
      const pingInterval = setInterval(() => {
        if (ws.isAlive === false) {
          console.log(`❌ Connection dead for ${ws.deviceId || 'unregistered device'}, terminating`);
          this.handleDisconnect(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      }, 30000);
      
      this.pingIntervals.set(ws, pingInterval);

      ws.on("message", async (data) => {
        await this.handleMessage(ws, data);
      });

      ws.on("close", () => {
        const interval = this.pingIntervals.get(ws);
        if (interval) {
          clearInterval(interval);
          this.pingIntervals.delete(ws);
        }
        this.handleDisconnect(ws);
      });

      ws.on("error", (err) => {
        console.error(`⚠️ WebSocket error for ${ws.deviceId || 'unknown'}:`, err.message);
      });
    });

    // Clean up dead connections periodically
    const cleanupInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log(`🧹 Cleaning up dead connection: ${ws.deviceId || 'unknown'}`);
          this.handleDisconnect(ws);
          return ws.terminate();
        }
      });
    }, 60000); // Every 60 seconds

    this.wss.on('close', () => {
      clearInterval(cleanupInterval);
    });

    return this.wss;
  }

  async handleMessage(ws, data) {
    try {
      const msg = JSON.parse(data.toString());
      console.log(`📩 Received message type: ${msg.type} from ${msg.deviceId || 'unknown'}`);

      switch (msg.type) {
        case "register-device":
          await this.handleRegistration(ws, msg);
          break;

        case "sensor-data":
          await this.handleSensorData(ws, msg);
          break;

        case "command-ack":
          console.log(`✅ Command acknowledged by ${msg.deviceId}`);
          break;

        case "disconnect":
          console.log(`👋 Device ${msg.deviceId} sent disconnect message`);
          this.handleDisconnect(ws);
          ws.close();
          break;

        case "pong":
          console.log(`📡 Received application-level pong from ${msg.deviceId}`);
          ws.isAlive = true;
          break;

        default:
          console.log(`❓ Unknown message type: ${msg.type}`);
      }
    } catch (err) {
      console.error("❌ Invalid WS message:", err.message);
      console.error("   Raw data:", data.toString());
    }
  }

  async handleRegistration(ws, msg) {
    try {
      ws.deviceId = msg.deviceId;
      ws.isAlive = true;
      
      // Store the connection
      this.esp32SocketMap.set(msg.deviceId, ws);

      // Update device in database
      const device = await Device.findOne({ nameId: msg.deviceId });
      if (device) {
        device.SensorData.NetworkSensor.description = `WiFi Connected`;
        device.SensorData.NetworkSensor.active = true;
        await device.save();
        console.log(`📊 Database updated for ${msg.deviceId}`);
      } else {
        console.warn(`⚠️ Device ${msg.deviceId} not found in database`);
      }

      console.log(`✅ Device registered (ESP32): ${msg.deviceId}`);
      console.log(`   Firmware: ${msg.firmwareVersion || 'unknown'}`);
      console.log(`   RSSI: ${msg.wifiRSSI || 'unknown'} dBm`);

      // Send registration success response
      const response = {
        type: "registration-success",
        deviceId: msg.deviceId,
        timestamp: Date.now(),
        message: "Device successfully registered"
      };

      ws.send(JSON.stringify(response));
      console.log(`📤 Sent registration-success to ${msg.deviceId}`);

    } catch (err) {
      console.error("❌ Registration error:", err.message);
      
      // Send error response
      const errorResponse = {
        type: "error",
        message: "Registration failed: " + err.message,
        timestamp: Date.now()
      };
      
      ws.send(JSON.stringify(errorResponse));
    }
  }

  async handleSensorData(ws, msg) {
    try {
      if (!ws.deviceId) {
        console.warn("⚠️ Received sensor data from unregistered device");
        return;
      }

      console.log(`📊 Sensor data from ${msg.deviceId}:`);
      console.log(`   Water Level: ${msg.waterLevel}%`);
      console.log(`   Flow Rate: ${msg.flowRate} L/min`);
      console.log(`   Leak: ${msg.leakDetected ? 'YES' : 'NO'}`);
      console.log(`   Pump: ${msg.pumpState ? 'ON' : 'OFF'}`);
      console.log(`   Auto: ${msg.autoMode ? 'ON' : 'OFF'}`);

      // Update device in database with sensor data
      const device = await Device.findOne({ nameId: msg.deviceId });
      if (device) {
        // Update device status with latest sensor readings
        device.DeviceStatus.waterLevel = msg.waterLevel;
        device.DeviceStatus.waterpumpStatus = msg.pumpState;
        device.DeviceStatus.autoPump = msg.autoMode;
        device.DeviceStatus.watersupplyStatus = msg.waterSupply;
        
        // Update leak detection
        if (msg.leakDetected) {
          device.DeviceStatus.leakage = [{
            detected: true,
            location: 'tank'
          }];
        } else {
          device.DeviceStatus.leakage = [{
            detected: false,
            location: 'tank'
          }];
        }

        await device.save();
      }

      // Send acknowledgment
      const ack = {
        type: "sensor-data-ack",
        deviceId: msg.deviceId,
        timestamp: Date.now()
      };
      
      ws.send(JSON.stringify(ack));

    } catch (err) {
      console.error("❌ Error handling sensor data:", err.message);
    }
  }

  handleDisconnect(ws) {
    if (ws.deviceId) {
      this.esp32SocketMap.delete(ws.deviceId);
      console.log(`❌ ESP32 disconnected: ${ws.deviceId}`);
      
      // Update database to show device offline
      Device.findOne({ nameId: ws.deviceId })
        .then(device => {
          if (device) {
            device.SensorData.NetworkSensor.description = `WiFi Disconnected`;
            device.SensorData.NetworkSensor.active = false;
            return device.save();
          }
        })
        .then(() => {
          console.log(`📊 Database updated: ${ws.deviceId} marked offline`);
        })
        .catch(err => {
          console.error("❌ Error updating device offline status:", err.message);
        });
    } else {
      console.log("❌ Unregistered ESP32 disconnected");
    }
  }

  sendToESP32(deviceId, message) {
    const ws = this.esp32SocketMap.get(deviceId);
    
    if (!ws) {
      console.warn(`⚠️ ESP32 ${deviceId} not in connection map`);
      return false;
    }

    if (ws.readyState !== WebSocket.OPEN) {
      console.warn(`⚠️ ESP32 ${deviceId} connection not open (state: ${ws.readyState})`);
      this.esp32SocketMap.delete(deviceId);
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      console.log(`📤 Sent to ESP32 ${deviceId}:`, message.type);
      return true;
    } catch (err) {
      console.error(`❌ Error sending to ESP32 ${deviceId}:`, err.message);
      return false;
    }
  }

  // Get connection status for a device
  isDeviceConnected(deviceId) {
    const ws = this.esp32SocketMap.get(deviceId);
    return ws && ws.readyState === WebSocket.OPEN;
  }

  // Get all connected devices
  getConnectedDevices() {
    return Array.from(this.esp32SocketMap.keys());
  }

  // Broadcast to all connected devices
  broadcastToAll(message) {
    let sent = 0;
    this.esp32SocketMap.forEach((ws, deviceId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        sent++;
      }
    });
    console.log(`📡 Broadcasted to ${sent} devices`);
    return sent;
  }
}

module.exports = WebSocketService;