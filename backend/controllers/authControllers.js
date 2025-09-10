import User from "../models/User.js";
import { signupSchema, loginSchema } from "../validators/authValidator.js";
import generateToken from "../utils/generateToken.js";

export const signup = async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues[0].message });
    }
    const { name, email, phone, password, role } = parsed.data;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
        return res.status(400).json({ message: "Email or Phone Number already exists" });
    }

    const user = await User.create({ name, email, phone, password, role });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: "User Registered Successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
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
        
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            message: "Login Successful",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};