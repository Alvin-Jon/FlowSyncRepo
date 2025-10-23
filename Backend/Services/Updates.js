const User = require('../Models/UserSchema');
const Device = require('../Models/DeviceSchema');


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
        if (!device) {
            throw new Error('Device not found');
        }
        // Update esp32 sensor data
        device.SensorData = { ...device.SensorData, ...sensorData };
        await device.save();
        return device.SensorData;
    }
    catch (error) {
        console.error('Error updating esp32 sensor data:', error);
        throw error;
    }
};


module.exports = { settingsUpdate, automationStatusUpdate, waterPumpStatusUpdate, watersupplyStatusUpdate, esp32StatusUpdate,   esp32SensorDataUpdate };