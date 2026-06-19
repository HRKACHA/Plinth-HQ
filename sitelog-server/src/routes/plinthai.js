import { Router } from 'express';
import { initSession, chatHandler, feedbackHandler } from '../controllers/plinthaiController.js';

const router = Router();

// GET  /api/v1/plinthai/init     — Bootstrap chat session context
router.get('/init', initSession);

// POST /api/v1/plinthai/chat     — Main conversational endpoint
router.post('/chat', chatHandler);

// POST /api/v1/plinthai/feedback — Record thumbs up/down feedback
router.post('/feedback', feedbackHandler);

export default router;
