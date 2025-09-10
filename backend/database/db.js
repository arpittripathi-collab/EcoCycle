import mongoose from "mongoose";

async function connectDB(){
    try{
       await mongoose.connect(process.env.URL);
       console.log("Database Connected Successfully");
    }catch(e){
      console.log("Database Connection Failed"+e);
      process.exit(1);
    }
}

export default connectDB;