import { z } from "zod";

const signupSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Name must have at least 3 characters" })
    .max(30, { message: "Name must have at most 30 characters" })
    .refine(
      (val) => /^[A-Za-z\s]+$/.test(val),
      { message: "Only alphabets are allowed (A-Z, a-z)" }
    ),
  email: z.email({ message: "Invalid email format" })
    .min(3, { message: "Email must be at least 3 characters" })
    .max(50, { message: "Email must be less than 50 characters" }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number & 1 special character ✅",
    })
    .refine(
      (val) =>
        /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        /[^A-Za-z0-9]/.test(val),
      {
        message: "Password must have 1 uppercase, 1 lowercase, 1 number & 1 special character",
      }
    ),
  confirmPassword: z.string(),
  phone: z
    .string()
    .refine((val) => /^[0-9]{10}$/.test(val), {
      message: "Phone number must be exactly 10 digits",
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});



const loginSchema = z.object({
  email: z
    .email({ message: "Invalid Email Format" })
})
export default signupSchema;
