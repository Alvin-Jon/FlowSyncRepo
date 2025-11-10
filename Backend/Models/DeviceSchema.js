const mongoose = require('mongoose');
const { Schema } = mongoose;

const LeakageScheama = new Schema({
  detected: { type: Boolean, required: true, default: false },
  location: { type: String },
});

const waterThresholdSchema = new Schema({
  minLevel: { type: Number, required: true, default: 25 },
  maxLevel: { type: Number, required: true, default: 100 },
});

const WaterStatusSchema = new Schema({
  waterLevel: { type: Number, required: true, default: 1 },
  waterpumpStatus: { type: Boolean, required: true, default: false },
  watersupplyStatus: { type: Boolean, required: true, default: true },
  autoPump: { type: Boolean, required: true, default: false },
  autoSupplyCut: { type: Boolean, required: true, default: true },
  leakage: [LeakageScheama],
  waterThreshold: { type: waterThresholdSchema, default: () => ({}) },
  history: { type: Schema.Types.ObjectId, ref: 'WaterHistory' },
  events: { type: Array, default: []},
});

const SensorDataSchema = new Schema({
  TankLevelSensor: {
    type: [{ description: { type: String, default: '24KHz Ultrasonic' }, active: { type: Boolean, default: false } }],
    default: () => [{ description: '24KHz Ultrasonic' }],
  },
  FlowSensor: {
    type: [{ description: { type: String, default: '24.5L/min' }, active: { type: Boolean, default: false } }],
    default: () => [{ description: '0.0/min' }],
  },
  NetworkSensor: {
    type: [{ description: { type: String, default: 'Wifi not connected' }, active: { type: Boolean, default: false } }],
    default: () => [{ description: 'Wifi not connected' }],
  },
  LeakSensor: {
    type: [{ description: { type: String, default: 'No Leaks' }, active: { type: Boolean, default: false } }],
    default: () => [{ description: 'No Leaks' }],
  },
});

const NotificationSchema = new Schema({
  name: { type: String, required: true },
  enabled: { type: Boolean, required: true, default: true },
});

const SettingsSchema = new Schema({
  notification: {
    type: [NotificationSchema],
    default: [
      { name: 'Push Notifications', enabled: true },
      { name: 'Email Notifications', enabled: true },
      { name: 'SMS Alerts', enabled: false },
    ],
  },
  dataSync: { type: Boolean, required: true, default: true },
  unit: { type: String, required: true, default: 'Litres' },
});

const DeviceSchema = new Schema({
  nameId: { type: String, required: true },
  accountLinkedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: WaterStatusSchema, default: () => ({}) },
  SensorData: { type: SensorDataSchema, default: () => ({}) },
  paired: { type: Boolean, default: false },
  settings: { type: SettingsSchema, default: () => ({}) },
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
