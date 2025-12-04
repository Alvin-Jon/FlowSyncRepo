const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');
const WaterHistory = require('../Models/WaterHistory');
const {sendEmail} = require('./AlertServices');
const {alertFrontend} = require('./SocketEmitter');
const {getEmailByDeviceId} = require('./State');


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
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) {
            throw new Error('Device not found');
        }
        // Update device status
        device.status = { ...device.status, ...newStatus };
        alertFrontend(deviceId, "update-device-details", device.status);
        await device.save();
        return device.status;
    }
    catch (error) {
        console.error('Error updating status:', error);
        throw error;
    }
};

const esp32SensorDataUpdate = async (deviceId, sensorData) => {
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) throw new Error('Device not found');

        // Update water usage
        await WaterUsageUpdate(deviceId, sensorData);
        
        // Handle leak sensor (special rule)
        if (sensorData.LeakSensor && sensorData.LeakSensor[0]) {
            if (sensorData.LeakSensor[0].description.includes("Detected")) {
                device.status.leakage[0].detected = true;
                device.status.leakage[0].location = "tank";

                // add an event 
             if(device.status.events.length < 1 ) {
               // add one hour to current time\
               const time = new Date();
               time.setHours(time.getHours() + 1);
                   device.status.events = [
                    {
                        title: "Leak Detected",
                        description : `A leak has been detected in the Tank at ${time.toLocaleString()}. Immediate action is recommended.`,
                    }
                ]
                console.warn('Leak detected in tank');
                const userEmail = await getEmailByDeviceId(deviceId);
                sendEmail( 
                    userEmail,
                    'Urgent: Leak Detected in Your Water Tank',
                    `Dear User,\n\nA leak has been detected in your water tank at ${new Date().toLocaleString()}. Please take immediate action to address this issue to prevent potential water damage and wastage.\n\nBest regards,\nFlowsync Team`
                );

                alertFrontend(deviceId, "leak-detected", device.status.events[0]);
            } 
            } else {
                device.status.leakage[0].detected = false;
                device.status.leakage[0].location = "tank";
                device.status.events = []; // clear events
                console.log('No leak detected in tank');
            }
        } 

        // Update each sensor safely
        if (sensorData.TankLevelSensor) {
            device.SensorData.TankLevelSensor = sensorData.TankLevelSensor;
        }
        if (sensorData.FlowSensor) {
            device.SensorData.FlowSensor = sensorData.FlowSensor;
        }
        if (sensorData.NetworkSensor) {
            device.SensorData.NetworkSensor = sensorData.NetworkSensor;
        }
        if (sensorData.LeakSensor) {
            device.SensorData.LeakSensor = sensorData.LeakSensor;
        }

        await device.save();

        alertFrontend(deviceId, "update-device-details", device.SensorData);
        return device.SensorData;
    }
    catch (error) {
        console.error('Error updating esp32 sensor data:', error);
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

const WaterUsageUpdate = async (deviceId, sensorData) => {
    try {
        const device = await Device.findOne({ nameId: deviceId });
        if (!device) throw new Error('Device not found');

        const waterHistoryRecord = await WaterHistory.findOne({ deviceId: device._id });
        if (!waterHistoryRecord) {
            throw new Error('Water history record not found');
        }

        // Extract flow rate number
        const flowRate = sensorData.FlowSensor[0].description.replace("L/min", "");
        const flowRateNum = parseFloat(flowRate);
        // Convert L/min → liters per 5 seconds
        const waterUsed = flowRateNum / 12;

        // Get today's date (reset to midnight)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Try to find existing log entry for today
        const existingLog = waterHistoryRecord.logs.find(log => {
            const logDate = new Date(log.day);
            logDate.setHours(0, 0, 0, 0);
            return logDate.getTime() === today.getTime();
        });

        if (existingLog) {
            // Increment usage
            existingLog.usage += waterUsed;
        } else {
            // Create new log for today
            waterHistoryRecord.logs.push({
                day: new Date(),
                usage: waterUsed
            });
        }
        
        // let  Mongoose know the array changed!
        waterHistoryRecord.markModified("logs");

        await waterHistoryRecord.save();
        alertFrontend(deviceId, "update-device-details", waterHistoryRecord.logs);
    } catch (error) {
        console.error('Error updating water usage:', error);
        throw error;
    }
};






module.exports = { isOnline ,settingsUpdate, automationStatusUpdate, waterPumpStatusUpdate, watersupplyStatusUpdate, esp32StatusUpdate,   esp32SensorDataUpdate, WaterUsageUpdate };