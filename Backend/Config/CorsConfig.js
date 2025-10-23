import cors from "cors";

const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  process.env.ESP32_ORIGIN,   
  "http://192.168.0.105",      
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  //allowedHeaders: ["Content-Type", "Authorization"], // Uncomment if needed
};

export default cors(corsOptions);
