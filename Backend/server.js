const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;  
const http = require('http');
const server = http.createServer(app);
const corsMiddleware = require('./Config/CorsConfig').default;
const session = require('express-session');
const passport = require('./Config/PassportConfig')
const connectToDatabase = require('./Config/Mongodb').default;
const {initSocket} = require('./Config/Socket');
initSocket(server);
const authRoutes = require('./Routes/AuthRoutes');
const esp32Routes = require('./Routes/Esp32Routes');




// Middleware
app.set('trust proxy', true);
app.use(corsMiddleware);
console.log("Mongo URI:", process.env.MONGO_URI);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
    
// Session setup
const MongoStore = require('connect-mongo');
app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({  
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60,
    }),
   cookie: {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
},
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', authRoutes);
app.use('/esp32', esp32Routes);

// Connect to MongoDB
connectToDatabase()



// Start server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

