import express from 'express';
import { findMatches } from '../controllers/matchController.js';
import { acceptMatch } from '../controllers/matchAcceptController.js';
import { passMatch } from '../controllers/matchPassController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, findMatches);
router.post('/accept', auth, acceptMatch);
router.post('/pass', auth, passMatch);

export default router;