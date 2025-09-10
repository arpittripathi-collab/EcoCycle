import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        match: /^[0-9]{10}$/
    },
    password: {
        type: String,
        unique: true
    }
},{ timestamps: true }
);

const users = mongoose.model("users",userSchema);

export default users;