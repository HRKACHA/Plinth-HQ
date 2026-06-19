import express from 'express';
import { protect } from '../middleware/auth.js';
import { globalSearch } from '../controllers/searchController.js';

const router = express.Router();

router.use(protect);

router.get('/', globalSearch);

export default router;
