import mongoose from "mongoose";

const connectToDatabase = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/flowsync";
        await mongoose.connect(mongoURI);
        console.log("✅ Connected to MongoDB");
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1); 
    }
};

export default connectToDatabase;
