import mongoose from "mongoose"

export const connectDB= async () => {
    try{
        const { MONGO_URI }=process.env;
        if(!MONGO_URI) throw new Error("MONGO_URI is not available");
        const conn= await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected successfully at",conn.connection.host," :",conn.connection.port);
    }
    catch(error){
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }

}