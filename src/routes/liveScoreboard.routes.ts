import { Router } from 'express';
import {
  getLiveScoreboard,
  getIndividualLiftBreakdown,
  getPlayerMeasurements,
} from '../controllers/liveScoreboard.controller';

const router = Router();

// Live scoreboard data for GameResultsTable
router.get('/live/:eventId', getLiveScoreboard);

// Detailed breakdown for IndividualPlayerView
router.get('/breakdown/:eventId', getIndividualLiftBreakdown);

// Player measurements for PlayerMeasurementsTable
router.get('/measurements/:eventId', getPlayerMeasurements);

export default router;
