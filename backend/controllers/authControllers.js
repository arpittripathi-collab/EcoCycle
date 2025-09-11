import User from "../models/User.js";
import { signupSchema, loginSchema } from "../validators/authValidator.js";
import generateToken from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { name, email, phone, password } = parsed.data;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        return res.status(400).json({ message: "Email or Phone Number already exists" });
    }

    const user = await User.create({ name, email, phone, password });
    const token = generateToken(user._id);

    // Set token as HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

        res.status(201).json({
            message: "User Registered Successfully",
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, donationCount: user.donationCount || 0, points: user.points || 0 }
        });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

export const login = async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: parsed.error.issues[0].message });
        }
        const { email, password } = parsed.data;

        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        
        const token = generateToken(user._id);

        // Set token as HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.status(200).json({
            message: "Login Successful",
            user: { id: user._id, name: user.name, email: user.email, phone: user.phone, donationCount: user.donationCount || 0, points: user.points || 0 }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        // Clear the token cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.status(200).json({
            message: "Logout Successful"
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const verifyAuth = async (req, res) => {
    try {
        // If we reach here, the auth middleware has already verified the token
        // and set req.userId
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({ 
                isAuthenticated: false, 
                message: "User not found" 
            });
        }

        res.status(200).json({
            isAuthenticated: true,
            user: { 
                id: user._id, 
                name: user.name, 
                email: user.email,
                phone: user.phone,
                donationCount: user.donationCount || 0,
                points: user.points || 0
            }
        });
    } catch (error) {
        res.status(500).json({ 
            isAuthenticated: false,
            message: "Internal Server Error", 
            error: error.message 
        });
    }
};

export const updateLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (typeof latitude !== 'number' || typeof longitude !== 'number') {
            return res.status(400).json({ message: 'latitude and longitude must be numbers' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.lastLocation = { latitude, longitude, updatedAt: new Date() };
        await user.save();

        return res.json({ message: 'Location updated' });
    } catch (err) {
        console.error('updateLocation error', err);
        return res.status(500).json({ message: err.message });
    }
};