import express from "express";
import { signup, login, logout, verifyAuth, updateLocation } from "../controllers/authControllers.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/verify", auth, verifyAuth);
router.post('/location', auth, updateLocation);

export default router;