const mqtt = require("mqtt");
const { esp32StatusUpdate, esp32SensorDataUpdate } = require('../Services/Updates');
const Device = require('../Models/DeviceSchema');

// HiveMQ Cloud broker details
const brokerUrl = "mqtts://0568342c30994f368c273f781658d9e8.s1.eu.hivemq.cloud:8883";
const username = "Jonathan";
const password = "Alvinjon6";

// Connect options
const options = {
  username: username,
  password: password,
  reconnectPeriod: 5000,
  clean: true,
};

// Connect to the broker
const client = mqtt.connect(brokerUrl, options);

// Store connected devices in memory
const connectedDevices = new Map();

// Initialize MQTT subscriptions
async function initializeMQTT() {
  try {
    // Get all device IDs from database
    const devices = await Device.find({}, 'nameId');
    const deviceIds = devices.map(d => d.nameId).filter(id => id);
    
    console.log(`📡 Found ${deviceIds.length} devices in database`);
    
    // Subscribe to all devices using wildcard
    client.subscribe("device/+/data", { qos: 1 }, (err) => {
      if (!err) {
        console.log("✅ Subscribed to: device/+/data");
      } else {
        console.error("❌ Subscription error:", err);
      }
    });

    client.subscribe("device/+/status", { qos: 1 }, (err) => {
      if (!err) {
        console.log("✅ Subscribed to: device/+/status");
      } else {
        console.error("❌ Subscription error:", err);
      }
    });

  } catch (error) {
    console.error("❌ Error initializing MQTT:", error);
  }
}

// Called when connected
client.on("connect", () => {
  console.log("✅ Backend connected to MQTT broker");
  initializeMQTT();
});

// Called when connection is lost
client.on("offline", () => {
  console.log("⚠️ MQTT client is offline");
});

// Called on reconnect
client.on("reconnect", () => {
  console.log("🔄 Attempting to reconnect to MQTT broker...");
});

// Called on error
client.on("error", (error) => {
  console.error("❌ MQTT Error:", error);
});

// Called when a message arrives
client.on("message", async (topic, message) => {
  try {
    const msgStr = message.toString();
    const topicParts = topic.split("/");
    const deviceId = topicParts[1]; // Extract device ID from topic

    console.log(`\n📩 Message received from ${deviceId}`);

    // Handle device data (combined status + sensor data)
    if (topic.endsWith("/data")) {
      const data = JSON.parse(msgStr);
      
      console.log("📊 Processing device data:");
      console.log("   Device ID:", data.deviceId);
      console.log("   Water Level:", data.statusData.waterLevel + "%");
      console.log("   Pump State:", data.statusData.pumpState);
      console.log("   Supply State:", data.statusData.supplyState);
      console.log("   Auto Mode:", data.statusData.autoMode);
      console.log("   Leakage:", data.statusData.leakage[0].detected ? "YES" : "NO");

      // Update device in database
      try {
        // Update status
        const statusUpdate = {
          waterLevel: data.statusData.waterLevel,
          waterpumpStatus: data.statusData.pumpState === "on",
          watersupplyStatus: data.statusData.supplyState === "on",
          autoPump: data.statusData.autoMode === "on",
          leakage: data.statusData.leakage,
        };

        await esp32StatusUpdate(deviceId, statusUpdate);
        console.log("✅ Status updated in database");

        // Update sensor data
        await esp32SensorDataUpdate(deviceId, data.sensorData);
        console.log("✅ Sensor data updated in database");

        // Store in memory for quick access
        connectedDevices.set(deviceId, {
          lastSeen: Date.now(),
          data: data,
        });

      } catch (dbError) {
        console.error("❌ Database update error:", dbError.message);
      }
    }

    // Handle device connection status
    else if (topic.endsWith("/status")) {
      console.log(`📡 Device ${deviceId} status: ${msgStr}`);
      
      if (msgStr === "connected") {
        console.log(`✅ Device ${deviceId} is online`);
        connectedDevices.set(deviceId, {
          lastSeen: Date.now(),
          online: true,
        });
      }
    }

  } catch (error) {
    console.error("❌ Error processing MQTT message:", error);
  }
});

// -------------------- Command Functions --------------------

/**
 * Send pump command to device
 * @param {string} deviceId - Device ID (e.g., "TANK_UNIT_d4dda93c1c78")
 * @param {boolean} turnOn - true for ON, false for OFF
 */
async function sendPumpCommand(deviceId, turnOn) {
  try {
    const topic = `device/${deviceId}/pump`;
    const command = turnOn ? "pump_on" : "pump_off";
    
    // Check if device exists
    const device = await Device.findOne({ nameId: deviceId });
    if (!device) {
      throw new Error('Device not found');
    }

    // Publish command
    client.publish(topic, command, { qos: 1, retain: false }, (err) => {
      if (err) {
        console.error("❌ Error sending pump command:", err);
        throw err;
      } else {
        console.log(`✅ Pump command sent to ${deviceId}: ${command}`);
      }
    });

    return { success: true, command: command };
  } catch (error) {
    console.error("❌ Error in sendPumpCommand:", error);
    throw error;
  }
}

/**
 * Send supply command to device
 * @param {string} deviceId - Device ID
 * @param {boolean} turnOn - true for ON, false for OFF
 */
async function sendSupplyCommand(deviceId, turnOn) {
  try {
    const topic = `device/${deviceId}/supply`;
    const command = turnOn ? "supply_on" : "supply_off";
    
    // Check if device exists
    const device = await Device.findOne({ nameId: deviceId });
    if (!device) {
      throw new Error('Device not found');
    }

    // Publish command
    client.publish(topic, command, { qos: 1, retain: false }, (err) => {
      if (err) {
        console.error("❌ Error sending supply command:", err);
        throw err;
      } else {
        console.log(`✅ Supply command sent to ${deviceId}: ${command}`);
      }
    });

    return { success: true, command: command };
  } catch (error) {
    console.error("❌ Error in sendSupplyCommand:", error);
    throw error;
  }
}

/**
 * Send automation configuration to device
 * @param {string} deviceId - Device ID
 * @param {object} config - { auto_pump: boolean, minLevel: number, maxLevel: number }
 */
async function sendAutomationConfig(deviceId, config) {
  try {
    const topic = `device/${deviceId}/automation`;
    
    // Check if device exists
    const device = await Device.findOne({ nameId: deviceId });
    if (!device) {
      throw new Error('Device not found');
    }

    const automationData = {};
    
    if (config.auto_pump !== undefined) {
      automationData.auto_pump = config.auto_pump;
    }
    if (config.minLevel !== undefined) {
      automationData.minLevel = config.minLevel;
    }
    if (config.maxLevel !== undefined) {
      automationData.maxLevel = config.maxLevel;
    }

    const payload = JSON.stringify(automationData);

    // Publish command
    client.publish(topic, payload, { qos: 1, retain: false }, (err) => {
      if (err) {
        console.error("❌ Error sending automation config:", err);
        throw err;
      } else {
        console.log(`✅ Automation config sent to ${deviceId}:`, automationData);
      }
    });

    return { success: true, config: automationData };
  } catch (error) {
    console.error("❌ Error in sendAutomationConfig:", error);
    throw error;
  }
}

/**
 * Get list of connected devices
 * @returns {Array} Array of device info
 */
function getConnectedDevices() {
  const devices = [];
  const now = Date.now();
  const timeout = 30000; // 30 seconds

  connectedDevices.forEach((device, deviceId) => {
    if (now - device.lastSeen < timeout) {
      devices.push({
        deviceId: deviceId,
        lastSeen: device.lastSeen,
        online: true,
        data: device.data,
      });
    }
  });

  return devices;
}

/**
 * Check if a device is online
 * @param {string} deviceId - Device ID
 * @returns {boolean}
 */
function isDeviceOnline(deviceId) {
  const device = connectedDevices.get(deviceId);
  if (!device) return false;

  const now = Date.now();
  const timeout = 30000; // 30 seconds
  return (now - device.lastSeen) < timeout;
}

/**
 * Get latest data for a specific device
 * @param {string} deviceId - Device ID
 * @returns {object|null}
 */
function getDeviceData(deviceId) {
  const device = connectedDevices.get(deviceId);
  return device ? device.data : null;
}

/**
 * Subscribe to a new device (when device is added to database)
 * @param {string} deviceId - Device ID
 */
function subscribeToDevice(deviceId) {
  // Subscriptions are already wildcarded, but you can add specific logic here if needed
  console.log(`📡 New device registered: ${deviceId}`);
}

// -------------------- Graceful Shutdown --------------------
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down MQTT client...");
  client.end(true, () => {
    console.log("✅ MQTT client disconnected");
    process.exit(0);
  });
});

// -------------------- Export Functions --------------------
module.exports = {
  client,
  sendPumpCommand,
  sendSupplyCommand,
  sendAutomationConfig,
  getConnectedDevices,
  isDeviceOnline,
  getDeviceData,
  subscribeToDevice,
};

// -------------------- Usage Examples --------------------
/*

// Example 1: Turn pump ON
await sendPumpCommand("TANK_UNIT_d4dda93c1c78", true);

// Example 2: Turn pump OFF
await sendPumpCommand("TANK_UNIT_d4dda93c1c78", false);

// Example 3: Turn supply ON
await sendSupplyCommand("TANK_UNIT_d4dda93c1c78", true);

// Example 4: Turn supply OFF
await sendSupplyCommand("TANK_UNIT_d4dda93c1c78", false);

// Example 5: Enable auto mode with custom thresholds
await sendAutomationConfig("TANK_UNIT_d4dda93c1c78", {
  auto_pump: true,
  minLevel: 30,
  maxLevel: 90
});

// Example 6: Disable auto mode
await sendAutomationConfig("TANK_UNIT_d4dda93c1c78", {
  auto_pump: false
});

// Example 7: Only update thresholds
await sendAutomationConfig("TANK_UNIT_d4dda93c1c78", {
  minLevel: 25,
  maxLevel: 85
});

// Example 8: Get all connected devices
const devices = getConnectedDevices();
console.log(devices);

// Example 9: Check if device is online
const online = isDeviceOnline("TANK_UNIT_d4dda93c1c78");
console.log("Device online:", online);

// Example 10: Get latest device data
const data = getDeviceData("TANK_UNIT_d4dda93c1c78");
if (data) {
  console.log("Water Level:", data.statusData.waterLevel);
}

*/