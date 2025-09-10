import express from 'express';
import { findMatches } from '../controllers/matchController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, findMatches);

export default router;