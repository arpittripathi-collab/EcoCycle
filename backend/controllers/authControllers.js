import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import  signupSchema  from "../validators/authValidator.js";

export const signup = async (req, res) => {
  try {
 
    const parsed = await signupSchema.safeParse(req.body);
  
      if (!parsed.success) {
        const error = parsed.error.issues[0].message;
        return res.status(400).json({
          message: error,
        });
      }
    const { name, email, phone, password } = parsed.data;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    res.status(201).json({
      message:"User Registered Successfully"
    });
  } catch (error) {
    res.status(500).json({
        message:"Email or Phone Number already exist"
    })
  }
};