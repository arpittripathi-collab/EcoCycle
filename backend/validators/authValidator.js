import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must have at least 3 characters" })
    .max(30, { message: "Name must have at most 30 characters" }),
  email: z.email({ message: "Invalid email format" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .refine(
      (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val) && /[^A-Za-z0-9]/.test(val),
      { message: "Password must have 1 uppercase, 1 lowercase, 1 number & 1 special character" }
    ),
  phone: z
    .string()
    .refine((val) => /^[0-9]{10}$/.test(val), { message: "Phone number must be exactly 10 digits" }),
});

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
});