const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');
const {sendEmail} = require('./AlertServices');
const {alertFrontend} = require('./SocketEmitter');


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

        // Handle leak sensor (special rule)
        if (sensorData.LeakSensor && sensorData.LeakSensor[0]) {
            if (sensorData.LeakSensor[0].description.includes("Detected")) {
                device.status.leakage[0].detected = true;
                device.status.leakage[0].location = "tank";

                // add an event 
             if(device.status.events.length < 1 ) {
                   device.status.events = [
                    {
                        title: "Leak Detected",
                        description : `A leak has been detected in the Tank at ${new Date().toLocaleString()}. Immediate action is recommended.`,
                    }
                ]
                console.warn('Leak detected in tank');
                sendEmail( 
                    device.accountLinkedTo,
                    'Urgent: Leak Detected in Your Water Tank',
                    `Dear User,\n\nA leak has been detected in your water tank at ${new Date().toLocaleString()}. Please take immediate action to address this issue to prevent potential water damage and wastage.\n\nBest regards,\nFlowsync Team`
                );
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



module.exports = { isOnline ,settingsUpdate, automationStatusUpdate, waterPumpStatusUpdate, watersupplyStatusUpdate, esp32StatusUpdate,   esp32SensorDataUpdate };