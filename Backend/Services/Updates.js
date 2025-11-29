const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');
const {sendEmail} = require('./AlertServices');
const { getIO, getDeviceMap } = require('../Config/Socket');



const settingsUpdate = async (userId, newSettings) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        const device = await Device.findOne({ accountLinkedTo: userId });
        if (!device) {
            throw new Error('Device not found for user');
        }
        // Update device settings
        device.settings = { ...device.settings, ...newSettings };
        await device.save();
        return device.settings;
    } catch (error) {
        console.error('Error updating settings:', error);
        throw error;
    }   
};

const automationStatusUpdate = async (deviceId, newStatus) => {  
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) {
            throw new Error('Device not found');
        }
        // Update device status
        device.status = { ...device.status, ...newStatus };
        await device.save();
        return device.status;
    }
    catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

const waterPumpStatusUpdate = async (deviceId, pumpStatus, autoStatus) => {  
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) {
            throw new Error('Device not found');
        }   
        // Update water pump status
        device.status.waterpumpStatus = pumpStatus;
        device.status.autoPump = autoStatus;
        await device.save();
        return device.status;
    }
    catch (error) {
        console.error('Error updating water pump status:', error);
        throw error;
    }
};

const watersupplyStatusUpdate = async (deviceId, supplyStatus) => {  
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) {
            throw new Error('Device not found');
        }
        // Update water supply status
        device.status.watersupplyStatus = supplyStatus;
        await device.save();
        return device.status;
    }
    catch (error) {
        console.error('Error updating water supply status:', error);
        throw error;
    } 
};


const esp32StatusUpdate = async (deviceId, newStatus) => {
    try {
        const update = {
            $set: {
                status: newStatus
                    ? { ...newStatus }
                    : {}
            }
        };

        const updatedDevice = await Device.findOneAndUpdate(
            { nameId: deviceId },
            update,
            { new: true }
        );

        if (!updatedDevice) {
            throw new Error('Device not found');
        }

        // Emit update to device socket
        const io = getIO();
        const deviceSocketMap = getDeviceMap();
        const socketId = deviceSocketMap.get(deviceId);
        if (socketId) {
            io.to(socketId).emit("update-device-details");
        }

        return updatedDevice.status;
    } catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};


const esp32SensorDataUpdate = async (deviceId, sensorData) => {
    try {
        // Build update object
        const updateFields = {};
        
        // Leak Sensor Handling
        if (sensorData.LeakSensor && sensorData.LeakSensor[0]) {
            const leakDetected = sensorData.LeakSensor[0].description.includes("Detected");

            updateFields["status.leakage.0.detected"] = leakDetected;
            updateFields["status.leakage.0.location"] = "tank";

            if (leakDetected) {
                updateFields["status.events"] = [
                    {
                        title: "Leak Detected",
                        description: `A leak has been detected in the Tank at ${new Date().toLocaleString()}. Immediate action is recommended.`
                    }
                ];

                console.warn("Leak detected in tank");

                // Send email alert
                const device = await Device.findOne({ nameId: deviceId });
                if (device) {
                    sendEmail(
                        device.accountLinkedTo,
                        'Urgent: Leak Detected in Your Water Tank',
                        `Dear User,\n\nA leak has been detected in your water tank at ${new Date().toLocaleString()}. Please take immediate action.\n\nBest regards,\nFlowsync Team`
                    );
                }
            } else {
                updateFields["status.events"] = [];
                console.log("No leak detected in tank");
            }
        }

        // --- Sensor Data Updates ---
        if (sensorData.TankLevelSensor)
            updateFields["SensorData.TankLevelSensor"] = sensorData.TankLevelSensor;

        if (sensorData.FlowSensor)
            updateFields["SensorData.FlowSensor"] = sensorData.FlowSensor;

        if (sensorData.NetworkSensor)
            updateFields["SensorData.NetworkSensor"] = sensorData.NetworkSensor;

        if (sensorData.LeakSensor)
            updateFields["SensorData.LeakSensor"] = sensorData.LeakSensor;

        // Execute database update (no version errors)
        const updatedDevice = await Device.findOneAndUpdate(
            { nameId: deviceId },
            { $set: updateFields },
            { new: true }
        );

        if (!updatedDevice) throw new Error("Device not found");

        // Emit to frontend
        const io = getIO();
        const deviceSocketMap = getDeviceMap();
        const socketId = deviceSocketMap.get(deviceId);
        if (socketId) io.to(socketId).emit("update-device-details");

        return updatedDevice.SensorData;

    } catch (error) {
        console.error("Error updating esp32 sensor data:", error);
        throw error;
    }
};



const isOnline = async (id) => {
    const device = await Device.findOne({ nameId: id });
    if (!device) {
        throw new Error('Device not found');
    } 
   try {
    device.SensorData.NetworkSensor[0].description = "Wifi connected";
    device.SensorData.NetworkSensor[0].active = true;
    await device.save(); 
    } catch (error) {
        console.error('Error updating network sensor status:', error);
        throw error;
    }
    return device.SensorData;
}



module.exports = { isOnline ,settingsUpdate, automationStatusUpdate, waterPumpStatusUpdate, watersupplyStatusUpdate, esp32StatusUpdate,   esp32SensorDataUpdate };