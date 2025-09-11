import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

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
    ignoredItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    donationCount: {
        type: Number,
        default: 0
    },
    points: {
        type: Number,
        default: 0
    },
    lastLocation: {
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        updatedAt: { type: Date, default: null }
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;