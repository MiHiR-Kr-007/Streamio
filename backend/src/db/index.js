import mongoose  from "mongoose";


const connectDB = async () => {
    try{
        const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${process.env.DB_NAME}`);
        console.log(`Mongo connected. \n Host Name : ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.log("Databse Connection Error : ",error);
        process.exit(1);
    }
}

export default connectDB;