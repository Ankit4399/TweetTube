import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || (process.env.MONGODB_URL ? `${process.env.MONGODB_URL}/${DB_NAME}` : null);
        if (!mongoUri) {
            console.log("MONGO URI not set. Please set `MONGO_URI` or `MONGODB_URL` in your environment.");
            process.exit(1);
        }

        const connectionInstance = await mongoose.connect(mongoUri);
        console.log(`\n MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED: ", error);
        process.exit(1)
    }
}

export default connectToDB