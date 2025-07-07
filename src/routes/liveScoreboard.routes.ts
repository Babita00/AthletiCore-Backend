// routes/liveScoreboard.routes.ts
import { Router } from 'express';
import { getLiveScoreboard } from '../controllers/liveScoreboard.controller';

const router = Router();

router.get('/:eventId', getLiveScoreboard); // e.g. /api/live-scoreboard/:eventId

export default router;
